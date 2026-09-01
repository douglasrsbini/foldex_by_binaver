use crate::models::ConversionResult;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Formatos de origem suportados pelo pipeline de conversão nesta primeira fase.
const CONVERTIBLE_SOURCE_EXTENSIONS: &[&str] = &["docx", "doc", "xlsx", "xls", "png", "jpg", "jpeg"];

/// 🔄 Converte um arquivo (Word/Excel/Imagem) para PDF utilizando o LibreOffice
/// em modo headless (`soffice --headless --convert-to pdf`), que já sabe rasterizar
/// tanto documentos de escritório quanto imagens comuns — evitando a necessidade
/// de múltiplas bibliotecas nativas de conversão (ex.: printpdf) para cada formato.
///
/// Requisito de ambiente: o usuário precisa ter o LibreOffice instalado e o binário
/// `soffice` disponível no PATH (ou em um dos caminhos padrão de instalação do Windows).
/// Se não for encontrado, retorna erro amigável sem derrubar a aplicação.
pub fn convert_file_to_pdf(source_path: &Path, output_dir: &Path) -> ConversionResult {
    let source_str = source_path.to_string_lossy().to_string();

    if !source_path.exists() {
        return ConversionResult {
            source_path: source_str,
            output_path: None,
            success: false,
            message: "Arquivo de origem não encontrado.".to_string(),
        };
    }

    let extension = source_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    if !CONVERTIBLE_SOURCE_EXTENSIONS.contains(&extension.as_str()) {
        return ConversionResult {
            source_path: source_str,
            output_path: None,
            success: false,
            message: format!("Formato de origem '.{}' não suportado para conversão.", extension),
        };
    }

    if let Err(e) = std::fs::create_dir_all(output_dir) {
        return ConversionResult {
            source_path: source_str,
            output_path: None,
            success: false,
            message: format!("Não foi possível preparar a pasta de destino: {}", e),
        };
    }

    let soffice_binary = resolve_soffice_binary();

    let output = Command::new(&soffice_binary)
        .arg("--headless")
        .arg("--convert-to")
        .arg("pdf")
        .arg("--outdir")
        .arg(output_dir)
        .arg(source_path)
        .output();

    match output {
        Ok(result) if result.status.success() => {
            let file_stem = source_path.file_stem().map(|s| s.to_string_lossy().to_string()).unwrap_or_default();
            let expected_output: PathBuf = output_dir.join(format!("{}.pdf", file_stem));

            if expected_output.exists() {
                ConversionResult {
                    source_path: source_str,
                    output_path: Some(expected_output.to_string_lossy().to_string()),
                    success: true,
                    message: "Conversão concluída com sucesso.".to_string(),
                }
            } else {
                ConversionResult {
                    source_path: source_str,
                    output_path: None,
                    success: false,
                    message: "O LibreOffice concluiu a execução, mas o arquivo PDF esperado não foi gerado.".to_string(),
                }
            }
        }
        Ok(result) => ConversionResult {
            source_path: source_str,
            output_path: None,
            success: false,
            message: format!(
                "Falha ao converter arquivo: {}",
                String::from_utf8_lossy(&result.stderr).trim()
            ),
        },
        Err(_) => ConversionResult {
            source_path: source_str,
            output_path: None,
            success: false,
            message: "LibreOffice (soffice) não encontrado no sistema. Instale o LibreOffice para habilitar a conversão de formatos.".to_string(),
        },
    }
}

/// Tenta localizar o binário `soffice`: primeiro no PATH, depois nos caminhos
/// padrão de instalação do LibreOffice no Windows. Blindado contra ausência total.
fn resolve_soffice_binary() -> String {
    #[cfg(target_os = "windows")]
    {
        let common_paths = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ];
        for p in common_paths {
            if Path::new(p).exists() {
                return p.to_string();
            }
        }
    }
    "soffice".to_string()
}
