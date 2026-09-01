import React from 'react';
import { Crown, ShieldAlert, Sparkles } from 'lucide-react';
import { LicenseInfo } from '../types';
import { isAdminEmail } from '../services/licensePolicy';

export type MockPlanKey = 'TRIAL' | 'BASIC' | 'PRO' | 'ENTERPRISE' | 'MASTER';

interface PlanOption {
  key: MockPlanKey;
  label: string;
  description: string;
}

const PLAN_OPTIONS: PlanOption[] = [
  { key: 'TRIAL', label: 'Modo Demonstração (Trial / Inativo)', description: 'Simula um usuário sem licença ativa.' },
  { key: 'BASIC', label: 'Foldex Automate Basic', description: 'Recursos essenciais, limites reduzidos.' },
  { key: 'PRO', label: 'Foldex Automate Pro', description: 'Dashboard, Smart Organize e automações avançadas.' },
  { key: 'ENTERPRISE', label: 'Foldex Automate Enterprise', description: 'Autopilot, Sentinela e tudo do Pro.' },
  { key: 'MASTER', label: 'Binaver Enterprise Master Full', description: 'Acesso irrestrito (Admin Bypass).' },
];

/**
 * 🎭 Gera uma LicenseInfo mockada em memória para o plano escolhido, preservando
 * a identidade (e-mail/machine_id) da licença atual do admin. Nunca é persistida
 * no backend — vale apenas para a sessão corrente do React.
 */
const buildMockLicense = (plan: MockPlanKey, base: LicenseInfo | null): LicenseInfo => {
  const common = {
    user_email: base?.user_email ?? 'admin@binaver.com',
    machine_id: base?.machine_id ?? 'admin-override',
  };

  switch (plan) {
    case 'TRIAL':
      return {
        ...common,
        is_activated: false,
        license_key: undefined,
        plan_name: 'Community',
        max_rules: 5,
        is_sentinel_allowed: false,
        source_channel: 'ADMIN_MOCK_SESSION',
        expires_at: undefined,
      };
    case 'BASIC':
      return {
        ...common,
        is_activated: true,
        license_key: 'ADMIN-MOCK-BASIC',
        plan_name: 'Foldex Automate Basic',
        max_rules: 20,
        is_sentinel_allowed: false,
        source_channel: 'ADMIN_MOCK_SESSION',
        expires_at: '2099-12-31',
      };
    case 'PRO':
      return {
        ...common,
        is_activated: true,
        license_key: 'ADMIN-MOCK-PRO',
        plan_name: 'Foldex Automate Pro',
        max_rules: 100,
        is_sentinel_allowed: false,
        source_channel: 'ADMIN_MOCK_SESSION',
        expires_at: '2099-12-31',
      };
    case 'ENTERPRISE':
      return {
        ...common,
        is_activated: true,
        license_key: 'ADMIN-MOCK-ENTERPRISE',
        plan_name: 'Foldex Automate Enterprise',
        max_rules: 999999,
        is_sentinel_allowed: true,
        source_channel: 'ADMIN_MOCK_SESSION',
        expires_at: '2099-12-31',
      };
    case 'MASTER':
    default:
      return {
        ...common,
        is_activated: true,
        license_key: 'ADMIN-BYPASS-MASTER-KEY',
        plan_name: 'Binaver Enterprise Master Full',
        max_rules: 999999,
        is_sentinel_allowed: true,
        source_channel: 'ADMIN_BYPASS',
        expires_at: '2099-12-31',
      };
  }
};

/**
 * 🔎 Deriva a chave de plano mockado atualmente ativa a partir da licença em memória,
 * apenas para manter o seletor sincronizado visualmente (não afeta a lógica real).
 */
const inferCurrentPlanKey = (license: LicenseInfo | null): MockPlanKey => {
  if (!license?.is_activated) return 'TRIAL';
  const p = String(license.plan_name ?? '').toLowerCase();
  if (p.includes('master') || license.source_channel === 'ADMIN_BYPASS') return 'MASTER';
  if (p.includes('enterprise')) return 'ENTERPRISE';
  if (p.includes('pro')) return 'PRO';
  if (p.includes('basic')) return 'BASIC';
  return 'TRIAL';
};

interface AdminGodModePanelProps {
  accentColor: string;
  license: LicenseInfo | null;
  setLicense: (license: LicenseInfo | null) => void;
}

/**
 * 👑 "Admin God Mode" — painel de simulação de ambiente exclusivo para as contas
 * administrativas da BINAVER. Permite alternar instantaneamente entre os planos de
 * licenciamento para fins de demonstração/testes, sem tocar no backend/Tauri —
 * a troca vive apenas em memória (estado React) durante a sessão atual.
 *
 * Blindado: renderiza `null` para qualquer e-mail que não seja um bypass admin.
 */
export const AdminGodModePanel: React.FC<AdminGodModePanelProps> = ({ accentColor, license, setLicense }) => {
  const adminEmail = license?.user_email ?? '';
  if (!isAdminEmail(adminEmail)) return null;

  const currentPlanKey = inferCurrentPlanKey(license);

  const handleSelectPlan = (plan: MockPlanKey) => {
    const mocked = buildMockLicense(plan, license);
    setLicense(mocked);
  };

  return (
    <div
      className="relative p-5 rounded-3xl border overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-200"
      style={{
        borderColor: 'rgba(168, 85, 247, 0.35)',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.14) 0%, rgba(217,119,6,0.10) 50%, rgba(59,130,246,0.10) 100%)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px rgba(168,85,247,0.15)',
      }}
    >
      {/* Brilho decorativo de fundo */}
      <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-purple-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-amber-400/15 blur-3xl" />

      <div className="relative flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-gradient-to-br from-purple-500/25 to-amber-400/25 border border-purple-300/30 shadow-inner">
            <Crown size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
              Painel Admin: Simulação de Ambiente
              <Sparkles size={13} className="text-purple-400" />
            </h3>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400">
              Visível apenas para contas BINAVER autorizadas — altera a licença somente nesta sessão.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-400/30">
          <ShieldAlert size={12} />
          <span>Acesso Privilegiado</span>
        </div>
      </div>

      <div className="relative space-y-2">
        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          Simular nível de licenciamento
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLAN_OPTIONS.map((opt) => {
            const isActive = opt.key === currentPlanKey;
            return (
              <button
                key={opt.key}
                onClick={() => handleSelectPlan(opt.key)}
                className={`text-left p-3 rounded-2xl border transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? 'border-transparent text-white shadow-lg'
                    : 'border-slate-200/60 dark:border-[#333338] bg-white/50 dark:bg-[#18181b]/50 hover:bg-white/80 dark:hover:bg-[#202024]/80 text-slate-700 dark:text-slate-200'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${accentColor}, #a855f7)` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold">{opt.label}</span>
                  {isActive && <span className="text-[9px] font-black uppercase bg-white/25 px-1.5 py-0.5 rounded-md shrink-0">Ativo</span>}
                </div>
                <p className={`text-[10.5px] mt-0.5 leading-snug ${isActive ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}`}>
                  {opt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
