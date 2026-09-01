use crate::commands::engine::validate_secure_path;
use crate::models::StorageHealthReport;
use crate::services::storage_scanner;
use std::path::PathBuf;

/// 🩺 Comando Tauri: varre um diretório calculando saúde de armazenamento
/// (duplicatas via Blake3 + arquivos "lixo"). Executa em thread bloqueante
/// dedicada para não travar a UI durante a varredura de pastas grandes.
#[tauri::command]
pub async fn scan_storage_health_command(path: String) -> Result<StorageHealthReport, String> {
    let root_path = validate_secure_path(&PathBuf::from(path))?;

    tokio::task::spawn_blocking(move || storage_scanner::scan_storage_health(&root_path))
        .await
        .map_err(|e| format!("Erro interno ao processar a varredura: {}", e))?
}

/// 🧹 Comando Tauri: "One-Click Fix" — remove fisicamente uma lista de caminhos
/// (duplicatas ou arquivos-lixo escolhidos pelo usuário) e retorna os bytes liberados.
#[tauri::command]
pub async fn fix_storage_issues_command(paths: Vec<String>) -> Result<u64, String> {
    if paths.is_empty() {
        return Ok(0);
    }

    for path in &paths {
        validate_secure_path(&PathBuf::from(path))?;
    }

    tokio::task::spawn_blocking(move || storage_scanner::delete_paths_and_measure_freed(&paths))
        .await
        .map_err(|e| format!("Erro interno ao remover arquivos: {}", e))
}
