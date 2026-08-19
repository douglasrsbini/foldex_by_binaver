import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AuditLog, IntegrityReport } from '../types';
import { 
  RotateCcw, 
  Search, 
  Download, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Check, 
  Lock, 
  ArrowRight, 
  User, 
  Layers, 
  Undo2,
  Calendar,
  X,
  Shield,
  CheckSquare,
  Square
} from 'lucide-react';

type HistoryDateFilter = 'ALL' | 'TODAY' | '7D' | '30D' | 'EXACT' | 'RANGE';

export const HistoryView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('ALL');
  const [dateFilterType, setDateFilterType] = useState<HistoryDateFilter>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<IntegrityReport | null>(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  
  const [selectedLogIds, setSelectedLogIds] = useState<number[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await invoke<AuditLog[]>('get_audit_logs');
      setLogs(res);
      setSelectedLogIds([]); 
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRollbackLast = async () => {
    if (!confirm('Deseja realmente desfazer o último lote de arquivos organizados?')) return;
    try {
      const count = await invoke<number>('rollback_last_batch');
      alert(`Sucesso: ${count} arquivo(s) foram revertidos aos seus locais de origem.`);
      loadLogs();
    } catch (e) {
      alert(`Falha no Rollback: ${e}`);
    }
  };

  const handleRollbackBatch = async (batchId: string) => {
    if (!confirm(`Deseja reverter todas as movimentações do lote ${batchId}?`)) return;
    try {
      const count = await invoke<number>('rollback_batch', { batchId });
      alert(`Sucesso: ${count} arquivo(s) do lote ${batchId} foram restaurados.`);
      loadLogs();
    } catch (e) {
      alert(`Falha ao reverter: ${e}`);
    }
  };

  const handleSingleRollback = async (auditId: number) => {
    if (!confirm('Deseja desfazer a movimentação apenas deste arquivo?')) return;
    try {
      await invoke('rollback_single_item', { auditId });
      alert('Arquivo restaurado com sucesso ao local de origem.');
      loadLogs();
    } catch (e) {
      alert(`Falha ao reverter arquivo: ${e}`);
    }
  };

  const handleSelectedRollback = async () => {
    if (selectedLogIds.length === 0) return;
    if (!confirm(`Deseja realizar o rollback de ${selectedLogIds.length} arquivo(s) selecionado(s)?`)) return;
    try {
      const count = await invoke<number>('rollback_multiple_items', { auditIds: selectedLogIds });
      alert(`Sucesso: ${count} arquivo(s) selecionado(s) foram revertidos.`);
      loadLogs();
    } catch (e) {
      alert(`Falha ao reverter itens selecionados: ${e}`);
    }
  };

  const toggleSelectAllCurrent = () => {
    const reversibleIds = filteredLogs.filter(l => l.is_reversible && l.id !== undefined && l.id !== null).map(l => l.id as number);
    const allSelected = reversibleIds.every(id => selectedLogIds.includes(id));
    if (allSelected) {
      setSelectedLogIds(prev => prev.filter(id => !reversibleIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedLogIds, ...reversibleIds]));
      setSelectedLogIds(combined);
    }
  };

  const toggleSelectLog = (id: number) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleVerifyIntegrity = async () => {
    setCheckingIntegrity(true);
    try {
      const report = await invoke<IntegrityReport>('verify_audit_integrity');
      setIntegrityStatus(report);
    } catch (e) {
      alert(`Erro na validação forense: ${e}`);
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = 'ID;Lote;Acao;Origem;Destino;Tamanho_Bytes;Hash_SHA256;Hash_Bloco;Usuario_Windows;Status;Data_Hora\n';
    const rows = logs.map(l => 
      `"${l.id}";"${l.batch_id}";"${l.action_type}";"${l.original_path}";"${l.destination_path || ''}";"${l.file_size_bytes}";"${l.file_hash_sha256 || ''}";"${l.current_log_hash || ''}";"${l.windows_user || ''}";"${l.status}";"${l.executed_at}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Auditoria_Forense_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueBatches = Array.from(new Set(logs.map(l => l.batch_id)));

  const filteredLogs = useMemo(() => {
    const now = new Date();

    return logs.filter(l => {
      const matchesSearch = l.original_path.toLowerCase().includes(search.toLowerCase()) ||
                            (l.destination_path && l.destination_path.toLowerCase().includes(search.toLowerCase())) ||
                            (l.file_hash_sha256 && l.file_hash_sha256.toLowerCase().includes(search.toLowerCase())) ||
                            l.batch_id.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      const matchesBatch = batchFilter === 'ALL' || l.batch_id === batchFilter;
      if (!matchesBatch) return false;

      const executedAt = l.executed_at ?? '';
      const logDayStr = executedAt.slice(0, 10);
      const logDate = new Date(executedAt.replace(' ', 'T'));

      switch (dateFilterType) {
        case 'TODAY': {
          if (logDayStr !== now.toISOString().slice(0, 10)) return false;
          break;
        }
        case '7D': {
          const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diff > 7 || diff < 0) return false;
          break;
        }
        case '30D': {
          const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
          if (diff > 30 || diff < 0) return false;
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
        default:
          break;
      }

      return true;
    });
  }, [logs, search, batchFilter, dateFilterType, startDate, endDate]);

  const reversibleInView = filteredLogs.filter(l => l.is_reversible && l.id !== undefined && l.id !== null);
  const allCurrentSelected = reversibleInView.length > 0 && reversibleInView.every(l => selectedLogIds.includes(l.id as number));

  return (
    <div className="flex flex-col h-full gap-3 select-none overflow-hidden relative">
      
      {/* Barra de Filtros & Ações da Auditoria */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm shrink-0">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquisar por caminho, hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-medium"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
            <Layers size={13} className="text-slate-400" />
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer max-w-[150px] truncate text-xs"
            >
              <option value="ALL" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Todos os Lotes ({uniqueBatches.length})</option>
              {uniqueBatches.map(b => (
                <option key={b} value={b} className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">{b}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#18181b] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
            <Calendar size={13} className="text-slate-400" />
            <select
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as HistoryDateFilter)}
              className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Todas as Datas</option>
              <option value="TODAY" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Hoje</option>
              <option value="7D" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Últimos 7 Dias</option>
              <option value="30D" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Últimos 30 Dias</option>
              <option value="EXACT" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Dia Específico</option>
              <option value="RANGE" className="bg-white dark:bg-[#202024] text-slate-800 dark:text-white">Intervalo de Datas</option>
            </select>
          </div>
        </div>

        {/* Botões Superiores & Ações em Massa */}
        <div className="flex flex-wrap items-center gap-1.5">
          
          {selectedLogIds.length > 0 && (
            <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-200 dark:border-[#2e2e34]">
              <button
                onClick={handleSelectedRollback}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-in fade-in duration-150"
                title="Reverter todos os arquivos marcados na listagem"
              >
                <Undo2 size={13} />
                <span>Reverter ({selectedLogIds.length})</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowLgpdModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 text-[11px] font-bold flex items-center gap-1 border border-purple-200 dark:border-purple-900 hover:bg-purple-100 transition-colors"
            title="Clique para ver os parâmetros de conformidade com a LGPD"
          >
            <Lock size={12} />
            <span>Modo LGPD Ativo</span>
          </button>

          <button
            onClick={handleVerifyIntegrity}
            disabled={checkingIntegrity}
            className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-900 transition-colors"
          >
            <ShieldCheck size={14} className={checkingIntegrity ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{checkingIntegrity ? "Validando..." : "Verificar Cadeia"}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-200 dark:border-[#383840] transition-colors"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Exportar (.CSV)</span>
          </button>

          <button 
            onClick={handleRollbackLast}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 dark:bg-[#25252a] hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0 border border-slate-700"
          >
            <RotateCcw size={13} />
            <span>Desfazer Último Lote</span>
          </button>
        </div>
      </div>

      {/* Datas Personalizadas para Auditoria */}
      {(dateFilterType === 'EXACT' || dateFilterType === 'RANGE') && (
        <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1e1e24] rounded-xl border border-slate-200 dark:border-[#2e2e34] text-xs">
          <span className="text-[11px] font-bold text-slate-400">Data de Início:</span>
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs" 
          />
          {dateFilterType === 'RANGE' && (
            <>
              <span className="text-[11px] font-bold text-slate-400 ml-2">Data Fim:</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer text-xs" 
              />
            </>
          )}
        </div>
      )}

      {/* Alerta de Integridade */}
      {integrityStatus && (
        <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium shrink-0 ${
          integrityStatus.is_valid
            ? 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {integrityStatus.is_valid ? <ShieldCheck size={18} className="text-green-600 shrink-0" /> : <ShieldAlert size={18} className="text-red-600 shrink-0" />}
            <div>
              <span className="font-bold block">
                {integrityStatus.is_valid ? 'Trilha de Auditoria 100% Íntegra' : 'Alerta de Adulteração de Trilha'}
              </span>
              <span className="text-[11px] opacity-90">{integrityStatus.message}</span>
            </div>
          </div>
          <button onClick={() => setIntegrityStatus(null)} className="opacity-60 hover:opacity-100 text-xs">
            Fechar
          </button>
        </div>
      )}

      {/* Barra de Seleção Flutuante */}
      {selectedLogIds.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-200 font-bold shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckSquare size={15} className="text-blue-600 dark:text-blue-400" />
            <span>{selectedLogIds.length} arquivo(s) selecionado(s) para estorno.</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedLogIds([])}
              className="px-3 py-1 bg-white dark:bg-[#1e1e24] text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 text-[11px] transition-colors"
            >
              Limpar Seleção
            </button>
            <button 
              onClick={handleSelectedRollback}
              className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Undo2 size={12} />
              Reverter Selecionados
            </button>
          </div>
        </div>
      )}

      {/* Lista de Registros Forenses com Checkboxes */}
      <div className="flex-1 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] p-3 overflow-y-auto space-y-2 shadow-sm min-h-0">
        
        {filteredLogs.length > 0 && (
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-slate-100 dark:border-[#2e2e34] text-[11px] font-bold text-slate-500">
            <button 
              onClick={toggleSelectAllCurrent}
              className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
            >
              {allCurrentSelected ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
              <span>Selecionar todos reversíveis visíveis</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">Carregando logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">Nenhum registro de auditoria encontrado.</div>
        ) : (
          filteredLogs.map((log) => {
            const isChecked = log.id !== null && log.id !== undefined && selectedLogIds.includes(log.id);

            return (
              <div key={log.id} className={`p-3 rounded-xl border transition-colors space-y-2 ${
                isChecked 
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800' 
                  : 'bg-slate-50 dark:bg-[#18181b] border-slate-200 dark:border-[#2e2e34] hover:border-slate-300 dark:hover:border-[#383840]'
              }`}>
                
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    
                    {log.is_reversible && log.id !== null && log.id !== undefined ? (
                      <button 
                        onClick={() => toggleSelectLog(log.id as number)}
                        className="text-slate-400 hover:text-blue-600 transition-colors p-0.5"
                      >
                        {isChecked ? <CheckSquare size={15} className="text-blue-600" /> : <Square size={15} />}
                      </button>
                    ) : (
                      <div className="w-[15px]" />
                    )}

                    <span className="text-slate-400 font-mono text-[11px]">[{log.executed_at}]</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-[11px]">Lote: {log.batch_id}</span>
                    {log.windows_user && (
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                        <User size={11} /> {log.windows_user}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {log.is_reversible ? (
                      <button
                        onClick={() => handleRollbackBatch(log.batch_id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 text-[11px] font-bold border border-red-200 dark:border-red-900 flex items-center gap-1 transition-colors"
                        title="Reverter todos os arquivos pertencentes a este lote"
                      >
                        <Undo2 size={12} />
                        <span>Reverter Lote</span>
                      </button>
                    ) : null}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${
                      log.status === 'SUCESSO' 
                        ? 'bg-green-100 dark:bg-green-950/50 text-green-700' 
                        : log.status === 'REVERTIDO'
                        ? 'bg-slate-200 dark:bg-[#25252a] text-slate-500'
                        : 'bg-red-100 dark:bg-red-950/50 text-red-700'
                    }`}>
                      {log.status === 'SUCESSO' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                      {log.status} • {log.action_type}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono bg-white dark:bg-[#141416] p-2.5 rounded-lg border border-slate-200 dark:border-[#2b2b30]">
                  <div className="space-y-1 overflow-hidden flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 truncate text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 font-bold shrink-0">De:</span>
                      <span className="truncate" title={log.original_path}>{log.original_path}</span>
                    </div>
                    {log.destination_path && (
                      <div className="flex items-start gap-1.5 truncate text-slate-700 dark:text-slate-300">
                        <span className="text-slate-400 font-bold shrink-0 flex items-center gap-0.5">
                          Para: <ArrowRight size={10} />
                        </span>
                        <span className="truncate" title={log.destination_path}>{log.destination_path}</span>
                      </div>
                    )}
                  </div>

                  {log.is_reversible && log.id !== undefined && log.id !== null && (
                    <button
                      onClick={() => handleSingleRollback(log.id as number)}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 rounded-lg font-sans text-[11px] font-bold transition-colors shrink-0 flex items-center justify-center gap-1.5 border border-red-200 dark:border-red-900/50"
                      title="Desfazer a movimentação apenas deste arquivo"
                    >
                      <Undo2 size={12} />
                      Desfazer Arquivo
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono gap-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-3">
                    {log.file_hash_sha256 && (
                      <button
                        onClick={() => copyToClipboard(log.file_hash_sha256!)}
                        className="hover:text-blue-500 flex items-center gap-1"
                        title="Copiar Hash SHA-256"
                      >
                        <span>SHA-256: {log.file_hash_sha256.slice(0, 16)}...</span>
                        {copiedHash === log.file_hash_sha256 ? <Check size={10} className="text-green-500" /> : null}
                      </button>
                    )}

                    {log.current_log_hash && (
                      <button
                        onClick={() => copyToClipboard(log.current_log_hash!)}
                        className="hover:text-blue-500 flex items-center gap-1 text-blue-600 dark:text-blue-400"
                        title="Copiar Hash do Bloco"
                      >
                        <span>Hash-Block: {log.current_log_hash.slice(0, 16)}...</span>
                        {copiedHash === log.current_log_hash ? <Check size={10} className="text-green-500" /> : null}
                      </button>
                    )}
                  </div>

                  <span className="font-bold">
                    {log.file_size_bytes < 1024 
                      ? `${log.file_size_bytes} B` 
                      : log.file_size_bytes < 1024 * 1024 
                      ? `${(log.file_size_bytes / 1024).toFixed(1)} KB` 
                      : `${(log.file_size_bytes / (1024 * 1024)).toFixed(2)} MB`}
                  </span>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Modal LGPD & Conformidade */}
      {showLgpdModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">Conformidade LGPD & Zero-Knowledge</h3>
                  <p className="text-[10px] text-slate-400">Garantia de Privacidade Corporativa</p>
                </div>
              </div>
              <button onClick={() => setShowLgpdModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>Execução 100% Local:</strong> Nenhum dado, nome ou conteúdo de arquivo transita por servidores externos.</p>
              <p>• <strong>Assinatura SHA-256 Forense:</strong> Cada movimentação gera um elo criptográfico encadeado à prova de adulteração.</p>
              <p>• <strong>Trilha de Auditoria Auditável:</strong> Todos os lotes possuem registro do usuário do Windows que executou a operação.</p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowLgpdModal(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryView;