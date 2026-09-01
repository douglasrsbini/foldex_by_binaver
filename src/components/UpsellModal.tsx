import React, { useState } from 'react';
import { Lock, Sparkles, ArrowRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UpsellModalProps {
  isOpen: boolean;
  feature: 'AUTOPILOT' | 'SMART_ORGANIZE' | 'DASHBOARD' | 'SENTINEL_MODE' | null;
  currentPlan: string;
  accentColor: string;
  onClose: () => void;
  onUpgrade: () => void;
}

/**
 * 💎 MODAL DE UPSELL DE ALTA CONVERSÃO
 * Exibido quando usuário tenta acessar recurso premium
 */
export const UpsellModal: React.FC<UpsellModalProps> = ({
  isOpen,
  feature,
  currentPlan,
  accentColor,
  onClose,
  onUpgrade,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !feature) return null;

  // 🎯 Dados de cada recurso premium
  const featureData: Record<string, {
    title: string;
    description: string;
    benefits: string[];
    value: string;
    emoji: string;
  }> = {
    AUTOPILOT: {
      emoji: '🤖',
      title: t('upsell.autopilot', 'Autopilot'),
      description: t('upsell.autopilot_desc', 'Automatize totalmente suas operações sem intervenção manual'),
      benefits: [
        t('upsell.benefit_24h', 'Execução 24/7 de regras'),
        t('upsell.benefit_realtime', 'Processamento em tempo real'),
        t('upsell.benefit_monitoring', 'Monitoramento inteligente'),
      ],
      value: t('upsell.value_autopilot', 'Economize 15+ horas/semana em organização manual'),
    },
    SMART_ORGANIZE: {
      emoji: '✨',
      title: t('upsell.smart_organize', 'Smart Organize'),
      description: t('upsell.smart_organize_desc', 'IA sugere automaticamente a melhor forma de organizar seus arquivos'),
      benefits: [
        t('upsell.benefit_ai_suggestions', 'Sugestões baseadas em IA'),
        t('upsell.benefit_learning', 'Aprende com seus padrões'),
        t('upsell.benefit_optimization', 'Otimização contínua'),
      ],
      value: t('upsell.value_smart', 'Reduza tempo de planejamento em 80%'),
    },
    DASHBOARD: {
      emoji: '📊',
      title: t('upsell.dashboard', 'Dashboard Premium'),
      description: t('upsell.dashboard_desc', 'Visualize métricas detalhadas e relatórios avançados'),
      benefits: [
        t('upsell.benefit_analytics', 'Analytics em tempo real'),
        t('upsell.benefit_reports', 'Relatórios personalizados'),
        t('upsell.benefit_roi', 'Cálculo de ROI detalhado'),
      ],
      value: t('upsell.value_dashboard', 'Justifique ROI com dados concretos'),
    },
    SENTINEL_MODE: {
      emoji: '🛡️',
      title: t('upsell.sentinel', 'Sentinel Mode (Proteção)'),
      description: t('upsell.sentinel_desc', 'Sistema redundante que garante operações críticas'),
      benefits: [
        t('upsell.benefit_redundancy', 'Redundância automática'),
        t('upsell.benefit_recovery', 'Recuperação de falhas'),
        t('upsell.benefit_compliance', 'Compliance & auditoria'),
      ],
      value: t('upsell.value_sentinel', 'Zero downtime em operações críticas'),
    },
  };

  const data = featureData[feature] || featureData.AUTOPILOT;

  return (
    <>
      {/* Overlay com blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="pointer-events-auto liquid-glass-surface w-full max-w-md rounded-2xl shadow-2xl animate-zoom-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com gradiente */}
          <div
            className="relative p-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-white/5"
            style={{
              backgroundImage: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>

            <div className="flex items-start gap-3">
              <span className="text-3xl">{data.emoji}</span>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{data.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Plan Info */}
            <div className="p-3 rounded-lg bg-white/35 dark:bg-white/5 border border-white/55 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                {t('upsell.current_plan', 'Seu plano atual')}
              </p>
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                {currentPlan}
              </p>
            </div>

            {/* Value Proposition */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {t('upsell.value_prop', 'Proposta de Valor')}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">{data.value}</p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                {t('upsell.benefits', 'Benefícios')}
              </p>
              {data.benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={onUpgrade}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 0 20px ${accentColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {t('upsell.upgrade', 'Fazer Upgrade')} → Plano Pro/Enterprise
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 px-4 rounded-lg font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/10 transition-colors border border-slate-300/70 dark:border-white/10"
              >
                {t('upsell.maybe_later', 'Talvez depois')}
              </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-slate-500 text-center">
              {t('upsell.footer', 'Suporte dedicado • Acesso ilimitado • Cancelamento livre')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

interface LockOverlayProps {
  featureName: string;
  onClickLock: () => void;
  accentColor: string;
}

/**
 * 🔒 OVERLAY DE LOCK PARA RECURSOS PREMIUM
 * Exibido sobre recursos bloqueados com badge elegante
 */
export const LockOverlay: React.FC<LockOverlayProps> = ({
  featureName,
  onClickLock,
  accentColor,
}) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition-colors group"
      onClick={onClickLock}
    >
      <div className="flex flex-col items-center gap-2">
        <div
          className="p-3 rounded-full transition-transform group-hover:scale-110"
          style={{
            backgroundColor: `${accentColor}20`,
          }}
        >
          <Lock className="w-6 h-6" style={{ color: accentColor }} />
        </div>
        <span className="text-xs font-semibold text-white text-center">
          {featureName}
        </span>
        <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
          Clique para fazer upgrade
        </span>
      </div>
    </div>
  );
};

interface LockedFeatureCardProps {
  title: string;
  description: string;
  badge?: 'PRO' | 'ENTERPRISE' | 'PRO_OR_ENTERPRISE';
  icon?: React.ReactNode;
  accentColor: string;
  onClickLock?: () => void;
  disabled?: boolean;
}

/**
 * 💎 CARD DE RECURSO BLOQUEADO COM OPACIDADE ELEGANTE
 * Mostra o recurso com lock visual but still clickable
 */
export const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
  title,
  description,
  badge = 'PRO_OR_ENTERPRISE',
  icon,
  accentColor,
  onClickLock,
  disabled = true,
}) => {
  const { t } = useTranslation();

  const badgeText: Record<string, string> = {
    PRO: t('badge.pro', 'Exclusivo Pro'),
    ENTERPRISE: t('badge.enterprise', 'Exclusivo Enterprise'),
    PRO_OR_ENTERPRISE: t('badge.pro_or_enterprise', 'Pro ou Enterprise'),
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-white/10 p-4 transition-all duration-300 ${
        disabled ? 'opacity-60 cursor-not-allowed' : 'opacity-100 cursor-pointer hover:border-white/20'
      }`}
      onClick={disabled ? onClickLock : undefined}
    >
      {/* Conteúdo */}
      <div className="flex items-start gap-3">
        {icon && <div className="text-xl">{icon}</div>}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400 mt-1">{description}</p>
        </div>
      </div>

      {/* Badge de Plano */}
      {disabled && (
        <div className="mt-3 flex items-center gap-2">
          <div
            className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}
          >
            {badgeText[badge]}
          </div>
        </div>
      )}

      {/* Lock Overlay */}
      {disabled && (
        <LockOverlay
          featureName={title}
          onClickLock={onClickLock || (() => {})}
          accentColor={accentColor}
        />
      )}
    </div>
  );
};
