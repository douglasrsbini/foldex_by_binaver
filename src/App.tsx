import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Sidebar } from './components/Sidebar';
import { RuleBuilder } from './components/RuleBuilder';
import { FileExplorer } from './components/FileExplorer';
import { SimulationView } from './components/SimulationView';
import { HistoryView } from './components/HistoryView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { SupportView } from './components/SupportView';
import { OnboardingTour } from './components/OnboardingTour';
import { SplashScreen } from './components/SplashScreen';
import { BackupView } from './components/BackupView'; // ⚡ Nossa nova View de Backup importada aqui
import { LicenseInfo } from './types';
import { 
  ShieldCheck, 
  Globe, 
  Lock, 
  AlertCircle, 
  Copy, 
  Check, 
  Mail, 
  ShoppingBag, 
  RefreshCw, 
  LogOut, 
  ExternalLink,
  Award,
  KeyRound,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Cpu
} from 'lucide-react';

interface VerificationResponse {
  success: boolean;
  message: string;
  simulated_code?: string;
}

const getLicenseTag = (lic: LicenseInfo | null) => {
  if (!lic || !lic.is_activated) return 'Community';
  const p = lic.plan_name.toLowerCase();
  if (p.includes('enterprise') || p.includes('master')) return 'Enterprise';
  if (p.includes('pro') || p.includes('professional')) return 'Pro';
  if (p.includes('core')) return 'Core';
  return 'Core';
};

export const App: React.FC = () => {
  const [isLoadingApp, setIsLoadingApp] = useState(true);
  const [activeTab, setActiveTab] = useState('builder');
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  
  const [authStep, setAuthStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [inputEmail, setInputEmail] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [hintCode, setHintCode] = useState<string | null>(null);
  const [loadingActivation, setLoadingActivation] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    return localStorage.getItem('onboarding_tour_completed') !== 'true';
  });

  const [theme, setTheme] = useState<'Light' | 'Dark'>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return (savedTheme === 'Dark' || savedTheme === 'Light') ? savedTheme : 'Light';
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('accent_color') || '#0078d4';
  });

  const [hourlyRate, setHourlyRate] = useState<number>(() => {
    const savedRate = localStorage.getItem('roi_hourly_rate');
    return savedRate ? parseFloat(savedRate) : 35.0;
  });

  const [selectedSourcePath, setSelectedSourcePath] = useState('');

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    try {
      const res = await invoke<LicenseInfo>('get_license_status');
      setLicense(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const updateWindowTitle = async () => {
      try {
        const tag = getLicenseTag(license);
        await getCurrentWindow().setTitle(`Foldex ${tag} — by BINAVER`);
      } catch (e) {
        console.error('Falha ao atualizar o título da janela', e);
      }
    };
    updateWindowTitle();
  }, [license]);

  const handleRequestCode = async () => {
    if (!inputEmail.trim()) {
      alert('Por favor, informe seu e-mail de compra.');
      return;
    }
    setLoadingActivation(true);
    try {
      const res = await invoke<VerificationResponse>('request_login_code', { email: inputEmail });
      setAuthStep('OTP');
      if (res.simulated_code) {
        setHintCode(res.simulated_code);
      }
    } catch (e) {
      alert(`Falha ao solicitar código: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleVerifyCode = async () => {
    if (inputCode.trim().length !== 6) {
      alert('O código de verificação deve conter 6 dígitos.');
      return;
    }
    setLoadingActivation(true);
    try {
      const res = await invoke<LicenseInfo>('verify_login_code', { email: inputEmail, code: inputCode });
      setLicense(res);
      setInputEmail('');
      setInputCode('');
      setHintCode(null);
      setAuthStep('EMAIL');
      alert('Licença confirmada e ativada com sucesso.');
    } catch (e) {
      alert(`Falha na validação: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleStoreActivation = async () => {
    setLoadingActivation(true);
    try {
      const res = await invoke<LicenseInfo>('activate_store_license');
      setLicense(res);
      alert('Compra da Microsoft Store vinculada com sucesso.');
    } catch (e) {
      alert(`Falha ao vincular com a Microsoft Store: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja desconectar a licença deste computador? O aplicativo retornará ao modo Demonstração.')) {
      try {
        await invoke('logout_license');
        loadLicense();
      } catch (e) {
        alert(e);
      }
    }
  };

  const handleCopyMachineId = () => {
    if (!license) return;
    navigator.clipboard.writeText(license.machine_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleUpdateAccentColor = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accent_color', color);
  };

  const handleUpdateHourlyRate = (rate: number) => {
    setHourlyRate(rate);
    localStorage.setItem('roi_hourly_rate', rate.toString());
  };

  const handleSetSourceFromExplorer = (path: string) => {
    setSelectedSourcePath(path);
    setActiveTab('builder');
  };

  return (
    <div className="flex h-screen w-screen bg-[#f8f9fa] dark:bg-[#121214] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none">
      {isLoadingApp && (
        <SplashScreen 
          accentColor={accentColor} 
          onFinish={() => setIsLoadingApp(false)} 
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        accentColor={accentColor} 
        license={license}
      />

      <main className="flex-1 p-4 overflow-hidden relative">
        {activeTab === 'builder' && (
          <RuleBuilder 
            initialSource={selectedSourcePath} 
            accentColor={accentColor} 
            onNavigateToAccount={() => setActiveTab('account')}
          />
        )}

        {activeTab === 'explorer' && (
          <FileExplorer 
            onSetSource={handleSetSourceFromExplorer} 
            accentColor={accentColor} 
          />
        )}

        {activeTab === 'dryrun' && (
          <SimulationView 
            accentColor={accentColor} 
          />
        )}

        {activeTab === 'history' && (
          <HistoryView />
        )}

        {/* ⚡ AQUI ESTÁ A RENDERIZAÇÃO DA NOSSA NOVA TELA DE BACKUP */}
        {activeTab === 'backup' && (
          <BackupView accentColor={accentColor} />
        )}

        {activeTab === 'dashboards' && (
          <DashboardView 
            hourlyRate={hourlyRate} 
            accentColor={accentColor} 
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            theme={theme} 
            setTheme={(t) => setTheme(t as 'Light' | 'Dark')} 
            accentColor={accentColor} 
            setAccentColor={handleUpdateAccentColor}
            hourlyRate={hourlyRate}
            setHourlyRate={handleUpdateHourlyRate}
          />
        )}

        {activeTab === 'support' && (
          <SupportView 
            accentColor={accentColor} 
            onOpenTour={() => setIsTourOpen(true)}
          />
        )}

        {activeTab === 'account' && (
          <div className="p-6 bg-white dark:bg-[#1e1e24] rounded-3xl border border-slate-200 dark:border-[#2e2e34] max-w-3xl space-y-6 shadow-sm overflow-y-auto max-h-full">
            
            {/* Cabeçalho Oficial - FOLDEX by [IMG_LOGO] */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e2e34] pb-4">
              <div className="flex items-center">
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mr-1.5 tracking-tight">FOLDEX</span>
                <span className="text-xs text-slate-400 font-semibold lowercase mr-1.5 mt-0.5">by</span>
                <img src="/logotipo.png" alt="BINAVER" className="h-4 sm:h-4 object-contain mt-0.5" />
              </div>

              <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
                license?.is_activated
                  ? 'bg-green-50 dark:bg-green-950/40 text-green-600 border-green-200 dark:border-green-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-200 dark:border-amber-800'
              }`}>
                {license?.is_activated ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
                <span>{license?.is_activated ? 'Licença Ativa' : 'Modo Demonstração (Trial)'}</span>
              </div>
            </div>

            {/* Status da Licença */}
            {license?.is_activated ? (
              <div className="p-5 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2e2e34] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assinatura Vinculada</span>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Award size={16} className="text-amber-500" />
                      {license.plan_name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {license.user_email ? `Conta: ${license.user_email}` : `Chave: ${license.license_key}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadLicense}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#27272a] hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383840] flex items-center gap-1.5 transition-colors"
                      title="Atualizar status com a nuvem"
                    >
                      <RefreshCw size={13} /> Sincronizar
                    </button>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 hover:bg-red-100 text-xs font-bold border border-red-200 dark:border-red-900 flex items-center gap-1.5 transition-colors"
                      title="Desconectar deste dispositivo"
                    >
                      <LogOut size={13} /> Desconectar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-[#2d2d34] text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Dispositivo Atual</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{license.machine_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Canal de Licenciamento</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                      {license.source_channel === 'MICROSOFT_STORE' ? 'Microsoft Store (Windows)' : 'Binaver Cloud SaaS'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-xs">
                    <Mail size={16} />
                    <span>Autenticação Segura por E-mail Corporativo</span>
                  </div>

                  {authStep === 'EMAIL' ? (
                    <>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Informe o e-mail cadastrado na compra. Enviaremos um código de verificação temporário de 6 dígitos para confirmar a titularidade da sua licença.
                      </p>

                      <div className="flex gap-2">
                        <input
                          type="email"
                          placeholder="Digite seu e-mail corporativo"
                          value={inputEmail}
                          onChange={(e) => setInputEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRequestCode()}
                          disabled={loadingActivation}
                          className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-[#18181b] border border-blue-200 dark:border-blue-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={handleRequestCode}
                          disabled={loadingActivation}
                          className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                          style={{ backgroundColor: accentColor }}
                        >
                          <span>{loadingActivation ? 'Enviando...' : 'Enviar Código'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Código enviado para <strong>{inputEmail}</strong>. Insira os 6 dígitos abaixo:
                        </p>
                        <button 
                          onClick={() => { setAuthStep('EMAIL'); setInputCode(''); }} 
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw size={11} /> Trocar e-mail
                        </button>
                      </div>

                      {hintCode && (
                        <div className="p-2 bg-blue-100/70 dark:bg-blue-900/40 rounded-lg text-[11px] text-blue-800 dark:text-blue-200 flex items-center justify-between font-mono">
                          <span>Código gerado para teste local: <strong>{hintCode}</strong></span>
                          <button 
                            onClick={() => setInputCode(hintCode)} 
                            className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-sans font-bold"
                          >
                            Preencher
                          </button>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <KeyRound size={15} className="absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
                            disabled={loadingActivation}
                            autoFocus
                            className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white dark:bg-[#18181b] border border-blue-200 dark:border-blue-800 rounded-xl text-slate-800 dark:text-white font-mono tracking-widest font-bold outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleVerifyCode}
                          disabled={loadingActivation}
                          className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50 shrink-0"
                          style={{ backgroundColor: accentColor }}
                        >
                          {loadingActivation ? 'Validando...' : 'Confirmar e Ativar'}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2e2e34] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-200 dark:bg-[#27272a] text-slate-700 dark:text-slate-200">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white">Adquiriu via Microsoft Store?</h4>
                      <p className="text-[10px] text-slate-400">Sincronize sua licença com a conta Microsoft conectada</p>
                    </div>
                  </div>

                  <button
                    onClick={handleStoreActivation}
                    className="px-4 py-2 rounded-xl bg-white dark:bg-[#27272a] hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#383840] transition-colors"
                  >
                    Sincronizar Licença
                  </button>
                </div>
              </div>
            )}

            {/* Informações Institucionais */}
            <div className="p-4 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2e2e34] text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
                  <Lock size={14} style={{ color: accentColor }} />
                  <span>Termos de Uso & Propriedade Intelectual</span>
                </div>
                <button
                  onClick={handleCopyMachineId}
                  className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-mono"
                >
                  <Cpu size={12} />
                  <span>ID: {license?.machine_id}</span>
                  {copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                </button>
              </div>
              <p className="text-[11px] leading-relaxed">
                © 2026 <strong><img src="/logotipo.png" alt="BINAVER" className="h-2.5 inline-block object-contain -mt-0.5 mx-0.5 dark:brightness-150" /> Soluções Tecnológicas - Ltda</strong>. Todos os direitos reservados.
                O software e seus módulos de governança de arquivos, auditoria e compressão são protegidos por leis de propriedade intelectual.
              </p>
            </div>

            {/* ⚡ MODO ADMINISTRADOR BINAVER */}
            {license?.source_channel === 'MASTER_ACCOUNT' && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-3 mt-4 animate-in fade-in">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs">
                  <ShieldAlert size={16} />
                  <span>Ambiente de Homologação (Acesso Exclusivo BINAVER)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Transite entre os níveis de licenciamento para demonstração do produto ao cliente. Sua conta master não sofrerá downgrade definitivo.
                </p>
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-purple-500" />
                  <select
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#18181b] border border-purple-200 dark:border-purple-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                    onChange={async (e) => {
                      if (!e.target.value) return;
                      try {
                        await invoke('admin_change_plan', { newPlan: e.target.value });
                        await loadLicense();
                      } catch (err) {
                        alert(err);
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">Selecione a licença para simular...</option>
                    <option value="Foldex Core">Simular: Foldex Core (Plano Básico)</option>
                    <option value="Foldex Pro">Simular: Foldex Pro (Plano Profissional)</option>
                    <option value="Foldex Enterprise">Simular: Foldex Enterprise (Plano Corporativo)</option>
                    <option value="Binaver Enterprise Master Full">Restaurar: Licença Master Original</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              onClick={() => window.open('https://binaver.com', '_blank')}
              className="w-full py-3 rounded-2xl text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2" 
              style={{ backgroundColor: accentColor }}
            >
              <Globe size={15} /> Acessar Portal de Planos e Assinaturas (binaver.com)
              <ExternalLink size={13} />
            </button>
          </div>
        )}

        <OnboardingTour
          accentColor={accentColor}
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      </main>
    </div>
  );
};

export default App;