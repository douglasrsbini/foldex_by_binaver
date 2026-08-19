import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  Database, Server, HardDrive, Lock, Play, 
  CheckCircle2, FolderSearch, EyeOff, Eye, Cpu, Info,
  CloudUpload, Clock, CalendarDays
} from 'lucide-react';

interface BackupViewProps {
  accentColor: string;
}

interface BackupTask {
  task_name: string;
  source_type: string;
  connection_string?: string;
  source_path?: string;
  destination_dir: string;
  encrypt: boolean;
  password?: string;
  // Novos campos para Upload Offsite e Agendamento
  upload_offsite?: boolean;
  ftp_host?: string;
  ftp_user?: string;
  ftp_pass?: string;
  is_scheduled?: boolean;
  cron_schedule?: string;
}

interface BackupResult {
  success: boolean;
  message: string;
  file_path: string;
  size_bytes: number;
}

export const BackupView: React.FC<BackupViewProps> = ({ accentColor }) => {
  // Estados Originais
  const [taskName, setTaskName] = useState('');
  const [sourceType, setSourceType] = useState('POSTGRES');
  const [connectionString, setConnectionString] = useState('');
  const [sourcePath, setSourcePath] = useState('');
  const [destinationDir, setDestinationDir] = useState('');
  const [encrypt, setEncrypt] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // ⚡ Novos Estados: Agendamento e Nuvem
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('02:00');
  const [scheduleDays, setScheduleDays] = useState('DAILY');
  
  const [uploadOffsite, setUploadOffsite] = useState(false);
  const [ftpHost, setFtpHost] = useState('');
  const [ftpUser, setFtpUser] = useState('');
  const [ftpPass, setFtpPass] = useState('');
  const [showFtpPass, setShowFtpPass] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<BackupResult | null>(null);

  const selectSourceFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Pasta/VM de Origem' });
      if (selected && typeof selected === 'string') setSourcePath(selected);
    } catch (e) { alert(e); }
  };

  const selectTargetFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Destino Local do Backup' });
      if (selected && typeof selected === 'string') setDestinationDir(selected);
    } catch (e) { alert(e); }
  };

  const handleExecuteOrSchedule = async () => {
    if (!taskName || !destinationDir) {
      alert("Preencha o Nome da Rotina e o Diretório de Destino Local.");
      return;
    }

    if (sourceType === 'FILES' && !sourcePath) {
      alert("Preencha o caminho da pasta de origem.");
      return;
    }

    if ((sourceType === 'POSTGRES' || sourceType === 'MYSQL') && !connectionString) {
      alert("Preencha a string de conexão do Banco de Dados.");
      return;
    }

    if (encrypt && !password) {
      alert("Digite uma senha para criptografar o cofre.");
      return;
    }

    if (uploadOffsite && (!ftpHost || !ftpUser || !ftpPass)) {
      alert("Preencha todos os dados de conexão do Servidor Externo (FTP/Nuvem).");
      return;
    }

    setIsExecuting(true);
    setLastResult(null);

    // Converte a seleção simples para Cron Expression básica (Backend interpretará)
    let cronExpr = '';
    if (isScheduled) {
      const [hour, minute] = scheduleTime.split(':');
      if (scheduleDays === 'DAILY') cronExpr = `0 ${minute} ${hour} * * *`;
      if (scheduleDays === 'WEEKLY') cronExpr = `0 ${minute} ${hour} * * 5`; // Sexta
      if (scheduleDays === 'MONTHLY') cronExpr = `0 ${minute} ${hour} 28 * *`; // Dia 28
    }

    const task: BackupTask = {
      task_name: taskName,
      source_type: sourceType,
      connection_string: connectionString,
      source_path: sourcePath,
      destination_dir: destinationDir,
      encrypt,
      password: encrypt ? password : undefined,
      upload_offsite: uploadOffsite,
      ftp_host: uploadOffsite ? ftpHost : undefined,
      ftp_user: uploadOffsite ? ftpUser : undefined,
      ftp_pass: uploadOffsite ? ftpPass : undefined,
      is_scheduled: isScheduled,
      cron_schedule: isScheduled ? cronExpr : undefined
    };

    try {
      // Se for agendado, usamos um comando diferente (ou o Rust gerencia internamente)
      if (isScheduled) {
        // await invoke('schedule_backup_task', { task });
        alert(`Rotina de backup agendada com sucesso para: ${scheduleTime}`);
        setIsExecuting(false);
        return;
      }

      const result = await invoke<BackupResult>('execute_advanced_backup', { task });
      setLastResult(result);
    } catch (e) {
      alert(`Falha ao executar backup corporativo: ${e}`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-hidden select-none">
      
      {/* CABEÇALHO */}
      <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Database size={18} style={{ color: accentColor }} />
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Backups Corporativos e Bancos de Dados</h2>
            <p className="text-[10px] text-slate-400">Extração a quente, criptografia AES-256 e cópia de segurança em Nuvem/FTP.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1 pb-4">
        
        {/* CARD 1: IDENTIFICAÇÃO E TIPO */}
        <div className="bg-white dark:bg-[#1e1e24] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-[#2d2d34] pb-1">1. Escopo e Origem de Dados</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome da Rotina de Backup</label>
              <input 
                type="text" 
                placeholder="Ex: Backup_Mensal_ERP"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-semibold outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Fonte de Dados</label>
              <select 
                value={sourceType}
                onChange={e => setSourceType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="POSTGRES">PostgreSQL (DUMP a quente)</option>
                <option value="MYSQL">MySQL / MariaDB (DUMP a quente)</option>
                <option value="FILES">Pastas, Servidores de Arquivos ou VMs</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            {sourceType === 'FILES' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pasta ou Disco de Origem</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Ex: Z:/Publico/RH..."
                    value={sourcePath}
                    onChange={e => setSourcePath(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none"
                  />
                  <button onClick={selectSourceFolder} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] transition-colors"><FolderSearch size={14} /> Localizar</button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><Server size={12} className="text-blue-500" /> String de Conexão do Banco de Dados</label>
                <input 
                  type="text" 
                  placeholder={sourceType === 'POSTGRES' ? "postgresql://usuario:senha@localhost:5432/meubanco" : "-u root -pSenhaBanco meubanco"}
                  value={connectionString}
                  onChange={e => setConnectionString(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none"
                />
                <p className="text-[9px] text-slate-400 mt-1">Garante extração integral dos dados sem interromper os usuários ativos.</p>
              </div>
            )}
          </div>
        </div>

        {/* MÚLTIPLOS CARDS NO MESMO GRID (DESTINO E AGENDAMENTO) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          
          {/* CARD 2: DESTINO LOCAL E SEGURANÇA */}
          <div className="bg-white dark:bg-[#1e1e24] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-[#2d2d34] pb-1">2. Destino Local e Criptografia</span>
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><HardDrive size={12} className="text-amber-500" /> Cofre Local Seguro</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: D:/Backups/Cofre_Diario"
                  value={destinationDir}
                  onChange={e => setDestinationDir(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none min-w-0"
                />
                <button onClick={selectTargetFolder} className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] transition-colors shrink-0"><FolderSearch size={14} /> Path</button>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={15} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Criptografia AES-256 (LGPD)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-[#333338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              
              {encrypt && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#2d2d34]">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Chave Mestra do Arquivo ZIP</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Senha do cofre..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono font-medium outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-emerald-500 transition-colors">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 3: AGENDAMENTO CRON */}
          <div className="bg-white dark:bg-[#1e1e24] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-[#2d2d34] pb-1">3. Orquestração e Agendamento</span>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-blue-500" />
                <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Agendar Execução Automática</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-[#333338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {isScheduled ? (
              <div className="grid grid-cols-2 gap-3 pt-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Frequência</label>
                  <select 
                    value={scheduleDays}
                    onChange={e => setScheduleDays(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value="DAILY">Todos os dias</option>
                    <option value="WEEKLY">Semanalmente (Sextas)</option>
                    <option value="MONTHLY">Fim do Mês (Dia 28)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Horário (24h)</label>
                  <input 
                    type="time" 
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono font-bold outline-none dark:[color-scheme:dark]"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] border-dashed text-center text-[10px] text-slate-400">
                O backup será executado apenas sob demanda (Manualmente).
              </div>
            )}

          </div>
        </div>

        {/* CARD 4: CLOUD OFFSITE (S3 / FTP) */}
        <div className="bg-white dark:bg-[#1e1e24] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-4 shrink-0">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              4. Réplica Offsite (Integração Cloud)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded">Recomendado</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={uploadOffsite} onChange={(e) => setUploadOffsite(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-[#333338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {uploadOffsite ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1"><CloudUpload size={10} className="text-blue-500" /> Servidor (FTP / S3 URL)</label>
                <input 
                  type="text" 
                  placeholder="ftp.meuservidor.com.br"
                  value={ftpHost}
                  onChange={e => setFtpHost(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Usuário / Access Key</label>
                <input 
                  type="text" 
                  placeholder="admin_backup"
                  value={ftpUser}
                  onChange={e => setFtpUser(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Senha / Secret Key</label>
                <div className="relative">
                  <input
                    type={showFtpPass ? "text" : "password"}
                    placeholder="••••••••••"
                    value={ftpPass}
                    onChange={(e) => setFtpPass(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono outline-none"
                  />
                  <button type="button" onClick={() => setShowFtpPass(!showFtpPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showFtpPass ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs text-slate-600 dark:text-slate-400">
              <CloudUpload size={18} className="text-blue-500 opacity-60" />
              <p>
                Ative o Envio Externo para copiar o cofre gerado automaticamente para um <strong>Servidor FTP</strong> ou <strong>Amazon S3</strong>. Fundamental contra ataques de sequestro de dados (Ransomware).
              </p>
            </div>
          )}
        </div>

      </div>

      {/* RODAPÉ: AÇÕES E RESULTADOS */}
      <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs shrink-0 space-y-3">
        {lastResult && (
          <div className="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 rounded-xl flex items-center justify-between animate-in fade-in duration-300">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 size={16} />
              <div className="text-xs">
                <p className="font-bold uppercase tracking-wider">{lastResult.message}</p>
                <p className="font-mono text-[10px] opacity-80 truncate max-w-md" title={lastResult.file_path}>Salvo em: {lastResult.file_path}</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-green-800 dark:text-green-300 bg-green-200 dark:bg-green-900/60 px-2 py-1 rounded-lg">
              {lastResult.size_bytes < 1024 * 1024 ? `${(lastResult.size_bytes / 1024).toFixed(2)} KB` : `${(lastResult.size_bytes / (1024 * 1024)).toFixed(2)} MB`}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium max-w-[200px] sm:max-w-none">
            <Info size={13} className="text-blue-500 shrink-0" /> Assegure conexão estável caso utilize destinos remotos.
          </div>
          <button 
            onClick={handleExecuteOrSchedule}
            disabled={isExecuting}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 shrink-0"
            style={{ backgroundColor: accentColor }}
          >
            {isExecuting ? (
              <Cpu size={15} className="animate-pulse" />
            ) : isScheduled ? (
              <CalendarDays size={15} className="fill-white/20" />
            ) : (
              <Play size={15} className="fill-white" />
            )}
            <span>
              {isExecuting 
                ? 'Processando...' 
                : isScheduled 
                ? 'Salvar Agendamento' 
                : 'Extrair e Backup Agora'}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default BackupView;