use crate::commands::engine::validate_secure_path;
use crate::models::AiRenameSuggestion;
use crate::services::{ai_document_analyzer, ocr_engine};
use std::path::Path;

/// 🤖 Comando Tauri: pipeline completo de "Tratamento por IA" — extrai o texto do
/// documento via OCR e envia ao Gemini para identificar o tipo de documento e
/// sugerir um nome de arquivo padronizado, sem que o usuário configure Regex.
#[tauri::command]
pub async fn suggest_ai_rename_command(
    file_path: String,
    api_key: String,
) -> Result<AiRenameSuggestion, String> {
    let path = Path::new(&file_path).to_path_buf();
    validate_secure_path(&path)?;

    let path_for_ocr = path.clone();
    let ocr_result = tokio::task::spawn_blocking(move || ocr_engine::extract_text_from_file(&path_for_ocr))
        .await
        .map_err(|e| format!("Erro interno ao processar OCR: {}", e))?;

    if !ocr_result.success {
        return Ok(AiRenameSuggestion {
            original_path: file_path,
            document_type: None,
            suggested_filename: None,
            confidence_note: ocr_result
                .message
                .or_else(|| Some("Não foi possível extrair o conteúdo do documento.".to_string())),
        });
    }

    let extracted_text = ocr_result.extracted_text.unwrap_or_default();

    ai_document_analyzer::suggest_rename_from_content(&file_path, &extracted_text, &api_key).await
}
