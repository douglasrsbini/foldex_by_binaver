import React from 'react';
import { Layers, ListOrdered, X } from 'lucide-react';

interface RuleBuilderHeaderProps {
  isEditing: boolean;
  ruleCount: number;
  accentColor: string;
  onOpenTemplates: () => void;
  onOpenRules: () => void;
  onCancelEditing: () => void;
}

export const RuleBuilderHeader: React.FC<RuleBuilderHeaderProps> = ({
  isEditing,
  ruleCount,
  accentColor,
  onOpenTemplates,
  onOpenRules,
  onCancelEditing,
}) => (
  <header className="flex items-center justify-between px-6 py-5 shrink-0 gap-4">
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
        {isEditing ? 'Editar Regra' : 'Criar uma regra'}
      </h1>
      <p className="text-xs text-slate-500 mt-1">Uma etapa de cada vez. Você pode voltar e ajustar quando precisar.</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {!isEditing && (
        <button
          type="button"
          onClick={onOpenTemplates}
          className="px-4 py-2 rounded-xl bg-white/60 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-bold border border-white/70 dark:border-white/10 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Layers size={14} style={{ color: accentColor }} /> Usar modelo
        </button>
      )}
      {isEditing && (
        <button
          type="button"
          onClick={onCancelEditing}
          className="px-4 py-2 rounded-xl bg-red-50/70 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors flex items-center gap-2"
        >
          <X size={14} /> Cancelar
        </button>
      )}
      <button
        type="button"
        onClick={onOpenRules}
        className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-bold border border-white/70 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-all flex items-center gap-2"
      >
        <ListOrdered size={14} /> Minhas regras
        <span className="bg-slate-200/70 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{ruleCount}</span>
      </button>
    </div>
  </header>
);

export default RuleBuilderHeader;
