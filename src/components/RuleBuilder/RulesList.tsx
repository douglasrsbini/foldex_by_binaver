import React, { useMemo } from 'react';
import {
  Trash2, ArrowUp, ArrowDown, Edit3, Eye, Lock, ChevronDown,
  PlayCircle, Pause
} from 'lucide-react';
import { Rule } from '../../types';
import { useTranslation } from 'react-i18next';

interface RulesListProps {
  rules: Rule[];
  onEditRule: (rule: Rule) => void;
  onDeleteRule: (id: number) => void;
  onMoveRule: (id: number, direction: 'up' | 'down') => void;
  onToggleActive: (id: number) => void;
  onExecuteRule?: (id: number) => void;
  accentColor: string;
  searchQuery?: string;
  actionFilter?: string;
  sortField?: 'id' | 'name';
  sortOrder?: 'asc' | 'desc';
  canUserExecuteRules?: boolean;
}

/**
 * 📋 RULES LIST SUBCOMPONENT
 * Exibe a lista de regras criadas com opções de edição, deleção, etc.
 * Quebrado do RuleBuilder original
 */
export const RulesList: React.FC<RulesListProps> = ({
  rules,
  onEditRule,
  onDeleteRule,
  onMoveRule,
  onToggleActive,
  onExecuteRule,
  accentColor,
  searchQuery = '',
  actionFilter = 'ALL',
  sortField = 'id',
  sortOrder = 'asc',
  canUserExecuteRules = true,
}) => {
  const { t } = useTranslation();

  // 🛡️ Null-safety e Filtering
  const safeRules = Array.isArray(rules) ? rules : [];

  const filteredRules = useMemo(() => {
    let result = safeRules.filter(rule => {
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rule?.name?.toLowerCase().includes(q) ?? false;
        const matchesSource = rule?.source_directory?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesSource) return false;
      }

      // Filter by action type
      if (actionFilter !== 'ALL' && rule?.actions?.length > 0) {
        const hasAction = rule.actions.some((a: { action_type?: string } | undefined) => a?.action_type === actionFilter);
        if (!hasAction) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let aVal = sortField === 'id' ? (a?.id ?? 0) : (a?.name ?? '');
      let bVal = sortField === 'id' ? (b?.id ?? 0) : (b?.name ?? '');

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [safeRules, searchQuery, actionFilter, sortField, sortOrder]);

  if (filteredRules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div
          className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <Lock className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          {t('rule_builder.no_rules') || 'Nenhuma regra encontrada'}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {searchQuery || actionFilter !== 'ALL'
            ? t('rule_builder.no_rules_filter') || 'Tente ajustar seus filtros'
            : t('rule_builder.no_rules_create') || 'Crie sua primeira regra para começar'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredRules.map((rule, idx) => (
        <div
          key={rule?.id ?? idx}
          className="group p-4 rounded-lg border border-slate-200 dark:border-[#2e2e34] bg-white dark:bg-[#18181b] hover:border-slate-300 dark:hover:border-[#383840] hover:shadow-md transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {/* Status Badge */}
                <button
                  onClick={() => rule?.id && onToggleActive(rule.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    rule?.is_active
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-slate-200 dark:bg-[#27272a] text-slate-600 dark:text-slate-400'
                  }`}
                  title={rule?.is_active ? t('common.disable') : t('common.enable')}
                >
                  {rule?.is_active ? (
                    <PlayCircle className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {rule?.name || t('rule_builder.unnamed_rule')}
                </h3>

                {/* Premium Badge */}
                {rule?.is_sentinel_active && (
                  <div
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      color: accentColor,
                      border: `1px solid ${accentColor}40`,
                    }}
                  >
                    {t('rule_builder.sentinel_enabled') || 'Sentinel'}
                  </div>
                )}
              </div>

              {/* Details */}
              <p className="text-xs text-slate-600 dark:text-slate-400 ml-8">
                📁 {rule?.source_directory || t('common.not_specified')}
                {rule?.actions && rule.actions.length > 0 && (
                  <> • 🎯 {rule.actions.length} ação(ões)</>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Move Up */}
              <button
                onClick={() => rule?.id && onMoveRule(rule.id, 'up')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors"
                title={t('rule_builder.move_up')}
              >
                <ArrowUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Move Down */}
              <button
                onClick={() => rule?.id && onMoveRule(rule.id, 'down')}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors"
                title={t('rule_builder.move_down')}
              >
                <ArrowDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Execute */}
              {canUserExecuteRules && onExecuteRule && (
                <button
                  onClick={() => rule?.id && onExecuteRule(rule.id)}
                  className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-emerald-600 dark:text-emerald-400"
                  title={t('rule_builder.execute')}
                >
                  <PlayCircle className="w-4 h-4" />
                </button>
              )}

              {/* Edit */}
              <button
                onClick={() => onEditRule(rule)}
                className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                style={{ color: accentColor }}
                title={t('common.edit')}
              >
                <Edit3 className="w-4 h-4" />
              </button>

              {/* Delete */}
              <button
                onClick={() => rule?.id && onDeleteRule(rule.id)}
                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
