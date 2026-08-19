import React, { useState, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Rule, RuleFilter, LicenseInfo } from '../types';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Edit3, 
  FolderSearch, 
  ListOrdered, 
  Search, 
  Filter, 
  ArrowUpDown, 
  PanelRightClose, 
  PanelRightOpen, 
  Bot, 
  ShieldAlert,  
  Folder, 
  FolderPlus, 
  Wand2, 
  HelpCircle, 
  RotateCcw, 
  FolderDown, 
  FileSpreadsheet, 
  Image as ImageIcon,
  Archive,
  FileCode,
  AlertTriangle,
  X,
  Sparkles,
  LayoutGrid,
  Rows
} from 'lucide-react';

interface RuleBuilderProps {
  initialSource?: string;
  accentColor: string;
  onNavigateToAccount?: () => void;
}

type SortField = 'id' | 'name';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'blocks' | 'minimal';

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ initialSource, accentColor }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [autoCode, setAutoCode] = useState(true);
  const [sourceDir, setSourceDir] = useState(initialSource || '');
  const [actionType, setActionType] = useState('MOVE');
  const [conflictPolicy, setConflictPolicy] = useState('AUTONUMBER');
  const [folderMode, setFolderMode] = useState<'existente' | 'criar'>('existente');
  const [targetDir, setTargetDir] = useState('');
  const [createPattern, setCreatePattern] = useState('{ano}/{mes}/{tipo_doc}');
  
  const [filters, setFilters] = useState<RuleFilter[]>([
    { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [activeHelpModal, setActiveHelpModal] = useState<'TAGS' | 'FILTERS' | 'DUPLICATES' | null>(null);

  const [ruleSearch, setRuleSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('blocks');

  // Operador master do bloco condicional
  const masterLogicOperator = useMemo(() => {
    return filters.some(f => f.logic_connector === 'OR') ? 'OR' : 'AND';
  }, [filters]);

  const handleMasterLogicChange = (value: string) => {
    setFilters(prev => prev.map(f => ({ ...f, logic_connector: value })));
  };

  // Redimensionamento e Colapso
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(62);
  const [rulesPanelCollapsed, setRulesPanelCollapsed] = useState<boolean>(false);
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const documentCategories = [
    { label: 'Imagens (PNG, JPG, JPEG, WEBP, GIF...)', value: 'IMAGEM' },
    { label: 'Documentos (PDF, DOC, DOCX, TXT, RTF...)', value: 'DOCUMENTO' },
    { label: 'Planilhas (XLSX, XLS, CSV, ODS...)', value: 'PLANILHA' },
    { label: 'Compactados (ZIP, RAR, 7Z, TAR...)', value: 'COMPACTADO' },
    { label: 'Mídia e Áudio (MP4, MKV, MP3, WAV...)', value: 'MIDIA' },
    { label: 'Código e Scripts (PY, JS, TS, SQL, JSON...)', value: 'CODIGO' },
    { label: 'Outros Arquivos', value: 'OUTROS' },
  ];

  const dynamicTags = [
    { label: '{ano}' },
    { label: '{mes}' },
    { label: '{dia}' },
    { label: '{tipo_doc}' },
    { label: '{extensao}' },
    { label: '{filename}' },
  ];

  const quickTemplates = [
    {
      title: 'Downloads por Tipo/Mês',
      name: 'Organizar Downloads Automaticamente',
      icon: FolderDown,
      filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf,xlsx,docx,jpg,png', logic_connector: 'AND' },
      pattern: '{ano}/{mes}/{tipo_doc}',
      action: 'MOVE'
    },
    {
      title: 'Planilhas Fiscais',
      name: 'Triagem de Planilhas e Relatórios Excel',
      icon: FileSpreadsheet,
      filter: { field_name: 'Tipo de Documento (Categoria)', operator: 'É IGUAL A', value: 'PLANILHA', logic_connector: 'AND' },
      pattern: 'Planilhas_{ano}/{mes}',
      action: 'MOVE'
    },
    {
      title: 'Fotos por Ano',
      name: 'Galeria de Imagens por Data',
      icon: ImageIcon,
      filter: { field_name: 'Tipo de Documento (Categoria)', operator: 'É IGUAL A', value: 'IMAGEM', logic_connector: 'AND' },
      pattern: 'Fotos_{ano}/{mes}',
      action: 'MOVE'
    },
    {
      title: 'Limpar Instaladores',
      name: 'Arquivos de Instalação e Executáveis',
      icon: Archive,
      filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'exe,msi,apk,dmg', logic_connector: 'OR' },
      pattern: 'Instaladores_Antigos',
      action: 'MOVE'
    },
    {
      title: 'Projetos de Código',
      name: 'Centralizar Códigos Fonte',
      icon: FileCode,
      filter: { field_name: 'Tipo de Documento (Categoria)', operator: 'É IGUAL A', value: 'CODIGO', logic_connector: 'AND' },
      pattern: 'Meus_Codigos/{extensao}',
      action: 'MOVE'
    }
  ];

  useEffect(() => {
    loadRules();
    invoke<LicenseInfo>('get_license_status').then(setLicense);
  }, []);

  useEffect(() => {
    if (initialSource) setSourceDir(initialSource);
  }, [initialSource]);

  const loadRules = async () => {
    try {
      const res = await invoke<Rule[]>('get_rules');
      setRules(res);
    } catch (e) {
      console.error(e);
    }
  };

  const selectSourceFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Selecione a Pasta de Origem' });
      if (selected && typeof selected === 'string') setSourceDir(selected);
    } catch (e) {
      alert(`Erro ao selecionar pasta de origem: ${e}`);
    }
  };

  const selectTargetFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Selecione a Pasta de Destino' });
      if (selected && typeof selected === 'string') setTargetDir(selected);
    } catch (e) {
      alert(`Erro ao selecionar pasta de destino: ${e}`);
    }
  };

  const insertTagToPattern = (tag: string) => {
    setCreatePattern(prev => `${prev}/${tag}`.replace('//', '/'));
  };

  const applyTemplate = (t: typeof quickTemplates[0]) => {
    setRuleName(t.name);
    setCreatePattern(t.pattern);
    setActionType(t.action);
    setFolderMode('criar');
    setFilters([t.filter]);
  };

  const addFilterRow = () => {
    setFilters([...filters, { field_name: 'Extensão', operator: 'CONTÉM', value: '', logic_connector: masterLogicOperator }]);
  };

  const removeFilterRow = (idx: number) => {
    if (filters.length <= 1) return;
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const moveFilterUp = (idx: number) => {
    if (idx <= 0) return;
    const nf = [...filters];
    const temp = nf[idx];
    nf[idx] = nf[idx - 1];
    nf[idx - 1] = temp;
    setFilters(nf);
  };

  const moveFilterDown = (idx: number) => {
    if (idx >= filters.length - 1) return;
    const nf = [...filters];
    const temp = nf[idx];
    nf[idx] = nf[idx + 1];
    nf[idx + 1] = temp;
    setFilters(nf);
  };

  const handleToggleAutoPilot = async (rule: Rule) => {
    if (!license?.is_activated) {
      setShowEnterpriseModal(true);
      return;
    }
    try {
      const nextState = !rule.is_sentinel_active;
      await invoke('toggle_sentinel_rule', { ruleId: rule.id, active: nextState });
      loadRules();
    } catch (e) {
      alert(e);
    }
  };

  const handleSave = async () => {
    if (license && !license.is_activated && rules.length >= license.max_rules && !editingId) {
      alert(`Limite de demonstração atingido (${license.max_rules} regras). Ative sua licença corporativa.`);
      return;
    }

    const finalTarget = folderMode === 'existente' ? targetDir : `${sourceDir}/${createPattern}`;

    if (!ruleName.trim() || !sourceDir.trim() || !finalTarget.trim()) {
      alert('Por favor, preencha o Nome da Regra, Pasta de Origem e o Destino.');
      return;
    }

    if (!autoCode && !customCode.trim()) {
      alert('Por favor, informe um Código/ID para a regra.');
      return;
    }

    const code = autoCode ? (rules.length + 1).toString() : customCode.trim();

    const newRule: Rule = {
      id: editingId || undefined,
      custom_code: code.toString(),
      name: ruleName.trim(),
      source_directory: sourceDir.trim(),
      logic_operator: masterLogicOperator,
      is_active: true,
      conflict_policy: conflictPolicy,
      filters,
      actions: [{ action_type: actionType, target_pattern: finalTarget.trim() }]
    };

    try {
      await invoke('save_rule', { rule: newRule });
      alert('Regra salva com sucesso.');
      resetForm();
      loadRules();
    } catch (e) {
      console.error("Falha detalhada ao salvar regra:", e);
      alert(`Falha ao salvar a regra: ${e}`);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setRuleName('');
    setCustomCode('');
    setAutoCode(true);
    setSourceDir('');
    setTargetDir('');
    setConflictPolicy('AUTONUMBER');
    setFolderMode('existente');
    setCreatePattern('{ano}/{mes}/{tipo_doc}');
    setFilters([{ field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }]);
  };

  const startResizing = () => {
    isResizingRef.current = true;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newLeftPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (newLeftPercent >= 35 && newLeftPercent <= 75) {
        setLeftWidthPercent(newLeftPercent);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const filteredAndSortedRules = useMemo(() => {
    let list = rules.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(ruleSearch.toLowerCase()) || 
                          r.custom_code.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                          r.source_directory.toLowerCase().includes(ruleSearch.toLowerCase());
      const matchAction = actionFilter === 'ALL' || r.actions.some(a => a.action_type === actionFilter);
      return matchSearch && matchAction;
    });

    list.sort((a, b) => {
      let res = 0;
      if (sortField === 'id') {
        res = a.custom_code.localeCompare(b.custom_code, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'name') {
        res = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }
      return sortOrder === 'asc' ? res : -res;
    });

    return list;
  }, [rules, ruleSearch, actionFilter, sortField, sortOrder]);

  return (
    <div ref={containerRef} className="flex h-full w-full gap-2.5 overflow-hidden select-none relative">
      
      {/* 📝 PAINEL ESQUERDO: Formulário do Construtor */}
      <div 
        style={{ width: rulesPanelCollapsed ? '100%' : `${leftWidthPercent}%` }}
        className="bg-slate-50/50 dark:bg-[#15151a] p-4 rounded-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar gap-4 min-w-[350px]"
      >
        <div className="space-y-4">
          
          {/* Cabeçalho */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FolderPlus size={16} style={{ color: accentColor }} />
              <span>{editingId ? 'Editar Regra de Automação' : 'Nova Regra de Automação'}</span>
            </h2>
            <div className="flex items-center gap-2">
              {editingId && (
                <button onClick={resetForm} className="text-xs text-red-500 font-bold hover:underline">
                  Cancelar Edição
                </button>
              )}
              {rulesPanelCollapsed && (
                <button
                  onClick={() => setRulesPanelCollapsed(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840]"
                >
                  <PanelRightOpen size={13} /> Ver Regras ({rules.length})
                </button>
              )}
            </div>
          </div>

          {/* Modelos Rápidos */}
          {!editingId && (
            <div className="p-3 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-2.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wand2 size={12} className="text-blue-500" /> Modelos Rápidos Avançados:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTemplates.map((t, idx) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#18181b] hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-[#2e2e34] transition-colors flex items-center gap-1.5"
                    >
                      <Icon size={13} className="text-blue-500 shrink-0" />
                      <span>{t.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CARD 1: Identificação e Origem */}
          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-[#2d2d34] pb-1">1. Identificação e Escopo</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cód / ID</label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={autoCode} 
                      onChange={(e) => {
                        setAutoCode(e.target.checked);
                        if (e.target.checked) setCustomCode('');
                      }}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer h-3 w-3"
                    />
                    Auto
                  </label>
                </div>
                <input 
                  type="text" 
                  disabled={autoCode}
                  placeholder={autoCode ? "Automático" : "Ex: 01"}
                  value={autoCode ? "Automático" : customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono font-bold ${
                    autoCode ? 'bg-slate-100 dark:bg-[#141416] opacity-60 cursor-not-allowed' : 'bg-slate-50 dark:bg-[#18181b]'
                  }`}
                />
              </div>

              <div className="sm:col-span-9">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Nome Descritivo da Regra</label>
                <input 
                  type="text" 
                  placeholder="Ex: Filtrar e Organizar Balancetes Mensais"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Diretório de Origem (Pasta Monitorada)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Caminho completo da pasta..."
                  value={sourceDir}
                  onChange={(e) => setSourceDir(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono text-[11px] min-w-0 outline-none"
                />
                <button
                  type="button"
                  onClick={selectSourceFolder}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] shrink-0 transition-colors"
                >
                  <FolderSearch size={13} /> Buscar
                </button>
              </div>
            </div>
          </div>

          {/* CARD 2: Condições de Disparo */}
          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Condições de Disparo</span>
                <button type="button" onClick={() => setActiveHelpModal('FILTERS')} className="text-slate-400 hover:text-blue-500">
                  <HelpCircle size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-medium text-slate-400">Atender a:</span>
                <select
                  value={masterLogicOperator}
                  onChange={(e) => handleMasterLogicChange(e.target.value)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-[#27272a] text-blue-600 dark:text-blue-400 border-0 outline-none cursor-pointer"
                >
                  <option value="AND">TODAS as regras (E)</option>
                  <option value="OR">QUALQUER uma (OU)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filters.map((f, idx) => {
                const isCategory = f.field_name === 'Tipo de Documento (Categoria)';
                const isDate = f.field_name.includes('Data');

                return (
                  <div key={idx} className="group flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#18181b] border border-slate-100 dark:border-[#27272b] rounded-xl text-xs hover:border-slate-300 dark:hover:border-[#383840] transition-colors">
                    <div className="flex flex-col shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveFilterUp(idx)} className="p-0.5 text-slate-400 hover:text-blue-500"><ArrowUp size={11} /></button>
                      <button type="button" onClick={() => moveFilterDown(idx)} className="p-0.5 text-slate-400 hover:text-blue-500"><ArrowDown size={11} /></button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 min-w-0">
                      <select 
                        value={f.field_name}
                        onChange={(e) => {
                          const nf = [...filters];
                          nf[idx].field_name = e.target.value;
                          if (e.target.value === 'Tipo de Documento (Categoria)') {
                            nf[idx].value = 'IMAGEM';
                            nf[idx].operator = 'É IGUAL A';
                          } else if (e.target.value.includes('Data')) {
                            nf[idx].operator = 'ESTÁ ENTRE (DATA/HORA)';
                            nf[idx].value = '';
                          } else {
                            nf[idx].value = '';
                          }
                          setFilters(nf);
                        }}
                        className="px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                      >
                        <option value="Extensão">Extensão</option>
                        <option value="Tipo de Documento (Categoria)">Categoria</option>
                        <option value="Nome do Arquivo">Nome</option>
                        <option value="Data de Criação">Criação</option>
                        <option value="Data de Modificação">Modificação</option>
                        <option value="Tamanho (Bytes)">Tamanho</option>
                      </select>

                      <select 
                        value={f.operator}
                        onChange={(e) => {
                          const nf = [...filters];
                          nf[idx].operator = e.target.value;
                          setFilters(nf);
                        }}
                        className="px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                      >
                        {isCategory ? (
                          <option value="É IGUAL A">É IGUAL A</option>
                        ) : isDate ? (
                          <>
                            <option value="ESTÁ ENTRE (DATA/HORA)">ESTÁ ENTRE</option>
                            <option value="MAIOR QUE">DEPOIS DE</option>
                            <option value="MENOR QUE">ANTES DE</option>
                          </>
                        ) : (
                          <>
                            <option value="CONTÉM">CONTÉM</option>
                            <option value="É IGUAL A">É IGUAL A</option>
                            <option value="NÃO É (DIFERENTE DE)">DIFERENTE DE</option>
                            <option value="COMEÇA COM">COMEÇA COM</option>
                            <option value="TERMINA COM">TERMINA COM</option>
                          </>
                        )}
                      </select>

                      {isCategory ? (
                        <select
                          value={f.value}
                          onChange={(e) => {
                            const nf = [...filters];
                            nf[idx].value = e.target.value;
                            setFilters(nf);
                          }}
                          className="px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-bold outline-none cursor-pointer truncate"
                        >
                          {documentCategories.map(cat => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text"
                          placeholder="Valor esperado..."
                          value={f.value}
                          onChange={(e) => {
                            const nf = [...filters];
                            nf[idx].value = e.target.value;
                            setFilters(nf);
                          }}
                          className="px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none"
                        />
                      )}
                    </div>

                    <button 
                      type="button" 
                      onClick={() => removeFilterRow(idx)} 
                      className="text-slate-400 hover:text-red-500 p-1.5 shrink-0 transition-colors"
                      disabled={filters.length <= 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              type="button"
              onClick={addFilterRow} 
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 pt-1.5 px-1"
            >
              <Plus size={14} /> Adicionar nova condição
            </button>
          </div>

          {/* CARD 3: Destino e Ações */}
          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Destino e Conflitos</span>
                <button type="button" onClick={() => setActiveHelpModal('TAGS')} className="text-slate-400 hover:text-blue-500">
                  <HelpCircle size={12} />
                </button>
              </div>

              <div className="flex gap-1 text-[11px] bg-slate-100 dark:bg-[#18181b] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFolderMode('existente')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${folderMode === 'existente' ? 'bg-white dark:bg-[#27272a] text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400'}`}
                >
                  Pasta Fixa
                </button>
                <button
                  type="button"
                  onClick={() => setFolderMode('criar')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${folderMode === 'criar' ? 'bg-white dark:bg-[#27272a] text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-400'}`}
                >
                  Pasta Dinâmica
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <select 
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer shrink-0"
              >
                <option value="MOVE">MOVER</option>
                <option value="COPY">COPIAR</option>
                <option value="ZIP">ZIP (AES-256)</option>
                <option value="RENAME">RENOMEAR</option>
                <option value="DELETE">EXCLUIR</option>
              </select>

              {folderMode === 'existente' ? (
                <div className="flex-1 flex gap-2 w-full min-w-0">
                  <input 
                    type="text" 
                    placeholder="Caminho completo da pasta de destino..."
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    className="flex-1 w-full min-w-0 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={selectTargetFolder}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#383840] flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    <FolderSearch size={13} /> Buscar
                  </button>
                </div>
              ) : (
                <input 
                  type="text" 
                  placeholder="Padrão de organização (Ex: {ano}/{mes}/{tipo_doc})"
                  value={createPattern}
                  onChange={(e) => setCreatePattern(e.target.value)}
                  className="flex-1 w-full min-w-0 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono text-[11px] outline-none"
                />
              )}
            </div>

            {folderMode === 'criar' && (
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-[#18181b] p-2 rounded-xl border border-slate-200 dark:border-[#2e2e34]">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-1">Inserir Tag Dinâmica:</span>
                {dynamicTags.map(tag => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => insertTagToPattern(tag.label)}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-[#202024] hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold border border-slate-200 dark:border-[#333338] transition-colors"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-[#2d2d34] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert size={13} className="text-amber-500" /> Resolução de Ficheiros Duplicados
                </span>
                <button type="button" onClick={() => setActiveHelpModal('DUPLICATES')} className="text-slate-400 hover:text-amber-500">
                  <HelpCircle size={11} />
                </button>
              </div>
              <select
                value={conflictPolicy}
                onChange={(e) => setConflictPolicy(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-bold outline-none cursor-pointer"
              >
                <option value="AUTONUMBER">Autonumerar em lote corporativo — Ex: ficheiro (1).pdf</option>
                <option value="INCREMENTAL">Backup Incremental Inteligente (Ignorar idênticos via SHA-256)</option>
                <option value="OVERWRITE">Substituir e Sobrescrever o Ficheiro Antigo</option>
                <option value="SKIP">Ignorar e Pular a Operação</option>
              </select>
            </div>
          </div>
        </div>

        {/* Rodapé do Formulário */}
        <div className="pt-3 bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs flex items-center justify-between shrink-0">
          <button 
            type="button"
            onClick={resetForm}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} />
            <span>Limpar Filtros</span>
          </button>

          <button 
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            <Save size={14} /> 
            <span>Gravar Regra</span>
          </button>
        </div>
      </div>

      {/* Divisor Redimensionável */}
      {!rulesPanelCollapsed && (
        <div
          onMouseDown={startResizing}
          className="w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors mx-0.5 rounded-full shrink-0 hidden md:block"
        />
      )}

      {/* 📋 PAINEL DIREITO: Regras Cadastradas com Modos de Visualização */}
      {!rulesPanelCollapsed && (
        <div 
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] flex flex-col space-y-3 shadow-sm min-w-[280px] shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered size={15} style={{ color: accentColor }} />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">Regras Ativas</h2>
            </div>
            
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#18181b] p-0.5 rounded-lg border border-slate-200/60 dark:border-[#2c2c32]">
              <button
                type="button"
                onClick={() => setViewMode('blocks')}
                className={`p-1 rounded-md transition-all ${viewMode === 'blocks' ? 'bg-white dark:bg-[#27272a] text-blue-500 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                title="Visualização em Blocos"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('minimal')}
                className={`p-1 rounded-md transition-all ${viewMode === 'minimal' ? 'bg-white dark:bg-[#27272a] text-blue-500 shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                title="Visualização Minimalista Compacta"
              >
                <Rows size={13} />
              </button>
            </div>

            <button 
              onClick={() => setRulesPanelCollapsed(true)} 
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors ml-1"
            >
              <PanelRightClose size={15} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar regras..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-[#18181b] p-1.5 rounded-xl border border-slate-200 dark:border-[#2e2e34]">
              <div className="flex items-center gap-1">
                <Filter size={11} className="text-slate-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-transparent text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer text-[10px]"
                >
                  <option value="ALL">Todas ({rules.length})</option>
                  <option value="MOVE">Mover</option>
                  <option value="COPY">Copiar</option>
                  <option value="ZIP">Compactar</option>
                  <option value="RENAME">Renomear</option>
                  <option value="DELETE">Excluir</option>
                </select>
              </div>

              <div className="h-3 w-[1px] bg-slate-200 dark:bg-[#333338]" />

              <div className="flex items-center gap-1">
                <span>Ordem:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-transparent text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer text-[10px]"
                >
                  <option value="id">ID</option>
                  <option value="name">Nome</option>
                </select>

                <button
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                >
                  <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'text-blue-600' : 'text-purple-600'} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-72 lg:max-h-none custom-scrollbar">
            {filteredAndSortedRules.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center">
                Nenhuma regra encontrada.
              </div>
            ) : viewMode === 'blocks' ? (
              /* MODO 1: VISUALIZAÇÃO EM BLOCOS (PADRÃO REFORMULADO) */
              filteredAndSortedRules.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-2 hover:border-slate-300 dark:hover:border-[#383840] transition-colors">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      ID {r.custom_code} - {r.name}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => {
                        setEditingId(r.id || null);
                        setRuleName(r.name);
                        setCustomCode(r.custom_code);
                        setAutoCode(false);
                        setSourceDir(r.source_directory);
                        setFilters(r.filters);
                        if (r.actions[0]) {
                          setActionType(r.actions[0].action_type);
                          setTargetDir(r.actions[0].target_pattern);
                        }
                      }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={13} /></button>
                      <button onClick={() => { if(confirm('Excluir esta automação permanentemente?')) invoke('delete_rule', { ruleId: r.id }).then(loadRules); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    <Folder size={13} className="text-amber-500 shrink-0" />
                    <span className="truncate" title={r.source_directory}>{r.source_directory}</span>
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200 dark:border-[#2d2d34]">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-[#25252b] px-2 py-0.5 rounded shrink-0">
                      {r.actions[0]?.action_type}
                    </div>

                    <button
                      onClick={() => handleToggleAutoPilot(r)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                        r.is_sentinel_active
                          ? 'bg-green-50 dark:bg-green-950/60 text-green-600 border border-green-300 dark:border-green-800'
                          : 'bg-slate-200/70 dark:bg-[#27272a] text-slate-500 hover:text-slate-700 dark:hover:text-white border border-slate-300 dark:border-[#383840]'
                      }`}
                      title={r.is_sentinel_active ? "Execução Automática ativa em background" : "Ligar Execução Automática"}
                    >
                      <Bot size={12} className={r.is_sentinel_active ? "text-green-600" : ""} />
                      <span>{r.is_sentinel_active ? "Automático" : "Manual"}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* MODO 2: VISUALIZAÇÃO MINIMALISTA COMPACTA (NOVO) */
              <div className="border border-slate-100 dark:border-[#2c2c32] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-[#27272c]">
                {filteredAndSortedRules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50/50 dark:bg-[#18181b] hover:bg-slate-100 dark:hover:bg-[#1f1f24] transition-colors text-xs">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-200/60 dark:bg-[#25252b] px-1.5 py-0.5 rounded shrink-0">
                        {r.custom_code}
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={r.name}>
                        {r.name}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase px-1 rounded-sm tracking-wider shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/30">
                        {r.actions[0]?.action_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleAutoPilot(r)}
                        className={`p-1 rounded-md transition-colors ${r.is_sentinel_active ? 'text-green-500 hover:text-green-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        title={r.is_sentinel_active ? "Execução Automática Ligada" : "Ligar Execução Automática"}
                      >
                        <Bot size={13} />
                      </button>
                      <button onClick={() => {
                        setEditingId(r.id || null);
                        setRuleName(r.name);
                        setCustomCode(r.custom_code);
                        setAutoCode(false);
                        setSourceDir(r.source_directory);
                        setFilters(r.filters);
                        if (r.actions[0]) {
                          setActionType(r.actions[0].action_type);
                          setTargetDir(r.actions[0].target_pattern);
                        }
                      }} className="p-1 text-slate-400 hover:text-blue-500" title="Editar"><Edit3 size={13} /></button>
                      <button onClick={() => { if(confirm('Excluir esta automação permanentemente?')) invoke('delete_rule', { ruleId: r.id }).then(loadRules); }} className="p-1 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Aviso de Ativação / Corporativo */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-sm rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-amber-500">
              <AlertTriangle size={20} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">Recurso Premium</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O monitoramento em segundo plano via **Execução Automática** exige uma ativação de licença válida da BINAVER.
            </p>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowEnterpriseModal(false)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold transition-transform active:scale-95 shadow-sm">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais Adicionais de Ajuda */}
      {activeHelpModal === 'TAGS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Ajuda: Tags Dinâmicas</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>• <strong>&#123;ano&#125;</strong>: Substituído pelo ano de criação/modificação (Ex: 2026).</p>
              <p>• <strong>&#123;mes&#125;</strong>: Mês numérico formatado com dois dígitos (Ex: 08).</p>
              <p>• <strong>&#123;tipo_doc&#125;</strong>: Categoria inteligente (DOCUMENTO, PLANILHA, IMAGEM, CODIGO).</p>
              <p>• <strong>&#123;extensao&#125;</strong>: Formato original do ficheiro (pdf, xlsx, txt).</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {activeHelpModal === 'FILTERS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Operadores Condicionais</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>TODAS as regras (E):</strong> O arquivo só será processado se passar em todos os critérios criados.</p>
              <p>• <strong>QUALQUER uma (OU):</strong> Se o arquivo for validado por pelo menos um critério, a ação será executada.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {activeHelpModal === 'DUPLICATES' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Tratamento de Colisões</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>Autonumerar:</strong> Adiciona sufixos numéricos sequenciais (ex: relatorio (1).xlsx).</p>
              <p>• <strong>Backup Incremental:</strong> Compara hashes digitais para pular arquivos perfeitamente idênticos, otimizando o armazenamento.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RuleBuilder;