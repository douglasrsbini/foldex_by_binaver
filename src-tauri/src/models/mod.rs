use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RuleFilter {
    pub id: Option<i64>,
    pub field_name: String,
    pub operator: String,
    pub value: String,
    pub logic_connector: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RuleAction {
    pub id: Option<i64>,
    pub action_type: String,
    pub target_pattern: String,
    // ⚡ Novos campos mapeados
    pub clean_accents: Option<bool>,
    pub replace_spaces: Option<bool>,
    pub case_format: Option<String>,
    pub regex_pattern: Option<String>,
    pub regex_replacement: Option<String>,
    // 🔄 Formato de destino quando action_type == "CONVERT_FORMAT"
    pub convert_format: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Rule {
    pub id: Option<i64>,
    pub custom_code: String,
    pub name: String,
    pub source_directory: String,
    pub logic_operator: String,
    pub is_active: bool,
    pub is_sentinel_active: Option<bool>,
    pub conflict_policy: Option<String>,
    pub filters: Vec<RuleFilter>,
    pub actions: Vec<RuleAction>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size_bytes: u64,
    pub size_formatted: String,
    pub modified_at: String,
    pub extension: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileProperties {
    pub name: String,
    pub full_path: String,
    pub is_dir: bool,
    pub size_bytes: u64,
    pub size_formatted: String,
    pub created_at: String,
    pub modified_at: String,
    pub is_readonly: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DryRunResult {
    pub filename: String,
    pub source: String,
    pub destination: String,
    pub action: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditLog {
    pub id: Option<i64>,
    pub batch_id: String,
    pub rule_id: Option<i64>,
    pub action_type: String,
    pub original_path: String,
    pub destination_path: Option<String>,
    pub file_size_bytes: i64,
    pub status: String,
    pub executed_at: String,
    pub is_reversible: bool,
    pub file_hash_sha256: Option<String>,
    pub prev_log_hash: Option<String>,
    pub current_log_hash: Option<String>,
    pub windows_user: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IntegrityReport {
    pub is_valid: bool,
    pub total_records: usize,
    pub verified_records: usize,
    pub compromised_id: Option<i64>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LicenseInfo {
    pub is_activated: bool,
    pub user_email: Option<String>,
    pub license_key: Option<String>,
    pub machine_id: String,
    pub plan_name: String,
    pub max_rules: i64,
    pub is_sentinel_allowed: bool,
    pub source_channel: String,
    pub expires_at: Option<String>,
}

// ============================================================
// 🩺 STORAGE HEALTH — Monitoramento de Armazenamento (Item 1)
// ============================================================

/// Um grupo de arquivos idênticos (mesmo hash Blake3), com o caminho
/// sugerido para manter e a lista de duplicatas candidatas à remoção.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DuplicateGroup {
    pub hash: String,
    pub size_bytes: u64,
    pub keep_path: String,
    pub duplicate_paths: Vec<String>,
}

/// Um arquivo classificado como "lixo digital" (temporários, logs antigos,
/// instaladores etc.) segundo heurísticas de nome/extensão/idade.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JunkFileEntry {
    pub path: String,
    pub size_bytes: u64,
    pub reason: String,
}

/// Relatório consolidado de saúde do armazenamento de um diretório escaneado.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct StorageHealthReport {
    pub scanned_path: String,
    pub total_files_scanned: u64,
    pub total_size_bytes: u64,
    pub duplicate_groups: Vec<DuplicateGroup>,
    pub duplicate_wasted_bytes: u64,
    pub junk_files: Vec<JunkFileEntry>,
    pub junk_total_bytes: u64,
}

// ============================================================
// 🔎 OCR — Motor de Triagem por Reconhecimento de Texto (Item 2)
// ============================================================

/// Resultado bruto da extração de texto de um arquivo (PDF escaneado ou imagem).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OcrExtractionResult {
    pub path: String,
    pub extracted_text: Option<String>,
    pub success: bool,
    pub message: Option<String>,
}

// ============================================================
// 🤖 IA CONTEXTUAL — Renomeação Cognitiva (Item 3)
// ============================================================

/// Sugestão gerada pela IA a partir do conteúdo OCR de um documento:
/// tipo de documento identificado + nome de arquivo sugerido.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AiRenameSuggestion {
    pub original_path: String,
    pub document_type: Option<String>,
    pub suggested_filename: Option<String>,
    pub confidence_note: Option<String>,
}

// ============================================================
// 🔄 PIPELINE DE CONVERSÃO — Item 4
// ============================================================

/// Resultado de uma operação de conversão de formato de arquivo.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversionResult {
    pub source_path: String,
    pub output_path: Option<String>,
    pub success: bool,
    pub message: String,
}
