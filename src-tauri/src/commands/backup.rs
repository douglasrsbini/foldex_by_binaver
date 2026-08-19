use std::process::Command;
use std::path::Path;
use std::fs;
use chrono::Local;
use serde::{Deserialize, Serialize};
use crate::commands::explorer::compress_items_to_zip;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupTask {
    pub task_name: String,
    pub source_type: String, // "POSTGRES", "MYSQL", "SQLSERVER", "FILES"
    pub connection_string: Option<String>, 
    pub source_path: Option<String>,
    pub destination_dir: String,
    pub encrypt: bool,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupResult {
    pub success: bool,
    pub message: String,
    pub file_path: Option<String>,
    pub size_bytes: u64,
}

#[tauri::command]
pub async fn execute_advanced_backup(task: BackupTask) -> Result<BackupResult, String> {
    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let dest_dir = Path::new(&task.destination_dir);
    
    if !dest_dir.exists() {
        fs::create_dir_all(dest_dir).map_err(|e| format!("Erro ao criar pasta destino: {}", e))?;
    }

    let mut temp_files_to_zip = Vec::new();
    let safe_name = task.task_name.replace(" ", "_").replace("/", "-").replace("\\", "-");
    let final_zip_name = dest_dir.join(format!("{}_BACKUP_{}.zip", safe_name, timestamp));

    // 1. EXTRAÇÃO DE DADOS
    match task.source_type.as_str() {
        "POSTGRES" => {
            let conn_str = task.connection_string.ok_or("String de conexão Postgres ausente.")?;
            let dump_file = dest_dir.join(format!("pg_dump_{}.sql", timestamp));
            
            let output = Command::new("pg_dump")
                .arg(&conn_str)
                .arg("-f")
                .arg(&dump_file)
                .output()
                .map_err(|e| format!("Falha ao iniciar pg_dump. Verifique se o PostgreSQL Client está instalado: {}", e))?;

            if !output.status.success() {
                return Err(format!("Erro no pg_dump: {}", String::from_utf8_lossy(&output.stderr)));
            }
            temp_files_to_zip.push(dump_file.to_string_lossy().to_string());
        },
        "MYSQL" => {
            let conn_str = task.connection_string.ok_or("Parâmetros do MySQL ausentes.")?;
            let dump_file = dest_dir.join(format!("mysql_dump_{}.sql", timestamp));
            
            // Requer sintaxe específica. Assumimos que o frontend mandará formatado ou usaremos um parser futuro.
            let output = Command::new("mysqldump")
                .arg(&conn_str)
                .arg(format!("--result-file={}", dump_file.display()))
                .output()
                .map_err(|e| format!("Falha ao iniciar mysqldump: {}", e))?;

            if !output.status.success() {
                return Err(format!("Erro no mysqldump: {}", String::from_utf8_lossy(&output.stderr)));
            }
            temp_files_to_zip.push(dump_file.to_string_lossy().to_string());
        },
        "FILES" => {
            let src = task.source_path.ok_or("Caminho de origem ausente.")?;
            if !Path::new(&src).exists() {
                return Err("Diretório ou VM de origem não encontrado(a).".into());
            }
            temp_files_to_zip.push(src);
        },
        _ => return Err("Tipo de backup não suportado.".into()),
    }

    // 2. COMPACTAÇÃO E CRIPTOGRAFIA AES-256
    let password_to_use = if task.encrypt { task.password } else { None };
    
    compress_items_to_zip(
        temp_files_to_zip.clone(),
        final_zip_name.to_string_lossy().to_string(),
        password_to_use
    )?;

    // 3. LIMPEZA SEGURA DOS DUMPS TEMPORÁRIOS
    if task.source_type == "POSTGRES" || task.source_type == "MYSQL" {
        for tmp in temp_files_to_zip {
            let _ = fs::remove_file(tmp); 
        }
    }

    let size = fs::metadata(&final_zip_name).map(|m| m.len()).unwrap_or(0);

    Ok(BackupResult {
        success: true,
        message: "Backup corporativo executado e protegido com sucesso.".into(),
        file_path: Some(final_zip_name.to_string_lossy().to_string()),
        size_bytes: size,
    })
}