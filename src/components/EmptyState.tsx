import React from 'react';
import { 
  FolderPlus, Sparkles, ShoppingBag, ArrowRight, 
  ListPlus, FileText, Zap, BarChart3, Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  type: 'NO_RULES' | 'NO_HISTORY' | 'NO_FILES' | 'NO_DATA' | 'PREMIUM_FEATURE';
  accentColor: string;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  title?: string;
  description?: string;
  showUpgrade?: boolean;
}

/**
 * ✨ EMPTY STATES MAGNÉTICOS & ENCORAJADORES
 * Exibido quando não há dados, incentivando ação
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  accentColor,
  onPrimaryAction,
  onSecondaryAction,
  title,
  description,
  showUpgrade = false,
}) => {
  const { t } = useTranslation();

  // 🎨 Dados por tipo de empty state
  const stateData: Record<string, {
    icon: React.ElementType;
    titleKey: string;
    descKey: string;
    primaryCTA: string;
    primaryIcon: React.ElementType;
    emoji: string;
  }> = {
    NO_RULES: {
      emoji: '📋',
      icon: ListPlus,
      titleKey: 'empty.no_rules_title',
      descKey: 'empty.no_rules_desc',
      primaryCTA: 'empty.create_first_rule',
      primaryIcon: FolderPlus,
    },
    NO_HISTORY: {
      emoji: '📜',
      icon: FileText,
      titleKey: 'empty.no_history_title',
      descKey: 'empty.no_history_desc',
      primaryCTA: 'empty.execute_rule',
      primaryIcon: Zap,
    },
    NO_FILES: {
      emoji: '📁',
      icon: FolderPlus,
      titleKey: 'empty.no_files_title',
      descKey: 'empty.no_files_desc',
      primaryCTA: 'empty.select_folder',
      primaryIcon: FolderPlus,
    },
    NO_DATA: {
      emoji: '📊',
      icon: BarChart3,
      titleKey: 'empty.no_data_title',
      descKey: 'empty.no_data_desc',
      primaryCTA: 'empty.explore_features',
      primaryIcon: Sparkles,
    },
    PREMIUM_FEATURE: {
      emoji: '💎',
      icon: Lock,
      titleKey: 'empty.premium_title',
      descKey: 'empty.premium_desc',
      primaryCTA: 'empty.upgrade_plan',
      primaryIcon: ShoppingBag,
    },
  };

  const data = stateData[type] || stateData.NO_DATA;
  const Icon = data.icon;
  const PrimaryIcon = data.primaryIcon;

  const defaultTitle = t(data.titleKey);
  const defaultDesc = t(data.descKey);
  const primaryBtnText = t(data.primaryCTA);

  return (
    <div className="liquid-glass-surface flex flex-col items-center justify-center w-full h-full min-h-[260px] p-8 text-center rounded-2xl">
      {/* 🎈 Ícone animado */}
      <div
        className="mb-6 p-6 rounded-full bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/10 animate-bounce"
        style={{
          boxShadow: `0 0 40px ${accentColor}20`,
        }}
      >
        <Icon
          className="w-12 h-12"
          style={{ color: accentColor }}
        />
      </div>

      {/* 📝 Título */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        <span className="mr-2">{data.emoji}</span>
        {title || defaultTitle}
      </h3>

      {/* 💬 Descrição */}
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description || defaultDesc}
      </p>

      {/* 🎯 Call-to-Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={onPrimaryAction}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap"
          style={{
            backgroundColor: accentColor,
            boxShadow: `0 0 20px ${accentColor}40`,
          }}
        >
          <PrimaryIcon className="w-5 h-5" />
          {primaryBtnText}
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>

        {/* Secondary Action (opcional) */}
        {onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-6 py-3 rounded-lg font-medium text-slate-300 border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors"
          >
            {t('empty.learn_more', 'Saiba Mais')}
          </button>
        )}
      </div>

      {/* 💳 Upgrade Prompt (se aplicável) */}
      {showUpgrade && (
        <div
          className="mt-6 p-4 rounded-lg border border-white/10 bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
        >
          <p className="text-xs text-slate-300 flex items-center gap-2 justify-center">
            <ShoppingBag className="w-4 h-4" style={{ color: accentColor }} />
            {t('empty.upgrade_prompt', 'Esta funcionalidade está disponível apenas nos planos Pro ou Enterprise')}
          </p>
        </div>
      )}

      {/* 🎓 Tip Section */}
      <div className="mt-8 pt-6 border-t border-white/5 w-full">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-2">
          {t('empty.tip', 'Dica')}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {type === 'NO_RULES' && t('empty.tip_rules', 'Crie sua primeira regra para começar a automatizar organização de arquivos.')}
          {type === 'NO_HISTORY' && t('empty.tip_history', 'Execute uma regra para ver o histórico de operações e auditoria.')}
          {type === 'NO_FILES' && t('empty.tip_files', 'Selecione uma pasta para explorar seus arquivos.')}
          {type === 'NO_DATA' && t('empty.tip_data', 'Execute regras para gerar dados e visualizar relatórios.')}
          {type === 'PREMIUM_FEATURE' && t('empty.tip_premium', 'Faça upgrade para desbloquear funcionalidades avançadas.')}
        </p>
      </div>
    </div>
  );
};

/**
 * 🎯 Empty state minimalista (versão compacta para modais)
 */
export const CompactEmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  accentColor: string;
}> = ({ title, description, icon, accentColor }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div
          className="mb-4 p-4 rounded-full"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
};
