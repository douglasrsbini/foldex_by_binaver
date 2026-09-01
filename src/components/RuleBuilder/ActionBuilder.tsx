import React from 'react';
import { Plus, Trash2, X, FolderDown, Sparkles, FileOutput } from 'lucide-react';
import { RuleAction } from '../../types';
import { useTranslation } from 'react-i18next';
import { HelpTooltip } from '../ContextualHelp';

interface ActionBuilderProps {
  actions: RuleAction[];
  onActionsChange: (actions: RuleAction[]) => void;
  accentColor: string;
  cleanAccents?: boolean;
  onCleanAccentsChange?: (value: boolean) => void;
  replaceSpaces?: boolean;
  onReplaceSpacesChange?: (value: boolean) => void;
  caseFormat?: string;
  onCaseFormatChange?: (value: string) => void;
}

/**
 * 🎯 ACTION BUILDER SUBCOMPONENT
 * Gerencia as ações (transformações) que serão aplicadas aos arquivos
 * Quebrado do RuleBuilder original
 */
export const ActionBuilder: React.FC<ActionBuilderProps> = ({
  actions,
  onActionsChange,
  accentColor,
  cleanAccents = false,
  onCleanAccentsChange,
  replaceSpaces = false,
  onReplaceSpacesChange,
  caseFormat = 'NONE',
  onCaseFormatChange,
}) => {
  const { t } = useTranslation();

  const actionTypeOptions = [
    { label: t('rule_builder.actions.move') || 'Mover', value: 'MOVE' },
    { label: t('rule_builder.actions.copy') || 'Copiar', value: 'COPY' },
    { label: t('rule_builder.actions.delete') || 'Deletar', value: 'DELETE' },
    { label: t('rule_builder.actions.rename') || 'Renomear', value: 'RENAME' },
    { label: t('rule_builder.actions.convert_format') || 'Converter Formato', value: 'CONVERT_FORMAT' },
    { label: t('rule_builder.actions.ai_rename') || 'Tratamento por IA (Renomeação Cognitiva)', value: 'AI_RENAME' },
  ];

  const convertFormatOptions = [
    { label: 'PDF', value: 'PDF' },
    { label: 'PNG', value: 'PNG' },
    { label: 'JPG', value: 'JPG' },
  ];

  // 🛡️ Null-safety
  const safeActions = Array.isArray(actions) ? actions : [];

  const handleAddAction = () => {
    onActionsChange([
      ...safeActions,
      {
        action_type: 'MOVE',
        target_pattern: '',
      },
    ]);
  };

  const handleRemoveAction = (index: number) => {
    onActionsChange(safeActions.filter((_, i) => i !== index));
  };

  const handleActionChange = (
    index: number,
    key: keyof RuleAction,
    value: string | boolean
  ) => {
    const updated = [...safeActions];
    updated[index] = { ...updated[index], [key]: value };
    onActionsChange(updated);
  };

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#18181b] dark:to-[#1e1e24] rounded-xl border border-slate-200 dark:border-[#2e2e34]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FolderDown className="w-4 h-4" style={{ color: accentColor }} />
          {t('rule_builder.actions_title') || 'Ações (Transformações)'}
          <HelpTooltip
            title={t('rule_builder.actions_help_title') || 'O que são Ações?'}
            content={t('rule_builder.actions_help_content') || 'Defina o que o sistema fará com os arquivos que atendem aos filtros.'}
            accentColor={accentColor}
          />
        </h4>
        <button
          onClick={handleAddAction}
          className="px-3 py-1 text-xs font-bold text-white rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('common.add') || 'Adicionar'}
        </button>
      </div>

      {/* Text Transformation Options */}
      <div className="p-3 rounded-lg bg-white/70 dark:bg-[#27272a]/70 border border-slate-200 dark:border-[#383840] space-y-2">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
          {t('rule_builder.text_options') || 'Opções de Transformação de Texto'}
        </label>

        <div className="grid grid-cols-3 gap-2">
          {/* Clean Accents */}
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-[#18181b] transition-colors">
            <input
              type="checkbox"
              id="cleanAccents"
              checked={cleanAccents}
              onChange={(e) => onCleanAccentsChange?.(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer accent-current"
              style={{ accentColor }}
            />
            <label
              htmlFor="cleanAccents"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {t('rule_builder.clean_accents') || 'Remover Acentos'}
            </label>
          </div>

          {/* Replace Spaces */}
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-[#18181b] transition-colors">
            <input
              type="checkbox"
              id="replaceSpaces"
              checked={replaceSpaces}
              onChange={(e) => onReplaceSpacesChange?.(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor }}
            />
            <label
              htmlFor="replaceSpaces"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              {t('rule_builder.replace_spaces') || 'Substituir Espaços'}
            </label>
          </div>

          {/* Case Format */}
          <div>
            <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1 block">
              {t('rule_builder.case_format') || 'Formato'}
            </label>
            <select
              value={caseFormat}
              onChange={(e) => onCaseFormatChange?.(e.target.value)}
              className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1"
            >
              <option value="NONE">{t('rule_builder.case_none') || 'Nenhum'}</option>
              <option value="UPPER">{t('rule_builder.case_upper') || 'MAIÚSCULAS'}</option>
              <option value="LOWER">{t('rule_builder.case_lower') || 'minúsculas'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        {safeActions.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500">
            <p className="text-xs">{t('rule_builder.no_actions') || 'Nenhuma ação adicionada'}</p>
          </div>
        ) : (
          safeActions.map((action, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('rule_builder.action_number') || 'Ação'} {idx + 1}
                </span>
                <button
                  onClick={() => handleRemoveAction(idx)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Action Type */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    {t('rule_builder.action_type') || 'Tipo'}
                  </label>
                  <select
                    value={action?.action_type || 'MOVE'}
                    onChange={(e) => handleActionChange(idx, 'action_type', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1"
                  >
                    {actionTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Pattern */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    {t('rule_builder.target_pattern') || 'Padrão/Caminho'}
                  </label>
                  <input
                    type="text"
                    placeholder="ex: {ano}/{mes}"
                    value={action?.target_pattern || ''}
                    onChange={(e) => handleActionChange(idx, 'target_pattern', e.target.value)}
                    disabled={action?.action_type === 'DELETE' || action?.action_type === 'AI_RENAME'}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* CONVERTER FORMATO: select elegante do formato de destino */}
              {action?.action_type === 'CONVERT_FORMAT' && (
                <div className="mt-2">
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                    <FileOutput className="w-3 h-3" style={{ color: accentColor }} />
                    {t('rule_builder.actions.convert_target_label') || 'Formato Final Desejado'}
                  </label>
                  <select
                    value={action?.convert_format || 'PDF'}
                    onChange={(e) => handleActionChange(idx, 'convert_format', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#18181b] border rounded-lg outline-none focus:ring-1 font-semibold"
                    style={{ borderColor: `${accentColor}60` }}
                  >
                    {convertFormatOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t('rule_builder.actions.convert_hint') || 'Suporta Word (.docx), Excel (.xlsx) e Imagens (.png/.jpg) como origem.'}
                  </p>
                </div>
              )}

              {/* TRATAMENTO POR IA: aviso explicativo da renomeação cognitiva */}
              {action?.action_type === 'AI_RENAME' && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-purple-700 dark:text-purple-300 leading-snug">
                    {t('rule_builder.actions.ai_rename_hint') || 'A IA lê o conteúdo do documento (via OCR) e gera automaticamente o nome do arquivo com base no contexto (ex.: "Fatura_Energia_Agosto_2026.pdf"), sem necessidade de configurar Regex.'}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
