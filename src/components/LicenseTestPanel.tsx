import React from 'react';
import { useLicense } from '../context/LicenseContext';
import { Zap, Lock, Sparkles, Crown, AlertCircle } from 'lucide-react';

/**
 * 🎮 LICENSE TEST PANEL
 * Permite trocar entre planos para testes/apresentações
 * Apenas visível quando admin bypass está ativo
 */
export const LicenseTestPanel: React.FC<{ accentColor?: string }> = ({ accentColor = '#3B82F6' }) => {
  const { isAdmin, isTestMode, enableTestMode, disableTestMode, plan, setTestPlan, getTestPlans } = useLicense();

  // Não mostra se não for admin
  if (!isAdmin) return null;

  const testPlans = getTestPlans();
  const iconMap: Record<string, React.ReactNode> = {
    COMMUNITY: <Zap className="w-4 h-4" />,
    BASIC: <Lock className="w-4 h-4" />,
    PRO: <Sparkles className="w-4 h-4" />,
    ENTERPRISE: <Crown className="w-4 h-4" />,
  };

  return (
    <div className="space-y-4">
      {/* 🎮 HEADER */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-200">🎮 Modo de Teste Ativado</p>
          <p className="text-xs text-amber-300">Apenas para desenvolvedores</p>
        </div>
      </div>

      {/* 🎮 TEST MODE TOGGLE */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg liquid-glass">
        <div>
          <p className="text-sm font-medium text-slate-200">Modo de Teste</p>
          <p className="text-xs text-slate-400">Habilita seleção de planos</p>
        </div>
        <button
          onClick={isTestMode ? disableTestMode : enableTestMode}
          className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
            isTestMode
              ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
              : 'bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700'
          }`}
          style={isTestMode ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}55` } : undefined}
        >
          {isTestMode ? '✓ Ativo' : 'Desativar'}
        </button>
      </div>

      {/* 🎯 PLAN SELECTOR */}
      {isTestMode && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider px-4">Selecione um Plano</p>
          
          <div className="grid grid-cols-2 gap-3 px-4">
            {testPlans.map((testPlan) => {
              const isCurrentPlan = plan === testPlan.plan;
              return (
                <button
                  key={testPlan.plan}
                  onClick={() => setTestPlan(testPlan.plan as any)}
                  className={`p-3 rounded-lg transition-all duration-300 border group ${
                    isCurrentPlan
                      ? 'liquid-glass border-blue-400/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                      : 'frosted-glass border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{iconMap[testPlan.plan] ?? <Zap className="w-4 h-4" />}</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{testPlan.plan}</span>
                  </div>
                  <p className="text-[10px] text-slate-300 text-left line-clamp-2">{testPlan.description}</p>
                  
                  {isCurrentPlan && (
                    <div className="mt-2 pt-2 border-t border-blue-400/30">
                      <span className="text-[10px] font-semibold text-blue-300 inline-block px-2 py-1 rounded bg-blue-500/20">
                        ✓ ATIVO
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 📊 CURRENT PLAN INFO */}
          <div className="px-4 pt-2">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Plano Atual:</p>
              <p className="text-sm font-semibold text-blue-300">{plan}</p>
              <p className="text-xs text-slate-400 mt-1">Atualize este painel para ver mudanças em tempo real</p>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ WARNING */}
      <div className="px-4 pt-2">
        <p className="text-[10px] text-slate-400 italic">
          💡 Dica: O modo de teste permite demonstrar diferentes níveis de funcionalidades sem precisar de licenças reais.
        </p>
      </div>
    </div>
  );
};

export default LicenseTestPanel;
