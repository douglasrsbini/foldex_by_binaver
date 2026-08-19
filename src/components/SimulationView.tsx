import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Rule, DryRunResult } from '../types';
import { 
  FlaskConical, 
  Play, 
  ArrowRight, 
  FileText, 
  CheckSquare, 
  Square, 
  Layers, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface SimulationViewProps {
  accentColor: string;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ accentColor }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [simResults, setSimResults] = useState<{ ruleId: number; ruleName: string; results: DryRunResult[] }[]>([]);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await invoke<Rule[]>('get_rules');
      setRules(res);
      if (res.length > 0 && res[0].id) {
        setSelectedRuleIds([res[0].id]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleRule = (id: number) => {
    if (selectedRuleIds.includes(id)) {
      setSelectedRuleIds(selectedRuleIds.filter(i => i !== id));
    } else {
      setSelectedRuleIds([...selectedRuleIds, id]);
    }
  };

  const handleSelectAllRules = () => {
    if (selectedRuleIds.length === rules.length) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(rules.filter(r => r.id !== undefined).map(r => r.id!));
    }
  };

  const handleSimulate = async () => {
    if (selectedRuleIds.length === 0) {
      alert('Selecione ao menos uma regra para simular.');
      return;
    }

    setLoading(true);
    setSimResults([]);
    try {
      const allResults = [];
      for (const rId of selectedRuleIds) {
        const rule = rules.find(r => r.id === rId);
        const res = await invoke<DryRunResult[]>('run_simulation', { ruleId: rId });
        allResults.push({
          ruleId: rId,
          ruleName: rule ? `ID ${rule.custom_code} - ${rule.name}` : `Regra ${rId}`,
          results: res,
        });
      }
      setSimResults(allResults);
    } catch (e) {
      alert(`Erro na simulação: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (selectedRuleIds.length === 0) return;
    if (!confirm(`Deseja executar as ${selectedRuleIds.length} regra(s) selecionada(s) agora?`)) return;

    setExecuting(true);
    try {
      let totalExecuted = 0;
      for (const rId of selectedRuleIds) {
        const batch = await invoke<string>('execute_rule', { ruleId: rId });
        if (batch.startsWith('Lote')) totalExecuted++;
      }
      alert(`Execução concluída com sucesso.`);
      handleSimulate();
    } catch (e) {
      alert(`Erro na execução: ${e}`);
    } finally {
      setExecuting(false);
    }
  };

  const totalFilesFound = useMemo(() => {
    return simResults.reduce((acc, curr) => acc + curr.results.length, 0);
  }, [simResults]);

  const isAllSelected = rules.length > 0 && selectedRuleIds.length === rules.length;

  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden" onClick={() => setDropdownOpen(false)}>
      
      {/* Barra de Controle de Simulação */}
      <div className="p-3 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        
        {/* Seletor Múltiplo Customizado */}
        <div className="relative flex-1 min-w-[260px] max-w-md" onClick={(e) => e.stopPropagation()}>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Regras Selecionadas ({selectedRuleIds.length} de {rules.length})
          </label>

          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold"
          >
            <div className="flex items-center gap-2 truncate">
              <Layers size={14} style={{ color: accentColor }} />
              <span className="truncate">
                {selectedRuleIds.length === 0 
                  ? 'Nenhuma regra selecionada'
                  : isAllSelected 
                  ? 'Todas as Regras Selecionadas' 
                  : `${selectedRuleIds.length} Regra(s) Selecionada(s)`}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </button>

          {/* Menu Suspenso de Seleção Múltipla */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#33333a] rounded-2xl shadow-xl p-2 z-50 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={handleSelectAllRules}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
              >
                {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                <span>Selecionar Todas as Regras</span>
              </button>

              <div className="h-[1px] bg-slate-100 dark:bg-[#2d2d34] my-1" />

              {rules.map((r) => {
                const isChecked = selectedRuleIds.includes(r.id!);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleToggleRule(r.id!)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors truncate ${
                      isChecked
                        ? 'bg-slate-100 dark:bg-[#27272a] text-slate-900 dark:text-white font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#18181b]'
                    }`}
                  >
                    {isChecked ? <CheckSquare size={14} className="text-blue-600 shrink-0" /> : <Square size={14} className="text-slate-400 shrink-0" />}
                    <span className="truncate">ID {r.custom_code} - {r.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulate}
            disabled={loading || selectedRuleIds.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#383840] flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <FlaskConical size={14} className={loading ? "animate-spin text-blue-500" : ""} />
            <span>{loading ? 'Simulando...' : `Simular (${selectedRuleIds.length})`}</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={executing || totalFilesFound === 0}
            className="px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: accentColor }}
          >
            <Play size={14} className={executing ? "animate-spin" : "fill-white"} />
            <span>{executing ? 'Executando...' : `Executar Agora (${totalFilesFound} arquivos)`}</span>
          </button>
        </div>
      </div>

      {/* Área de Resultados da Simulação */}
      <div className="flex-1 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] p-3 overflow-y-auto space-y-4 shadow-sm min-h-0">
        {simResults.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <SlidersHorizontal size={24} className="opacity-40" />
            <span>Selecione as regras desejadas e clique em "Simular" para conferir os caminhos de De ➔ Para.</span>
          </div>
        ) : (
          simResults.map((group) => (
            <div key={group.ruleId} className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34]">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Layers size={14} style={{ color: accentColor }} />
                  {group.ruleName}
                </span>
                <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md">
                  {group.results.length} arquivo(s) correspondente(s)
                </span>
              </div>

              {group.results.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-3 py-1">Nenhum arquivo atende aos filtros desta regra no momento.</p>
              ) : (
                <div className="space-y-1.5">
                  {group.results.map((res, i) => (
                    <div key={i} className="p-2.5 bg-slate-50/70 dark:bg-[#141416] rounded-xl border border-slate-200 dark:border-[#2b2b30] text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={14} className="text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{res.filename}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        <span className="truncate max-w-[200px]" title={res.source}>{res.source}</span>
                        <ArrowRight size={12} className="text-blue-500 shrink-0" />
                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[220px]" title={res.destination}>{res.destination}</span>
                      </div>

                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-[#25252b] px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
                        {res.action}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default SimulationView;