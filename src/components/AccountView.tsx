import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  ShieldCheck, Globe, Lock, AlertCircle, Copy, Check,
  Mail, ShoppingBag, RefreshCw, LogOut, ExternalLink,
  Award, KeyRound, ArrowRight, RotateCcw, ShieldAlert,
  Sliders, Cpu,
} from 'lucide-react';
import { LicenseInfo } from '../types';
import appIcon from '../assets/app-icon.png';
import { AdminGodModePanel } from './AdminGodModePanel';

interface AccountViewProps {
  accentColor: string;
  license: LicenseInfo | null;
  setLicense: (license: LicenseInfo | null) => void;
  authStep: 'EMAIL' | 'OTP';
  inputEmail: string;
  setInputEmail: (v: string) => void;
  inputCode: string;
  setInputCode: (v: string) => void;
  hintCode: string | null;
  loadingActivation: boolean;
  copiedId: boolean;
  setAuthStep: (v: 'EMAIL' | 'OTP') => void;
  loadLicense: () => Promise<void>;
  handleRequestCode: () => Promise<void>;
  handleVerifyCode: () => Promise<void>;
  handleStoreActivation: () => Promise<void>;
  handleLogout: () => Promise<void>;
  handleCopyMachineId: () => void;
}

/**
 * 👤 Aba "Minha Conta" — gerencia autenticação por e-mail/OTP, ativação via
 * Microsoft Store, exibição do plano ativo e simulação de planos (Master Account).
 * Extraído de App.tsx para reduzir o monólito e isolar a lógica de licenciamento visual.
 */
export const AccountView: React.FC<AccountViewProps> = ({
  accentColor,
  license,
  setLicense,
  authStep,
  inputEmail,
  setInputEmail,
  inputCode,
  setInputCode,
  hintCode,
  loadingActivation,
  copiedId,
  setAuthStep,
  loadLicense,
  handleRequestCode,
  handleVerifyCode,
  handleStoreActivation,
  handleLogout,
  handleCopyMachineId,
}) => {
  return (
    <div className="liquid-glass-surface p-6 rounded-3xl max-w-3xl space-y-6 shadow-sm overflow-y-auto max-h-full mx-auto">

      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e2e34] pb-4">
        <div className="flex items-center">
          <img src={appIcon} alt="Foldex Automate Logo" className="w-6 h-6 object-contain mr-2 drop-shadow-sm" />
          <span className="text-lg font-extrabold text-slate-900 dark:text-white mr-1.5 tracking-tight">FOLDEX AUTOMATE</span>
          <span className="text-xs text-slate-400 font-semibold lowercase mr-2 mt-1">by</span>
          <img src="/logotipo-black.png" alt="BINAVER" className="h-6 sm:h-7 object-contain mt-1 dark:hidden" />
          <img src="/logotipo-white.png" alt="BINAVER" className="h-6 sm:h-7 object-contain mt-1 hidden dark:block" />
        </div>

        <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border shadow-xs ${
          license?.is_activated
            ? 'bg-green-50/80 dark:bg-green-950/40 text-green-600 border-green-200/50 dark:border-green-800'
            : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 border-amber-200/50 dark:border-amber-800'
        }`}>
          {license?.is_activated ? <ShieldCheck size={15} /> : <AlertCircle size={15} />}
          <span>{license?.is_activated ? 'Licença Ativa' : 'Modo Demonstração (Trial)'}</span>
        </div>
      </div>

      {license?.is_activated ? (
        <div className="p-5 bg-slate-50/50 dark:bg-[#18181b]/50 rounded-2xl border border-slate-200/50 dark:border-[#2e2e34]/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assinatura Vinculada</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                {license?.plan_name ?? 'Plano desconhecido'}
              </h3>
              <p className="text-xs text-slate-500">
                {license?.user_email ? `Conta: ${license.user_email}` : `Chave: ${license?.license_key ?? '—'}`}
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/50 dark:border-[#2d2d34]/50 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Dispositivo Atual</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{license?.machine_id ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Canal de Licenciamento</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">
                {license?.source_channel === 'MICROSOFT_STORE' ? 'Microsoft Store (Windows)' : 'Binaver Cloud SaaS'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 bg-blue-50/40 dark:bg-blue-950/20 rounded-2xl border border-blue-200/50 dark:border-blue-900/50 space-y-3">
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
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white/70 dark:bg-[#18181b]/70 border border-blue-200 dark:border-blue-800 rounded-xl text-slate-800 dark:text-white font-medium outline-none focus:ring-1 focus:ring-blue-500"
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
                  <div className="p-2 bg-blue-100/70 dark:bg-blue-900/40 rounded-lg text-[10px] text-blue-800 dark:text-blue-200 flex items-center justify-between">
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

          <div className="p-4 bg-slate-50/50 dark:bg-[#18181b]/50 rounded-2xl border border-slate-200/50 dark:border-[#2e2e34]/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-[#27272a] text-slate-700 dark:text-slate-200">
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

      <AdminGodModePanel accentColor={accentColor} license={license} setLicense={setLicense} />

      <div className="p-4 bg-slate-50/50 dark:bg-[#18181b]/50 rounded-2xl border border-slate-200/50 dark:border-[#2e2e34]/50 text-xs space-y-2 text-slate-600 dark:text-slate-400">
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
            <span>ID: {license?.machine_id ?? '—'}</span>
            {copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
          </button>
        </div>
        <p className="text-[11px] leading-relaxed flex items-center flex-wrap">
          © 2026
          <strong className="flex items-center mx-1">
            <img src="/logotipo-black.png" alt="BINAVER" className="h-4 w-auto object-contain dark:hidden" />
            <img src="/logotipo-white.png" alt="BINAVER" className="h-4 w-auto object-contain hidden dark:block" />
            <span className="ml-1">Soluções Tecnológicas - Ltda</span>
          </strong>. Todos os direitos reservados. O software e seus módulos de governança de arquivos, auditoria e compressão são protegidos por leis de propriedade intelectual.
        </p>
      </div>

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
              <option value="Foldex Automate Basic">Simular: Foldex Automate Basic (Plano Básico)</option>
              <option value="Foldex Automate Pro">Simular: Foldex Automate Pro (Plano Profissional)</option>
              <option value="Foldex Automate Enterprise">Simular: Foldex Automate Enterprise (Plano Corporativo)</option>
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
        <ExternalLink size={14} />
      </button>
    </div>
  );
};
