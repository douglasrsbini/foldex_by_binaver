import React, { useState } from 'react';
import { FolderPlus, FolderSearch, Plus, ScanText, Trash2, X } from 'lucide-react';
import { RuleFilter } from '../../types';
import { useTranslation } from 'react-i18next';
import { HelpTooltip } from '../ContextualHelp';

interface FilterBuilderProps {
  filters: RuleFilter[];
  onFiltersChange: (filters: RuleFilter[]) => void;
  accentColor: string;
  masterLogicOperator?: string;
  onMasterLogicChange?: (operator: string) => void;
}

/**
 * 🎯 FILTER BUILDER SUBCOMPONENT
 * Gerencia os filtros (condições) de uma regra
 * Quebrado do RuleBuilder original para melhor manutenção
 */
export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  filters,
  onFiltersChange,
  accentColor,
  masterLogicOperator = 'AND',
  onMasterLogicChange,
}) => {
  const { t } = useTranslation();

  const filterFieldOptions = [
    t('rule_builder.filters.field.filename') || 'Nome do Arquivo',
    t('rule_builder.filters.field.extension') || 'Extensão',
    t('rule_builder.filters.field.size') || 'Tamanho',
    t('rule_builder.filters.field.date') || 'Data',
    t('rule_builder.filters.field.ocr_content') || 'Conteúdo do Documento (OCR)',
  ];

  const operatorOptions = [
    'CONTÉM',
    'NÃO CONTÉM',
    'COMEÇA COM',
    'TERMINA COM',
    'É IGUAL A',
    'MAIOR QUE',
    'MENOR QUE',
  ];

  const logicOptions = ['AND', 'OR'];

  // 🛡️ Null-safety
  const safeFilters = Array.isArray(filters) ? filters : [];

  const handleAddFilter = () => {
    onFiltersChange([
      ...safeFilters,
      {
        field_name: filterFieldOptions[0],
        operator: operatorOptions[0],
        value: '',
        logic_connector: masterLogicOperator || 'AND',
      },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    onFiltersChange(safeFilters.filter((_, i) => i !== index));
  };

  const handleFilterChange = (
    index: number,
    key: keyof RuleFilter,
    value: string
  ) => {
    const updated = [...safeFilters];
    updated[index] = { ...updated[index], [key]: value };
    onFiltersChange(updated);
  };

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#18181b] dark:to-[#1e1e24] rounded-xl border border-slate-200 dark:border-[#2e2e34]">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <FolderSearch className="w-4 h-4" style={{ color: accentColor }} />
          {t('rule_builder.filters_title') || 'Filtros (Condições)'}
          <HelpTooltip
            title={t('rule_builder.filters_help_title') || 'O que são Filtros?'}
            content={t('rule_builder.filters_help_content') || 'Defina as condições que os arquivos devem atender para serem processados pela regra.'}
            accentColor={accentColor}
          />
        </h4>
        <button
          onClick={handleAddFilter}
          className="px-3 py-1 text-xs font-bold text-white rounded-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1"
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('common.add') || 'Adicionar'}
        </button>
      </div>

      {/* Master Logic Operator */}
      {safeFilters.length > 1 && (
        <div className="p-3 rounded-lg bg-white/70 dark:bg-[#27272a]/70 border border-slate-200 dark:border-[#383840]">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 block">
            {t('rule_builder.master_logic') || 'Lógica Mestre (entre filtros)'}
          </label>
          <div className="flex gap-2">
            {logicOptions.map((op) => (
              <button
                key={op}
                onClick={() => onMasterLogicChange?.(op)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  masterLogicOperator === op
                    ? 'text-white bg-opacity-100'
                    : 'text-slate-600 dark:text-slate-400 bg-opacity-50 hover:bg-opacity-75'
                }`}
                style={{
                  backgroundColor: masterLogicOperator === op ? accentColor : 'transparent',
                  border: masterLogicOperator === op ? 'none' : `1px solid ${accentColor}40`,
                  color: masterLogicOperator === op ? 'white' : 'inherit',
                }}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter Items */}
      <div className="space-y-2">
        {safeFilters.length === 0 ? (
          <div className="text-center py-6 text-slate-400 dark:text-slate-500">
            <p className="text-xs">{t('rule_builder.no_filters') || 'Nenhum filtro adicionado'}</p>
          </div>
        ) : (
          safeFilters.map((filter, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-white dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] space-y-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('rule_builder.filter_number') || 'Filtro'} {idx + 1}
                  {idx > 0 && filter?.logic_connector && (
                    <span className="ml-2 text-slate-400">
                      ({filter.logic_connector})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleRemoveFilter(idx)}
                  className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Field */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Campo
                  </label>
                  <select
                    value={filter?.field_name || ''}
                    onChange={(e) => handleFilterChange(idx, 'field_name', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1 focus:ring-offset-0"
                    style={{
                      borderColor: masterLogicOperator === 'AND' ? `${accentColor}40` : `${accentColor}60`,
                    }}
                  >
                    {filterFieldOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operator */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Operador
                  </label>
                  <select
                    value={filter?.operator || ''}
                    onChange={(e) => handleFilterChange(idx, 'operator', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1 focus:ring-offset-0"
                  >
                    {operatorOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Valor
                  </label>
                  <input
                    type="text"
                    placeholder="ex: pdf, 100MB"
                    value={filter?.value || ''}
                    onChange={(e) => handleFilterChange(idx, 'value', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-[#27272a] border border-slate-200 dark:border-[#383840] rounded-lg outline-none focus:ring-1 focus:ring-offset-0"
                  />
                </div>
              </div>

              {filter?.field_name === (t('rule_builder.filters.field.ocr_content') || 'Conteúdo do Documento (OCR)') && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 mt-2">
                  <ScanText className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] text-indigo-700 dark:text-indigo-300 leading-snug">
                    {t('rule_builder.filters.ocr_hint') || 'O sistema fará leitura óptica (OCR) do conteúdo interno de PDFs escaneados e imagens para localizar o texto informado. Pode levar alguns segundos por arquivo.'}
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
