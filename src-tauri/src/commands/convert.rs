use crate::commands::engine::validate_secure_path;
use crate::models::ConversionResult;
use crate::services::file_converter;
use std::path::{Path, PathBuf};

/// 🔄 Comando Tauri: converte um arquivo (Word, Excel ou Imagem) para PDF,
/// salvando o resultado no diretório de destino informado. Reaproveita a
/// blindagem de caminho seguro já usada pelo motor de regras.
#[tauri::command]
pub async fn convert_file_command(
    source_path: String,
    output_dir: String,
) -> Result<ConversionResult, String> {
    let source = PathBuf::from(&source_path);
    let output = Path::new(&output_dir).to_path_buf();

    validate_secure_path(&source)?;
    validate_secure_path(&output)?;

    tokio::task::spawn_blocking(move || file_converter::convert_file_to_pdf(&source, &output))
        .await
        .map_err(|e| format!("Erro interno ao converter arquivo: {}", e))
}
