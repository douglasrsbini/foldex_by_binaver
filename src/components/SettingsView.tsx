import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  isPermissionGranted, 
  requestPermission, 
  sendNotification 
} from '@tauri-apps/plugin-notification';
import { 
  Settings2, Palette, Bell, Save, Check, 
  ShieldAlert, FolderArchive, RotateCcw, Bot, BellRing, Sun, Moon, 
  Cpu, Calculator, Lock, EyeOff, Eye
} from 'lucide-react';

interface SettingsViewProps {
  theme: 'Light' | 'Dark';
  setTheme: (theme: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  setTheme,
  accentColor,
  setAccentColor,
  hourlyRate,
  setHourlyRate,
}) => {
  // Notificações do Sistema
  const [masterNotif, setMasterNotif] = useState<boolean>(() => {
    return localStorage.getItem('notif_master_enabled') !== 'false';
  });
  const [notifAutoExec, setNotifAutoExec] = useState<boolean>(() => {
    return localStorage.getItem('notif_auto_execution') !== 'false';
  });
  const [notifBackupZip, setNotifBackupZip] = useState<boolean>(() => {
    return localStorage.getItem('notif_backup_zip') !== 'false';
  });
  const [notifRollback, setNotifRollback] = useState<boolean>(() => {
    return localStorage.getItem('notif_rollback') !== 'false';
  });
  const [notifIntegrity, setNotifIntegrity] = useState<boolean>(() => {
    return localStorage.getItem('notif_integrity_alerts') !== 'false';
  });

  // Automação, ROI e Segurança
  const [autopilotMode, setAutopilotMode] = useState<string>(() => {
    return localStorage.getItem('autopilot_mode') || 'REALTIME';
  });
  const [inputRate, setInputRate] = useState<string>(hourlyRate.toString());
  
  // Senha do Cofre AES-256
  const [zipPassword, setZipPassword] = useState<string>(() => {
    return localStorage.getItem('backup_zip_password') || '';
  });
  const [showZipPassword, setShowZipPassword] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const presetColors = [
    { name: 'Azul Corporativo', value: '#0078d4' },
    { name: 'Verde Esmeralda', value: '#10b981' },
    { name: 'Roxo Enterprise', value: '#8b5cf6' },
    { name: 'Laranja Moderno', value: '#f97316' },
    { name: 'Ciano Tecnológico', value: '#06b6d4' },
  ];

  const handleSaveSettings = async () => {
    const rate = parseFloat(inputRate) || 35.0;
    setHourlyRate(rate);

    localStorage.setItem('notif_master_enabled', masterNotif.toString());
    localStorage.setItem('notif_auto_execution', notifAutoExec.toString());
    localStorage.setItem('notif_backup_zip', notifBackupZip.toString());
    localStorage.setItem('notif_rollback', notifRollback.toString());
    localStorage.setItem('notif_integrity_alerts', notifIntegrity.toString());
    localStorage.setItem('autopilot_mode', autopilotMode);
    localStorage.setItem('backup_zip_password', zipPassword);

    try {
      await Promise.all([
        invoke('save_setting', { key: 'notif_master_enabled', value: masterNotif.toString() }),
        invoke('save_setting', { key: 'notif_auto_execution', value: notifAutoExec.toString() }),
        invoke('save_setting', { key: 'notif_backup_zip', value: notifBackupZip.toString() }),
        invoke('save_setting', { key: 'notif_rollback', value: notifRollback.toString() }),
        invoke('save_setting', { key: 'notif_integrity_alerts', value: notifIntegrity.toString() }),
        invoke('save_setting', { key: 'autopilot_mode', value: autopilotMode }),
        invoke('save_setting', { key: 'backup_zip_password', value: zipPassword }),
      ]);
    } catch (e) {
      console.error('Falha ao persistir no SQLite:', e);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestNotification = async () => {
    try {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }

      if (permissionGranted) {
        sendNotification({
          title: 'Foldex by BINAVER',
          body: 'As notificações do sistema operacional estão configuradas e funcionando!',
        });
      } else {
        await invoke('show_system_notification', {
          notifType: 'GENERAL',
          title: 'Foldex by BINAVER',
          body: 'Notificação de teste executada com sucesso via motor nativo.',
        });
      }
    } catch (e) {
      try {
        await invoke('show_system_notification', {
          notifType: 'GENERAL',
          title: 'Foldex by BINAVER',
          body: 'Notificação de teste executada com sucesso via motor nativo.',
        });
      } catch (err) {
        alert(`Erro ao disparar notificação: ${err}`);
      }
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1 select-none w-full">
      
      {/* Cabeçalho */}
      <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Settings2 size={18} style={{ color: accentColor }} />
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Preferências & Configurações do Sistema
            </h2>
            <p className="text-[11px] text-slate-400">Personalize o comportamento das notificações, tema, automações e segurança</p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          style={{ backgroundColor: accentColor }}
        >
          {savedSuccess ? <Check size={14} /> : <Save size={14} />}
          <span>{savedSuccess ? 'Preferências Salvas!' : 'Salvar Configurações'}</span>
        </button>
      </div>

      {/* Grid com 4 Painéis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 🔔 Painel 1: Central de Notificações */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e2e34] pb-3">
            <div className="flex items-center gap-2">
              <Bell size={16} style={{ color: accentColor }} />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Notificações do Windows
              </h3>
            </div>
            <button
              onClick={handleTestNotification}
              disabled={!masterNotif}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 disabled:opacity-40 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] transition-colors"
            >
              <BellRing size={12} /> Testar
            </button>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Notificações Globais
              </span>
              <span className="text-[11px] text-slate-400">Ativar ou silenciar todos os avisos</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={masterNotif} onChange={(e) => setMasterNotif(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-[#333338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className={`space-y-2 text-xs transition-opacity ${masterNotif ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Eventos Específicos:</span>
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181b] cursor-pointer">
              <div className="flex items-center gap-2"><Bot size={14} className="text-green-600" /><span className="text-slate-700 dark:text-slate-300 font-medium">Execução Automática de Regras</span></div>
              <input type="checkbox" checked={notifAutoExec} onChange={(e) => setNotifAutoExec(e.target.checked)} className="rounded text-blue-600 h-4 w-4" />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181b] cursor-pointer">
              <div className="flex items-center gap-2"><FolderArchive size={14} className="text-blue-500" /><span className="text-slate-700 dark:text-slate-300 font-medium">Backups e Pacotes .ZIP</span></div>
              <input type="checkbox" checked={notifBackupZip} onChange={(e) => setNotifBackupZip(e.target.checked)} className="rounded text-blue-600 h-4 w-4" />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181b] cursor-pointer">
              <div className="flex items-center gap-2"><RotateCcw size={14} className="text-red-500" /><span className="text-slate-700 dark:text-slate-300 font-medium">Restaurações (Rollback)</span></div>
              <input type="checkbox" checked={notifRollback} onChange={(e) => setNotifRollback(e.target.checked)} className="rounded text-blue-600 h-4 w-4" />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#18181b] cursor-pointer">
              <div className="flex items-center gap-2"><ShieldAlert size={14} className="text-purple-500" /><span className="text-slate-700 dark:text-slate-300 font-medium">Alertas e Integridade</span></div>
              <input type="checkbox" checked={notifIntegrity} onChange={(e) => setNotifIntegrity(e.target.checked)} className="rounded text-blue-600 h-4 w-4" />
            </label>
          </div>
        </div>

        {/* 🎨 Painel 2: Tema & Identidade Visual */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2e2e34] pb-3">
            <Palette size={16} style={{ color: accentColor }} />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Tema & Cores
            </h3>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tema Visual:</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setTheme('Light')} className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${theme === 'Light' ? 'bg-blue-50 text-blue-600 border-blue-300 dark:bg-blue-950/40' : 'bg-slate-50 dark:bg-[#18181b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2e2e34]'}`}><Sun size={14} /><span>Claro</span></button>
              <button onClick={() => setTheme('Dark')} className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors ${theme === 'Dark' ? 'bg-blue-950/60 text-blue-400 border-blue-800' : 'bg-slate-50 dark:bg-[#18181b] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2e2e34]'}`}><Moon size={14} /><span>Escuro</span></button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cor de Destaque Corporativa:</span>
            <div className="flex flex-wrap items-center gap-2">
              {presetColors.map(c => (
                <button key={c.value} onClick={() => setAccentColor(c.value)} className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${accentColor === c.value ? 'scale-110 ring-2 ring-offset-2 ring-blue-500' : 'hover:scale-105'}`} style={{ backgroundColor: c.value }} title={c.name}>
                  {accentColor === c.value && <Check size={13} className="text-white" />}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-[#2e2e34]">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0" title="Cor personalizada" />
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">{accentColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ⚙️ Painel 3: Motor de Automação & Segurança (CRIPTO) */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2e2e34] pb-3">
            <Cpu size={16} style={{ color: accentColor }} />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Motor de Automação & Segurança
            </h3>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequência da Varredura Ociosa:</span>
            <select value={autopilotMode} onChange={(e) => setAutopilotMode(e.target.value)} className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer">
              <option value="REALTIME" className="bg-white dark:bg-[#202024]">Tempo Real (Instantâneo)</option>
              <option value="INTERVAL_1M" className="bg-white dark:bg-[#202024]">A cada 1 minuto</option>
              <option value="INTERVAL_5M" className="bg-white dark:bg-[#202024]">A cada 5 minutos</option>
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2e2e34]">
            <div className="flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Criptografia AES-256 para Backups (.ZIP):</span>
            </div>
            
            <div className="relative">
              <input
                type={showZipPassword ? "text" : "password"}
                placeholder="Deixe em branco para ZIPs desprotegidos..."
                value={zipPassword}
                onChange={(e) => setZipPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-slate-800 dark:text-white font-mono font-medium outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowZipPassword(!showZipPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {showZipPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Ao preencher esta chave, toda regra com a ação <strong>COMPACTAR (.ZIP)</strong> gerará cofres protegidos contra acesso não autorizado (Padrão LGPD).
            </p>
          </div>
        </div>

        {/* 📈 Painel 4: Parâmetros Financeiros & ROI */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2e2e34] pb-3">
            <Calculator size={16} style={{ color: accentColor }} />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Parâmetros de Retorno (ROI)
            </h3>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Custo Médio da Hora (Hora-Homem):</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">R$</span>
              <input type="number" step="0.5" value={inputRate} onChange={(e) => setInputRate(e.target.value)} className="w-36 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none" />
              <span className="text-xs text-slate-400">/ hora</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              Utilizado no painel de <strong>Relatórios & Métricas</strong> para calcular a economia financeira gerada pela eliminação de tarefas manuais.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;