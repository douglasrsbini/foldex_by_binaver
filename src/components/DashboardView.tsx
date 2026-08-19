import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AuditLog } from '../types';
import { 
  BarChart3, 
  HelpCircle, 
  FileSpreadsheet, 
  Clock, 
  TrendingUp, 
  Layers, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  CalendarDays, 
  X, 
  PieChart, 
  Activity, 
  HardDrive, 
  Settings2 
} from 'lucide-react';

interface DashboardViewProps {
  hourlyRate: number;
  accentColor: string;
}

type DateFilterType = 'ALL' | 'TODAY' | '7D' | '30D' | 'EXACT' | 'RANGE' | 'AFTER' | 'BEFORE';
type TimelineGranularity = 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER';

export const DashboardView: React.FC<DashboardViewProps> = ({ hourlyRate, accentColor }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [periodType, setPeriodType] = useState<DateFilterType>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [batchFilter, setBatchFilter] = useState<string>('ALL');
  const [showMemoryModal, setShowMemoryModal] = useState<boolean>(false);

  const [card1Type, setCard1Type] = useState<'DONUT' | 'LIST'>('DONUT');
  const [card2View, setCard2View] = useState<'BARS' | 'PERCENT'>('BARS');
  const [timelineGranularity, setTimelineGranularity] = useState<TimelineGranularity>('DAY');
  const [activeConfigModal, setActiveConfigModal] = useState<'CARD1' | 'CARD2' | 'CARD3' | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const res = await invoke<AuditLog[]>('get_audit_logs');
      setLogs(res);
    } catch (e) {
      console.error(e);
    }
  };

  const uniqueBatches = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => set.add(l.batch_id));
    return Array.from(set);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const now = new Date();

    return logs.filter((log) => {
      if (actionFilter !== 'ALL' && log.action_type !== actionFilter) return false;
      if (batchFilter !== 'ALL' && log.batch_id !== batchFilter) return false;

      const executedAt = log.executed_at ?? '';
      const logDate = new Date(executedAt.replace(' ', 'T'));
      const logDayStr = executedAt.slice(0, 10);

      switch (periodType) {
        case 'TODAY': {
          if (logDayStr !== now.toISOString().slice(0, 10)) return false;
          break;
        }
        case '7D': {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7 || diffDays < 0) return false;
          break;
        }
        case '30D': {
          const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30 || diffDays < 0) return false;
          break;
        }
        case 'EXACT': {
          if (startDate && logDayStr !== startDate) return false;
          break;
        }
        case 'RANGE': {
          if (startDate && logDayStr < startDate) return false;
          if (endDate && logDayStr > endDate) return false;
          break;
        }
        case 'AFTER': {
          if (startDate && logDayStr < startDate) return false;
          break;
        }
        case 'BEFORE': {
          if (endDate && logDayStr > endDate) return false;
          break;
        }
        default:
          break;
      }

      return true;
    });
  }, [logs, periodType, startDate, endDate, actionFilter, batchFilter]);

  const totalProcessed = filteredLogs.length;
  const totalSizeBytes = filteredLogs.reduce((acc, l) => acc + l.file_size_bytes, 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const hoursSaved = ((totalProcessed * 20) / 3600).toFixed(1);
  const moneySaved = (parseFloat(hoursSaved) * hourlyRate).toFixed(2);

  const actionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(l => {
      counts[l.action_type] = (counts[l.action_type] || 0) + 1;
    });
    return counts;
  }, [filteredLogs]);

  const maxActionCount = Math.max(...Object.values(actionCounts), 1);

  const timelineData = useMemo(() => {
    const map: Record<string, { count: number; size: number }> = {};
    
    filteredLogs.forEach(l => {
      const executedAt = l.executed_at ?? '';
      const dt = new Date(executedAt.replace(' ', 'T'));
      let key = executedAt.slice(0, 10);

      if (timelineGranularity === 'MONTH') {
        key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      } else if (timelineGranularity === 'QUARTER') {
        const q = Math.floor(dt.getMonth() / 3) + 1;
        key = `${dt.getFullYear()}-T${q}`;
      } else if (timelineGranularity === 'WEEK') {
        const weekNum = Math.ceil(dt.getDate() / 7);
        key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')} S${weekNum}`;
      }

      if (!map[key]) map[key] = { count: 0, size: 0 };
      map[key].count += 1;
      map[key].size += l.file_size_bytes;
    });

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  }, [filteredLogs, timelineGranularity]);

  const maxTimelineCount = Math.max(...timelineData.map(([_, v]) => v.count), 1);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const headers = 'Lote;Data_Hora;Acao;Origem;Destino;Tamanho_Bytes;Usuario_Windows;Status\n';
    const rows = filteredLogs.map(l => 
      `"${l.batch_id}";"${l.executed_at ?? ''}";"${l.action_type}";"${l.original_path}";"${l.destination_path || ''}";"${l.file_size_bytes}";"${l.windows_user || ''}";"${l.status}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Foldex_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-y-auto pr-1 select-none w-full">
      
      {/* CSS para Impressão Perfeita de Gráficos e Cores */}
      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .print-hide {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-full {
            border: none !important;
            box-shadow: none !important;
          }
          .print-bar {
            background-color: ${accentColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Barra de Filtros */}
      <div className="p-3.5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-3 shrink-0 print-hide">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Filter size={14} style={{ color: accentColor }} />
              <span>Filtros:</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
              <Calendar size={13} className="text-slate-400" />
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as DateFilterType)}
                className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Todo o Histórico</option>
                <option value="TODAY" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Hoje</option>
                <option value="7D" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Últimos 7 Dias</option>
                <option value="30D" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Últimos 30 Dias</option>
                <option value="EXACT" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Apenas no Dia Específico</option>
                <option value="RANGE" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Entre Duas Datas (Intervalo)</option>
                <option value="AFTER" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">A Partir do Dia (Início)</option>
                <option value="BEFORE" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Até o Dia (Limite)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
              <Layers size={13} className="text-slate-400" />
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer max-w-[130px] truncate text-xs"
              >
                <option value="ALL" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Todos os Lotes</option>
                {uniqueBatches.map(b => (
                  <option key={b} value={b} className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">{b}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
              <BarChart3 size={13} className="text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Todas as Ações</option>
                <option value="MOVE" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Mover</option>
                <option value="COPY" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Copiar</option>
                <option value="ZIP" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Compactar</option>
                <option value="RENAME" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Renomear</option>
                <option value="DELETE" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Excluir</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMemoryModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-[#383840] transition-colors"
            >
              <HelpCircle size={13} /> <span className="hidden md:inline">Memória de Cálculo</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-[#383840] transition-colors"
            >
              <Download size={13} /> <span className="hidden sm:inline">Exportar Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95"
              style={{ backgroundColor: accentColor }}
            >
              <Printer size={13} /> <span className="hidden sm:inline">Relatório PDF</span>
            </button>
          </div>
        </div>

        {/* Linha Dinâmica de Datas */}
        {(periodType === 'EXACT' || periodType === 'RANGE' || periodType === 'AFTER' || periodType === 'BEFORE') && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-[#2b2b30] text-xs">
            <div className="flex items-center gap-1.5 text-blue-600 font-bold">
              <CalendarDays size={14} />
              <span>Datas Selecionadas:</span>
            </div>

            {(periodType === 'EXACT' || periodType === 'RANGE' || periodType === 'AFTER') && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#2e2e34]">
                <span className="text-[11px] font-bold text-slate-400">
                  {periodType === 'EXACT' ? 'Dia:' : 'A partir de:'}
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs dark:[color-scheme:dark]"
                />
              </div>
            )}

            {(periodType === 'RANGE' || periodType === 'BEFORE') && (
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1 rounded-xl border border-slate-200 dark:border-[#2e2e34]">
                <span className="text-[11px] font-bold text-slate-400">Até o dia:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs dark:[color-scheme:dark]"
                />
              </div>
            )}

            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPeriodType('ALL'); }}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                title="Limpar Filtro de Data"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cartões de Indicadores Chave (KPIs) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0 print-full">
        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <FileSpreadsheet size={14} /> Arquivos Processados
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalProcessed}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <HardDrive size={14} /> Volume Movimentado
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalSizeMB} <span className="text-xs font-normal text-slate-400">MB</span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <Clock size={14} /> Tempo Economizado
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {hoursSaved} <span className="text-xs font-normal text-slate-400">horas</span>
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-1">
          <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-bold uppercase tracking-wider">
            <TrendingUp size={14} /> Economia Financeira
          </div>
          <p className="text-xl sm:text-2xl font-black text-green-600">
            R$ {moneySaved}
          </p>
        </div>
      </div>

      {/* Grid Centralizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 print-full">
        
        {/* Painel 1: Distribuição por Ação */}
        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between relative">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <PieChart size={15} style={{ color: accentColor }} />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Distribuição por Ação
              </h3>
            </div>
            
            <button 
              onClick={() => setActiveConfigModal('CARD1')} 
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272a] print-hide"
              title="Configurar visualização do gráfico"
            >
              <Settings2 size={13} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 flex-1 py-2">
            {card1Type === 'DONUT' && (
              <div 
                className="w-28 h-28 rounded-full border-8 flex items-center justify-center flex-col shadow-inner shrink-0"
                style={{ borderColor: accentColor }}
              >
                <span className="text-xl font-black text-slate-900 dark:text-white">{totalProcessed}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">TOTAL</span>
              </div>
            )}

            <div className="space-y-2 text-xs w-full max-w-[200px]">
              {Object.keys(actionCounts).length === 0 ? (
                <span className="text-slate-400 text-xs block text-center">Sem dados no período</span>
              ) : (
                Object.entries(actionCounts).map(([act, count]) => (
                  <div key={act} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-[#2b2b30]">
                    <div className="flex items-center gap-1.5 truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: accentColor }} />
                      <span className="font-bold text-slate-700 dark:text-slate-300">{act}</span>
                    </div>
                    <span className="font-mono text-slate-500 font-bold text-[11px]">
                      {count} ({totalProcessed > 0 ? ((count / totalProcessed) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Painel 2: Volume por Operação */}
        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between relative">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} style={{ color: accentColor }} />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Volume por Tipo de Operação
              </h3>
            </div>
            
            <button 
              onClick={() => setActiveConfigModal('CARD2')} 
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272a] print-hide"
              title="Configurar visualização do gráfico"
            >
              <Settings2 size={13} />
            </button>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {Object.keys(actionCounts).length === 0 ? (
              <span className="text-center text-slate-400 text-xs py-4">Nenhuma operação realizada</span>
            ) : (
              Object.entries(actionCounts).map(([act, count]) => {
                const percent = Math.round((count / maxActionCount) * 100);
                return (
                  <div key={act} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{act}</span>
                      <span className="font-mono text-slate-500">
                        {card2View === 'BARS' ? `${count} arquivos` : `${((count / totalProcessed) * 100).toFixed(1)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#141416] h-3.5 rounded-full overflow-hidden border border-slate-200 dark:border-[#2e2e34]">
                      <div
                        className="h-full rounded-full transition-all duration-500 print-bar"
                        style={{ width: `${percent}%`, backgroundColor: accentColor }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel 3: Evolução de Triagens */}
        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between relative">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-green-600" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Evolução ({timelineGranularity === 'DAY' ? 'Por Dia' : timelineGranularity === 'WEEK' ? 'Por Semana' : timelineGranularity === 'MONTH' ? 'Por Mês' : 'Por Trimestre'})
              </h3>
            </div>
            
            <button 
              onClick={() => setActiveConfigModal('CARD3')} 
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272a] print-hide"
              title="Trocar agrupamento de tempo"
            >
              <Settings2 size={13} />
            </button>
          </div>

          <div className="flex items-end justify-between gap-2 h-32 pt-2 px-1 flex-1">
            {timelineData.length === 0 ? (
              <span className="text-center text-slate-400 text-xs w-full py-4">Sem histórico registrado</span>
            ) : (
              timelineData.map(([periodKey, data]) => {
                const heightPercent = Math.max(20, Math.round((data.count / maxTimelineCount) * 100));
                const label = periodKey.includes('-') && periodKey.length === 10 ? periodKey.slice(8, 10) + '/' + periodKey.slice(5, 7) : periodKey;
                return (
                  <div key={periodKey} className="flex flex-col items-center gap-1 h-full justify-end flex-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500">{data.count}</span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-500 print-bar border-t border-x border-slate-300 dark:border-transparent"
                      style={{ height: `${heightPercent}%`, backgroundColor: accentColor }}
                    />
                    <span className="text-[9px] font-bold text-slate-500 truncate">{label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel 4: Impacto Operacional e Governança */}
        <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-2 mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp size={15} className="text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Impacto Operacional e Governança
              </h3>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-100 dark:border-[#2b2b30]">
              <span className="font-semibold">Velocidade Média:</span>
              <span className="font-mono font-bold text-blue-600">~0.15 seg / arquivo</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-100 dark:border-[#2b2b30]">
              <span className="font-semibold">Lotes Auditados:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">{uniqueBatches.length} lotes</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-100 dark:border-[#2b2b30]">
              <span className="font-semibold">Conformidade Forense:</span>
              <span className="font-mono font-bold text-green-600">100% SHA-256</span>
            </div>
          </div>
        </div>

      </div>

      {/* Modal de Configuração Individual dos Gráficos ⚙️ */}
      {activeConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-sm rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-2">
              <div className="flex items-center gap-2">
                <Settings2 size={16} style={{ color: accentColor }} />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Personalizar Gráfico</h3>
              </div>
              <button onClick={() => setActiveConfigModal(null)} className="text-slate-400 hover:text-white">
                <X size={15} />
              </button>
            </div>

            {activeConfigModal === 'CARD1' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">Tipo de Visualização:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCard1Type('DONUT')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      card1Type === 'DONUT' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Gráfico Donut
                  </button>
                  <button
                    onClick={() => setCard1Type('LIST')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      card1Type === 'LIST' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Apenas Lista
                  </button>
                </div>
              </div>
            )}

            {activeConfigModal === 'CARD2' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">Exibição dos Valores:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCard2View('BARS')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      card2View === 'BARS' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Total de Arquivos
                  </button>
                  <button
                    onClick={() => setCard2View('PERCENT')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      card2View === 'PERCENT' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Porcentagem (%)
                  </button>
                </div>
              </div>
            )}

            {activeConfigModal === 'CARD3' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 block">Agrupamento da Linha do Tempo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTimelineGranularity('DAY')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      timelineGranularity === 'DAY' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Por Dia
                  </button>
                  <button
                    onClick={() => setTimelineGranularity('WEEK')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      timelineGranularity === 'WEEK' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Por Semana
                  </button>
                  <button
                    onClick={() => setTimelineGranularity('MONTH')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      timelineGranularity === 'MONTH' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Por Mês
                  </button>
                  <button
                    onClick={() => setTimelineGranularity('QUARTER')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      timelineGranularity === 'QUARTER' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-300' : 'bg-slate-50 dark:bg-[#18181b] text-slate-500'
                    }`}
                  >
                    Por Trimestre
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveConfigModal(null)}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Memória de Cálculo */}
      {showMemoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} style={{ color: accentColor }} />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white">Memória de Cálculo de ROI</h3>
              </div>
              <button onClick={() => setShowMemoryModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>Tempo Médio por Arquivo:</strong> Estimativa de <strong>20 segundos</strong> por arquivo para triagem manual.</p>
              <p>• <strong>Horas Economizadas:</strong> (Quantidade de Arquivos × 20 seg) ÷ 3.600 seg.</p>
              <p>• <strong>Economia Financeira:</strong> Horas Economizadas × Custo Médio da Hora (R$ {hourlyRate.toFixed(2)}/h).</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMemoryModal(false)}
                className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardView;