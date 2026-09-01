use crate::commands::engine::validate_secure_path;
use crate::models::OcrExtractionResult;
use crate::services::ocr_engine;
use std::path::{Path, PathBuf};

/// 🔎 Comando Tauri: extrai texto (OCR) de um único arquivo (PDF escaneado ou imagem).
/// Usado tanto para pré-visualização manual quanto como base do filtro de regras
/// "Conteúdo do Documento (OCR)".
#[tauri::command]
pub async fn extract_ocr_text_command(file_path: String) -> Result<OcrExtractionResult, String> {
    let path = PathBuf::from(&file_path);
    validate_secure_path(&path)?;

    tokio::task::spawn_blocking(move || ocr_engine::extract_text_from_file(&path))
        .await
        .map_err(|e| format!("Erro interno ao processar OCR: {}", e))
}

/// 🔍 Comando Tauri: verifica se o conteúdo de um arquivo (via OCR) contém uma
/// palavra-chave — usado pela etapa de simulação/execução de regras quando o
/// filtro "Conteúdo do Documento (OCR)" está ativo.
#[tauri::command]
pub async fn check_ocr_keyword_command(file_path: String, keyword: String) -> Result<bool, String> {
    let path = Path::new(&file_path).to_path_buf();
    validate_secure_path(&path)?;

    tokio::task::spawn_blocking(move || ocr_engine::file_content_matches_keyword(&path, &keyword))
        .await
        .map_err(|e| format!("Erro interno ao processar OCR: {}", e))
}
