use crate::db::schema::get_db_path;
use crate::commands::engine::execute_rule;
use std::time::Duration;
use tokio::time;
use rusqlite::Connection;
use tauri_plugin_notification::NotificationExt;

pub async fn start_background_watcher(app_handle: tauri::AppHandle) {
    let mut interval = time::interval(Duration::from_secs(5));

    loop {
        interval.tick().await;

        let (mode, master_notif, watcher_notif, active_rule_ids) = {
            match Connection::open(get_db_path()) {
                Ok(conn) => {
                    let current_mode: String = conn
                        .query_row("SELECT value FROM settings WHERE key = 'autopilot_mode'", [], |r| r.get(0))
                        .unwrap_or_else(|_| "REALTIME".to_string());

                    let master: String = conn
                        .query_row("SELECT value FROM settings WHERE key = 'notif_master_enabled'", [], |r| r.get(0))
                        .unwrap_or_else(|_| "true".to_string());

                    let watcher_pref: String = conn
                        .query_row("SELECT value FROM settings WHERE key = 'notif_auto_execution'", [], |r| r.get(0))
                        .unwrap_or_else(|_| "true".to_string());

                    let ids: Vec<i64> = match conn.prepare("SELECT id FROM rules WHERE is_sentinel_active = 1") {
                        Ok(mut stmt) => stmt
                            .query_map([], |r| r.get(0))
                            .map(|rows| rows.flatten().collect())
                            .unwrap_or_default(),
                        Err(_) => Vec::new(),
                    };

                    (current_mode, master == "true", watcher_pref == "true", ids)
                }
                Err(_) => ("REALTIME".to_string(), true, true, Vec::new()),
            }
        };

        for rule_id in active_rule_ids {
            if let Ok(batch_result) = execute_rule(rule_id).await {
                if (batch_result.starts_with("Lote") || batch_result.starts_with("BATCH-")) && master_notif && watcher_notif {
                    let _ = app_handle.notification()
                        .builder()
                        .title("Execução Automática • Foldex")
                        .body(format!("Lote {} processado com sucesso conforme suas regras.", batch_result))
                        .icon("icons/icon.ico")
                        .show();
                }
            }
        }

        let sleep_duration = if mode.starts_with("INTERVAL_") {
            let mins: u64 = mode
                .split('_')
                .last()
                .unwrap_or("1")
                .replace('M', "")
                .parse()
                .unwrap_or(1);
            Duration::from_secs(mins * 60)
        } else {
            Duration::from_secs(5)
        };

        time::sleep(sleep_duration).await;
    }
}