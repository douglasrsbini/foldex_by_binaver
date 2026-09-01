use crate::models::{DuplicateGroup, JunkFileEntry, StorageHealthReport};
use rayon::prelude::*;
use std::collections::HashMap;
use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

/// Nomes/extensões considerados "lixo digital" — temporários, caches, instaladores.
const JUNK_EXTENSIONS: &[&str] = &["tmp", "temp", "log", "bak", "old", "dmp", "cache"];
const JUNK_NAME_HINTS: &[&str] = &["~$", "thumbs.db", ".ds_store", "desktop.ini"];
const JUNK_INSTALLER_EXTENSIONS: &[&str] = &["exe", "msi"];

/// 🔐 Calcula o hash Blake3 de um arquivo em streaming (não carrega tudo em memória),
/// evitando estouro de RAM em arquivos grandes. Blindado contra falhas de I/O.
fn compute_blake3_hash(path: &Path) -> Option<String> {
    let mut file = File::open(path).ok()?;
    let mut hasher = blake3::Hasher::new();
    let mut buffer = [0u8; 65536];
    loop {
        let n = file.read(&mut buffer).ok()?;
        if n == 0 {
            break;
        }
        hasher.update(&buffer[..n]);
    }
    Some(hasher.finalize().to_hex().to_string())
}

/// 🗑️ Verifica heuristicamente se um arquivo é "lixo digital" e devolve o motivo.
fn classify_junk(path: &Path) -> Option<String> {
    let file_name = path.file_name()?.to_string_lossy().to_lowercase();
    let extension = path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if JUNK_NAME_HINTS.iter().any(|hint| file_name.contains(hint)) {
        return Some("Arquivo de sistema/cache temporário (nome reconhecido)".to_string());
    }

    if JUNK_EXTENSIONS.contains(&extension.as_str()) {
        return Some(format!("Extensão típica de arquivo temporário/log (.{})", extension));
    }

    if JUNK_INSTALLER_EXTENSIONS.contains(&extension.as_str()) {
        // Instaladores só são marcados como "lixo" se estiverem em pastas comuns de downloads,
        // para não sinalizar falsos positivos em pastas de distribuição de software legítimas.
        let path_str = path.to_string_lossy().to_lowercase();
        if path_str.contains("download") {
            return Some("Instalador (.exe/.msi) encontrado em pasta de Downloads".to_string());
        }
    }

    None
}

/// 🩺 Varre um diretório (recursivamente) calculando tamanho total, duplicatas por hash
/// Blake3 e arquivos "lixo" candidatos à limpeza. Usa Rayon para paralelizar o hashing
/// e não travar a UI em pastas com muitos arquivos.
///
/// Esta função é síncrona e pesada — deve ser chamada de dentro de um
/// `tokio::task::spawn_blocking` pelo comando Tauri correspondente.
pub fn scan_storage_health(root_path: &Path) -> Result<StorageHealthReport, String> {
    if !root_path.exists() || !root_path.is_dir() {
        return Err("O diretório informado é inválido ou não existe.".to_string());
    }

    // 1️⃣ Coleta todos os arquivos (metadados leves primeiro, sem hashear ainda)
    let all_files: Vec<PathBuf> = WalkDir::new(root_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.path().to_path_buf())
        .collect();

    let total_files_scanned = all_files.len() as u64;

    let total_size_bytes: u64 = all_files
        .iter()
        .filter_map(|p| p.metadata().ok())
        .map(|m| m.len())
        .sum();

    // 2️⃣ Detecção de lixo (heurística rápida, sem hashing)
    let mut junk_files: Vec<JunkFileEntry> = Vec::new();
    let mut junk_total_bytes: u64 = 0;
    for path in &all_files {
        if let Some(reason) = classify_junk(path) {
            let size = path.metadata().map(|m| m.len()).unwrap_or(0);
            junk_total_bytes += size;
            junk_files.push(JunkFileEntry {
                path: path.to_string_lossy().to_string(),
                size_bytes: size,
                reason,
            });
        }
    }

    // 3️⃣ Hashing paralelo (Blake3 + Rayon) apenas dos arquivos que sobraram,
    // agrupando por (hash, tamanho) para detectar duplicatas reais.
    let hashed: Vec<(String, u64, PathBuf)> = all_files
        .par_iter()
        .filter_map(|path| {
            let size = path.metadata().ok()?.len();
            // Ignora arquivos vazios (hash igual não é relevante nesse caso).
            if size == 0 {
                return None;
            }
            let hash = compute_blake3_hash(path)?;
            Some((hash, size, path.clone()))
        })
        .collect();

    let mut groups: HashMap<(String, u64), Vec<PathBuf>> = HashMap::new();
    for (hash, size, path) in hashed {
        groups.entry((hash, size)).or_default().push(path);
    }

    let mut duplicate_groups: Vec<DuplicateGroup> = Vec::new();
    let mut duplicate_wasted_bytes: u64 = 0;

    for ((hash, size), mut paths) in groups {
        if paths.len() < 2 {
            continue;
        }
        // Mantém o primeiro (ordem estável) como "a manter"; o resto vira duplicata.
        paths.sort();
        let keep = paths.remove(0);
        duplicate_wasted_bytes += size * (paths.len() as u64);

        duplicate_groups.push(DuplicateGroup {
            hash,
            size_bytes: size,
            keep_path: keep.to_string_lossy().to_string(),
            duplicate_paths: paths.iter().map(|p| p.to_string_lossy().to_string()).collect(),
        });
    }

    Ok(StorageHealthReport {
        scanned_path: root_path.to_string_lossy().to_string(),
        total_files_scanned,
        total_size_bytes,
        duplicate_groups,
        duplicate_wasted_bytes,
        junk_files,
        junk_total_bytes,
    })
}

/// 🧹 Remove fisicamente uma lista de caminhos (duplicatas ou lixo confirmados
/// pelo usuário no "One-Click Fix"). Retorna quantos bytes foram efetivamente liberados.
/// Blindado: falhas individuais de remoção não interrompem o restante do lote.
pub fn delete_paths_and_measure_freed(paths: &[String]) -> u64 {
    let mut freed_bytes: u64 = 0;
    for p in paths {
        let path = Path::new(p);
        let size = path.metadata().map(|m| m.len()).unwrap_or(0);
        if std::fs::remove_file(path).is_ok() {
            freed_bytes += size;
        }
    }
    freed_bytes
}
