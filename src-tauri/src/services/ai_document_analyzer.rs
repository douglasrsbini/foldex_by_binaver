use crate::models::AiRenameSuggestion;
use serde_json::Value;

/// 🤖 Envia o texto extraído por OCR de um documento ao Gemini, pedindo para
/// identificar o tipo do documento e sugerir um nome de arquivo padronizado
/// (ex.: `Fatura_Energia_Agosto_2026.pdf`), sem que o usuário precise configurar Regex.
///
/// Reaproveita o mesmo padrão de chamada HTTP já usado em `generate_rule_via_ai`
/// e `chat_with_foldex_agent` (commands/engine.rs) para manter consistência.
pub async fn suggest_rename_from_content(
    original_path: &str,
    extracted_text: &str,
    api_key: &str,
) -> Result<AiRenameSuggestion, String> {
    if api_key.trim().is_empty() {
        return Err(
            "A chave da API do Google Gemini não foi configurada no painel de Configurações."
                .into(),
        );
    }

    if extracted_text.trim().is_empty() {
        return Ok(AiRenameSuggestion {
            original_path: original_path.to_string(),
            document_type: None,
            suggested_filename: None,
            confidence_note: Some(
                "Nenhum texto disponível (OCR não retornou conteúdo) para análise da IA."
                    .to_string(),
            ),
        });
    }

    let client = reqwest::Client::new();
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={}",
        api_key
    );

    let system_prompt = r#"
Você é um classificador cognitivo de documentos do sistema Foldex Enterprise (by BINAVER).

TAREFA: Receber o texto extraído (via OCR) de um documento e responder EXCLUSIVAMENTE com um
JSON válido, sem markdown, sem comentários, no seguinte formato exato:

{
  "document_type": "<tipo do documento identificado, ex: Comprovante de PIX, Conta de Luz, Nota Fiscal, Contrato>",
  "suggested_filename": "<nome de arquivo sugerido, em PascalCase separado por underscore, incluindo mês/ano quando identificável, SEM extensão, ex: Fatura_Energia_Agosto_2026>",
  "confidence_note": "<breve justificativa de 1 frase sobre por que esse nome foi escolhido>"
}

Se não for possível identificar o tipo do documento com segurança, retorne document_type como "Documento Não Identificado"
e um suggested_filename genérico baseado no conteúdo (ex: Documento_Sem_Classificacao).
"#;

    // Limita o tamanho do texto enviado para evitar payloads excessivos em documentos longos.
    let truncated_text: String = extracted_text.chars().take(6000).collect();

    let payload = serde_json::json!({
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [{
            "role": "user",
            "parts": [{"text": truncated_text}]
        }]
    });

    let res = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao conectar com a IA: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Falha na API da IA: {}", err_text));
    }

    let json_res: Value = res.json().await.map_err(|e| e.to_string())?;

    let raw_text = json_res["candidates"][0]["content"]["parts"][0]["text"]
        .as_str()
        .ok_or("A IA retornou um formato inesperado.")?;

    let clean_json = raw_text
        .replace("```json", "")
        .replace("```", "")
        .trim()
        .to_string();

    let parsed: Value = serde_json::from_str(&clean_json)
        .map_err(|e| format!("Não foi possível interpretar a resposta da IA: {}", e))?;

    Ok(AiRenameSuggestion {
        original_path: original_path.to_string(),
        document_type: parsed["document_type"].as_str().map(|s| s.to_string()),
        suggested_filename: parsed["suggested_filename"].as_str().map(|s| s.to_string()),
        confidence_note: parsed["confidence_note"].as_str().map(|s| s.to_string()),
    })
}
