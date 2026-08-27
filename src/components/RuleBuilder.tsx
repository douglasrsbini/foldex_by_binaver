import React, { useState, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Rule, RuleFilter, LicenseInfo } from '../types';
import { 
  Plus, Trash2, ArrowUp, ArrowDown, Save, Edit3, FolderSearch, 
  ListOrdered, Search, Filter, ArrowUpDown, PanelRightClose, 
  PanelRightOpen, Bot, ShieldAlert, Folder, FolderPlus, Wand2, 
  HelpCircle, RotateCcw, FolderDown, FileSpreadsheet, 
  Image as ImageIcon, Archive, X, 
  Sparkles, LayoutGrid, Rows, RefreshCw, Layers, Send, Lock, Eraser, Code, FileSearch, Info, FileText, ArrowRight, CornerDownRight, Building, User, Users, FileCheck, Receipt, Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ENABLE_AI_FEATURES = false; 

interface RuleBuilderProps {
  initialSource?: string;
  accentColor: string;
  onNavigateToAccount?: () => void;
  userNiche?: string; // ⚡ Recebendo a informação de nicho do App.tsx
}

type SortField = 'id' | 'name';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'blocks' | 'minimal';
type RegexPreset = 'NONE' | 'NUMBERS_ONLY' | 'EXTRACT_CPF' | 'EXTRACT_CNPJ' | 'CLEAN_SCANNER' | 'EXTRACT_DATE' | 'EXTRACT_MATRICULA' | 'CUSTOM';

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ initialSource, accentColor, onNavigateToAccount, userNiche }) => {
  const { t } = useTranslation(); 

  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

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
  
  const [cleanAccents, setCleanAccents] = useState(false);
  const [replaceSpaces, setReplaceSpaces] = useState(false);
  const [caseFormat, setCaseFormat] = useState('NONE'); 
  const [regexPreset, setRegexPreset] = useState<RegexPreset>('NONE');
  const [regexPattern, setRegexPattern] = useState('');
  const [regexReplacement, setRegexReplacement] = useState('');

  const [activeTemplateDesc, setActiveTemplateDesc] = useState<string | null>(null);
  const [pulseSource, setPulseSource] = useState(false);

  const [filters, setFilters] = useState<RuleFilter[]>([
    { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }
  ]);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [upsellFeature, setUpsellFeature] = useState<'AUTOPILOT' | 'SMART_ORGANIZE' | null>(null);
  const isCorePlan = useMemo(() => {
    if (!license || !license.is_activated) return true;
    const plan = license.plan_name.toLowerCase();
    return plan.includes('core');
  }, [license]);

  const [activeHelpModal, setActiveHelpModal] = useState<'TAGS' | 'FILTERS' | 'DUPLICATES' | 'REGEX' | null>(null);

  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartSourceDir, setSmartSourceDir] = useState('');
  const [isSmartRunning, setIsSmartRunning] = useState(false);

  const [ruleSearch, setRuleSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('foldex_rules_view_mode');
    return (saved as ViewMode) || 'blocks';
  });

  useEffect(() => {
    localStorage.setItem('foldex_rules_view_mode', viewMode);
  }, [viewMode]);

  const masterLogicOperator = useMemo(() => {
    return filters.some(f => f.logic_connector === 'OR') ? 'OR' : 'AND';
  }, [filters]);

  const handleMasterLogicChange = (value: string) => {
    setFilters(prev => prev.map(f => ({ ...f, logic_connector: value })));
  };

  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(75);
  const [rulesPanelCollapsed, setRulesPanelCollapsed] = useState<boolean>(false);
  const isResizingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const documentCategories = [
    { label: t('rule_builder.categories.image'), value: 'IMAGEM' },
    { label: t('rule_builder.categories.document'), value: 'DOCUMENTO' },
    { label: t('rule_builder.categories.spreadsheet'), value: 'PLANILHA' },
    { label: t('rule_builder.categories.compressed'), value: 'COMPACTADO' },
    { label: t('rule_builder.categories.media'), value: 'MIDIA' },
    { label: t('rule_builder.categories.code'), value: 'CODIGO' },
    { label: t('rule_builder.categories.others'), value: 'OUTROS' },
  ];

  const dynamicTags = [
    { label: '{ano}', name: t('rule_builder.tags.year') }, 
    { label: '{mes}', name: t('rule_builder.tags.month') }, 
    { label: '{dia}', name: t('rule_builder.tags.day') },
    { label: '{tipo_doc}', name: t('rule_builder.tags.category') }, 
    { label: '{extensao}', name: t('rule_builder.tags.format') }, 
  ];

// ⚡ Lógica de Filtragem de Presets baseada no Nicho do Usuário (AGORA COM OS NOVOS TEMPLATES)
  const quickTemplates = useMemo(() => {
    const allTemplates = [
      { 
        niches: ['cartorio', 'contabilidade', 'juridico', 'rh', 'geral', 'agro'],
        title: t('rule_builder.templates.clean_scanner.title'), badge: t('rule_builder.templates.clean_scanner.badge'), name: t('rule_builder.templates.clean_scanner.name'), 
        description: t('rule_builder.templates.clean_scanner.desc'), 
        icon: Eraser, filter: { field_name: 'Nome do Arquivo', operator: 'COMEÇA COM', value: 'SCAN', logic_connector: 'OR' }, pattern: 'Arquivos_Limpos', action: 'MOVE', regexPreset: 'CLEAN_SCANNER' as RegexPreset 
      },
      { 
        niches: ['cartorio', 'juridico', 'agro'],
        title: t('rule_builder.templates.extract_matricula.title'), badge: t('rule_builder.templates.extract_matricula.badge'), name: t('rule_builder.templates.extract_matricula.name'), 
        description: t('rule_builder.templates.extract_matricula.desc'), 
        icon: FileSearch, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }, pattern: 'Matriculas_Extraidas', action: 'MOVE', regexPreset: 'EXTRACT_MATRICULA' as RegexPreset 
      },
      { 
        niches: ['cartorio', 'contabilidade', 'juridico', 'agro'],
        title: t('rule_builder.templates.extract_cnpj.title'), badge: t('rule_builder.templates.extract_cnpj.badge'), name: t('rule_builder.templates.extract_cnpj.name'), 
        description: t('rule_builder.templates.extract_cnpj.desc'), 
        icon: Building, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }, pattern: 'Empresas/{ano}', action: 'MOVE', regexPreset: 'EXTRACT_CNPJ' as RegexPreset, replaceSpaces: true, cleanAccents: true 
      },
      { 
        niches: ['cartorio', 'contabilidade', 'juridico', 'rh', 'agro'],
        title: t('rule_builder.templates.extract_cpf.title'), badge: t('rule_builder.templates.extract_cpf.badge'), name: t('rule_builder.templates.extract_cpf.name'), 
        description: t('rule_builder.templates.extract_cpf.desc'), 
        icon: User, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }, pattern: 'Clientes_Fisicos/{ano}', action: 'MOVE', regexPreset: 'EXTRACT_CPF' as RegexPreset 
      },
      { 
        niches: ['juridico', 'contabilidade', 'cartorio', 'rh', 'agro'],
        title: t('rule_builder.templates.isolate_contracts.title'), badge: t('rule_builder.templates.isolate_contracts.badge'), name: t('rule_builder.templates.isolate_contracts.name'), 
        description: t('rule_builder.templates.isolate_contracts.desc'), 
        icon: FileCheck, filter: { field_name: 'Nome do Arquivo', operator: 'CONTÉM', value: 'contrato', logic_connector: 'OR' }, pattern: 'Juridico_Contratos/{ano}', action: 'MOVE', cleanAccents: true, replaceSpaces: true 
      },
      { 
        niches: ['contabilidade', 'geral', 'agro'],
        title: t('rule_builder.templates.receipts.title'), badge: t('rule_builder.templates.receipts.badge'), name: t('rule_builder.templates.receipts.name'), 
        description: t('rule_builder.templates.receipts.desc'), 
        icon: Receipt, filter: { field_name: 'Nome do Arquivo', operator: 'CONTÉM', value: 'comprovante,recibo,pix', logic_connector: 'OR' }, pattern: 'Comprovantes/{ano}/{mes}', action: 'MOVE' 
      },
      // ⚡ NOVOS TEMPLATES ABAIXO
      { 
        niches: ['contabilidade', 'geral', 'agro'],
        title: t('rule_builder.templates.extract_xml.title') || 'Notas Fiscais XML', badge: t('rule_builder.templates.extract_xml.badge') || 'Mover XML', name: t('rule_builder.templates.extract_xml.name') || 'Triagem de Notas Fiscais (NFe)', 
        description: t('rule_builder.templates.extract_xml.desc') || 'Localiza e separa todos os arquivos .xml soltos.', 
        icon: Code, filter: { field_name: 'Extensão', operator: 'É IGUAL A', value: 'xml', logic_connector: 'AND' }, pattern: 'Notas_Fiscais_XML/{ano}/{mes}', action: 'MOVE' 
      },
      { 
        niches: ['agro', 'cartorio', 'geral'],
        title: t('rule_builder.templates.agro_tickets.title') || 'Romaneios / Tickets', badge: t('rule_builder.templates.agro_tickets.badge') || 'Mover Todos', name: t('rule_builder.templates.agro_tickets.name') || 'Organização de Romaneios', 
        description: t('rule_builder.templates.agro_tickets.desc') || 'Filtra arquivos contendo romaneio ou ticket.', 
        icon: FileText, filter: { field_name: 'Nome do Arquivo', operator: 'CONTÉM', value: 'romaneio,ticket,pesagem', logic_connector: 'OR' }, pattern: 'Romaneios_Agro/{ano}', action: 'MOVE' 
      },
      { 
        niches: ['geral'],
        title: t('rule_builder.templates.projects_cad.title') || 'Projetos CAD / 3D', badge: t('rule_builder.templates.projects_cad.badge') || 'Mover CAD', name: t('rule_builder.templates.projects_cad.name') || 'Triagem de Projetos Engenharia/Móveis', 
        description: t('rule_builder.templates.projects_cad.desc') || 'Isola rapidamente arquivos DWG, DXF, SKP e afins.', 
        icon: Layers, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'dwg,dxf,skp,rvt', logic_connector: 'OR' }, pattern: 'Projetos_Engenharia', action: 'MOVE' 
      },
      { 
        niches: ['rh', 'contabilidade'],
        title: t('rule_builder.templates.hr_holerites.title') || 'Holerites / Folha', badge: t('rule_builder.templates.hr_holerites.badge') || 'Mover PDF', name: t('rule_builder.templates.hr_holerites.name') || 'Organização de Recibos de Pagamento', 
        description: t('rule_builder.templates.hr_holerites.desc') || 'Identifica documentos de folha de pagamento.', 
        icon: Users, filter: { field_name: 'Nome do Arquivo', operator: 'CONTÉM', value: 'holerite,recibo de pagamento,folha', logic_connector: 'OR' }, pattern: 'RH_Holerites/{ano}/{mes}', action: 'MOVE' 
      },
      // ⚡ FIM DOS NOVOS TEMPLATES
      { 
        niches: ['geral', 'rh'],
        title: t('rule_builder.templates.auto_trash.title'), badge: t('rule_builder.templates.auto_trash.badge'), name: t('rule_builder.templates.auto_trash.name'), 
        description: t('rule_builder.templates.auto_trash.desc'), 
        icon: Trash2, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'tmp,bak,log', logic_connector: 'OR' }, pattern: '', action: 'DELETE' 
      },
      { 
        niches: ['geral', 'contabilidade', 'juridico', 'agro'],
        title: t('rule_builder.templates.compress_old.title'), badge: t('rule_builder.templates.compress_old.badge'), name: t('rule_builder.templates.compress_old.name'), 
        description: t('rule_builder.templates.compress_old.desc'), 
        icon: Archive, filter: { field_name: 'Data de Modificação', operator: 'MENOR QUE', value: '2025-01-01', logic_connector: 'AND' }, pattern: 'Cofre_Antigos', action: 'ZIP' 
      },
      { 
        niches: ['geral', 'rh', 'agro'],
        title: t('rule_builder.templates.downloads_month.title'), badge: t('rule_builder.templates.downloads_month.badge'), name: t('rule_builder.templates.downloads_month.name'), 
        description: t('rule_builder.templates.downloads_month.desc'), 
        icon: FolderDown, filter: { field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf,xlsx,docx,jpg,png', logic_connector: 'AND' }, pattern: '{ano}/{mes}/{tipo_doc}', action: 'MOVE' 
      },
      { 
        niches: ['contabilidade', 'rh', 'geral', 'agro'],
        title: t('rule_builder.templates.isolate_sheets.title'), badge: t('rule_builder.templates.isolate_sheets.badge'), name: t('rule_builder.templates.isolate_sheets.name'), 
        description: t('rule_builder.templates.isolate_sheets.desc'), 
        icon: FileSpreadsheet, filter: { field_name: 'Tipo de Documento (Categoria)', operator: 'É IGUAL A', value: 'PLANILHA', logic_connector: 'AND' }, pattern: 'Planilhas_{ano}/{mes}', action: 'MOVE' 
      }
    ];

    if (!userNiche || userNiche === 'geral') {
      return allTemplates.filter(t => t.niches.includes('geral'));
    }
    
    return allTemplates.filter(t => t.niches.includes(userNiche));
  }, [userNiche, t]);

  const translateField = (f: string) => {
    const map: Record<string, string> = {
      'Extensão': t('rule_builder.filter_ext'),
      'Tipo de Documento (Categoria)': t('rule_builder.filter_cat'),
      'Nome do Arquivo': t('rule_builder.filter_name'),
      'Data de Criação': t('rule_builder.filter_cdate'),
      'Data de Modificação': t('rule_builder.filter_mdate'),
      'Tamanho (Bytes)': t('rule_builder.filter_size'),
    };
    return map[f] || f;
  };

  const translateOp = (op: string) => {
    const map: Record<string, string> = {
      'CONTÉM': t('rule_builder.op_contains'),
      'É IGUAL A': t('rule_builder.op_equals'),
      'NÃO É (DIFERENTE DE)': t('rule_builder.op_not_equals'),
      'COMEÇA COM': t('rule_builder.op_starts'),
      'TERMINA COM': t('rule_builder.op_ends'),
      'ESTÁ ENTRE (DATA/HORA)': t('rule_builder.op_between'),
      'MAIOR QUE': t('rule_builder.op_greater'),
      'MENOR QUE': t('rule_builder.op_less'),
    };
    return map[op] || op;
  };

  useEffect(() => {
    loadRules();
    invoke<LicenseInfo>('get_license_status').then(setLicense);
  }, []);

  useEffect(() => {
    if (initialSource) setSourceDir(initialSource);
  }, [initialSource]);

  useEffect(() => {
    if (regexPreset === 'NONE') {
      setRegexPattern(''); setRegexReplacement('');
    } else if (regexPreset === 'NUMBERS_ONLY') {
      setRegexPattern('[^0-9]'); setRegexReplacement('');
    } else if (regexPreset === 'EXTRACT_CPF') {
      setRegexPattern('.*?(\\d{11}).*'); setRegexReplacement('CPF_$1');
    } else if (regexPreset === 'EXTRACT_CNPJ') {
      setRegexPattern('.*?(\\d{14}).*'); setRegexReplacement('CNPJ_$1');
    } else if (regexPreset === 'CLEAN_SCANNER') {
      setRegexPattern('(?i)^(?:SCAN|DOC|IMG)[_\\-]?(.*)'); setRegexReplacement('$1');
    } else if (regexPreset === 'EXTRACT_DATE') {
      setRegexPattern('.*?(\\d{2,4}[-/]\\d{2}[-/]\\d{2,4}).*'); setRegexReplacement('Data_$1');
    } else if (regexPreset === 'EXTRACT_MATRICULA') {
      setRegexPattern('.*?(\\d{5,7}).*'); setRegexReplacement('Matricula_$1');
    }
  }, [regexPreset]);

  const simulatedName = useMemo(() => {
    let name = t('rule_builder.mock_filename');
    
    if (regexPreset === 'EXTRACT_CPF') name = t('rule_builder.mock_cpf');
    else if (regexPreset === 'EXTRACT_CNPJ') name = t('rule_builder.mock_cnpj');
    else if (regexPreset === 'EXTRACT_MATRICULA') name = t('rule_builder.mock_matricula');
    else if (regexPreset === 'EXTRACT_DATE') name = t('rule_builder.mock_date');
    
    let ext = ".pdf";

    if (regexPattern && regexReplacement !== undefined) {
      try {
        const re = new RegExp(regexPattern, 'i');
        name = name.replace(re, regexReplacement);
      } catch (e) {}
    }

    if (cleanAccents) {
      name = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    
    if (replaceSpaces) {
      name = name.replace(/\s+/g, "_");
    }

    if (caseFormat === 'UPPER') {
      name = name.toUpperCase();
    } else if (caseFormat === 'LOWER') {
      name = name.toLowerCase();
    }

    return name + ext;
  }, [cleanAccents, replaceSpaces, caseFormat, regexPattern, regexReplacement, regexPreset, t]);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const res = await invoke<Rule[]>('get_rules');
      setRules(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;

    const apiKey = localStorage.getItem('foldex_gemini_key');
    if (!apiKey) {
      alert(t('rule_builder.ai_access_denied'));
      return;
    }

    setIsAiLoading(true);
    try {
      const jsonStr = await invoke<string>('generate_rule_via_ai', { prompt: aiPrompt, apiKey: apiKey.trim() });
      const data = JSON.parse(jsonStr);

      if (data.ruleName) setRuleName(data.ruleName);
      if (data.actionType) setActionType(data.actionType);
      if (data.targetDir) {
        setFolderMode('criar');
        setCreatePattern(data.targetDir);
      }
      if (data.filters && Array.isArray(data.filters)) {
        setFilters(data.filters);
      }

      setAiPrompt('');
      alert(t('rule_builder.ai_success'));
    } catch (e) {
      console.error(e);
      alert(`${t('rule_builder.ai_error')}: ${e}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const selectSourceFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: t('rule_builder.select_source') });
      if (selected && typeof selected === 'string') setSourceDir(selected);
    } catch (e) { alert(`${t('rule_builder.error_source')}: ${e}`); }
  };

  const selectTargetFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: t('rule_builder.select_target') });
      if (selected && typeof selected === 'string') setTargetDir(selected);
    } catch (e) { alert(`${t('rule_builder.error_target')}: ${e}`); }
  };

  const handleOpenSmartOrganize = () => {
    if (isCorePlan) {
      setUpsellFeature('SMART_ORGANIZE');
      return;
    }
    setShowSmartModal(true);
  };

  const selectSmartFolder = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: t('rule_builder.select_smart_folder') });
      if (selected && typeof selected === 'string') setSmartSourceDir(selected);
    } catch (e) { alert(`Erro: ${e}`); }
  };

  const runSmartOrganize = async () => {
    if (!smartSourceDir) return alert(t('rule_builder.select_smart_folder_req'));
    setIsSmartRunning(true);
    try {
      const result = await invoke<string>('smart_organize_folder', { path: smartSourceDir });
      alert(result);
      setShowSmartModal(false);
      setSmartSourceDir('');
    } catch (e) {
      alert(`${t('rule_builder.smart_organize_error')}: ${e}`);
    } finally {
      setIsSmartRunning(false);
    }
  };

  const insertTagToPattern = (tag: string) => {
    setCreatePattern(prev => {
      const cleanPrev = prev.endsWith('/') ? prev : prev + '/';
      return (cleanPrev + tag).replace('//', '/');
    });
  };

  const applyTemplate = (tTemplate: any) => {
    setRuleName(tTemplate.name); 
    setCreatePattern(tTemplate.pattern || ''); 
    setActionType(tTemplate.action);
    setFolderMode(tTemplate.pattern ? 'criar' : 'existente'); 
    setFilters([tTemplate.filter]);
    setRegexPreset(tTemplate.regexPreset || 'NONE');
    setCleanAccents(tTemplate.cleanAccents || false);
    setReplaceSpaces(tTemplate.replaceSpaces || false);
    setCaseFormat(tTemplate.caseFormat || 'NONE');
    
    setActiveTemplateDesc(tTemplate.description);
    setPulseSource(true);
    setTimeout(() => setPulseSource(false), 2000);
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
    const temp = nf[idx]; nf[idx] = nf[idx - 1]; nf[idx - 1] = temp;
    setFilters(nf);
  };

  const moveFilterDown = (idx: number) => {
    if (idx >= filters.length - 1) return;
    const nf = [...filters];
    const temp = nf[idx]; nf[idx] = nf[idx + 1]; nf[idx + 1] = temp;
    setFilters(nf);
  };

  const handleToggleAutoPilot = async (rule: Rule) => {
    if (isCorePlan) {
      setUpsellFeature('AUTOPILOT');
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
      alert(`${t('rule_builder.demo_limit')} (${license.max_rules} regras).`);
      return;
    }

    const finalTarget = folderMode === 'existente' ? targetDir : `${sourceDir}/${createPattern}`;

    if (!ruleName.trim() || !sourceDir.trim() || (!finalTarget.trim() && actionType !== 'DELETE')) {
      alert(t('rule_builder.req_fields'));
      return;
    }

    if (!autoCode && !customCode.trim()) {
      alert(t('rule_builder.req_code'));
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
      actions: [{ 
        action_type: actionType, 
        target_pattern: finalTarget.trim(),
        clean_accents: cleanAccents,
        replace_spaces: replaceSpaces,
        case_format: caseFormat,
        regex_pattern: regexPattern,
        regex_replacement: regexReplacement
      }]
    };

    try {
      await invoke('save_rule', { rule: newRule });
      alert(t('rule_builder.save_success'));
      resetForm();
      loadRules();
    } catch (e) {
      console.error("Falha detalhada ao salvar regra:", e);
      alert(`${t('rule_builder.save_error')}: ${e}`);
    }
  };

  const resetForm = () => {
    setEditingId(null); setRuleName(''); setCustomCode(''); setAutoCode(true); setSourceDir('');
    setTargetDir(''); setConflictPolicy('AUTONUMBER'); setFolderMode('existente');
    setCreatePattern('{ano}/{mes}/{tipo_doc}');
    setFilters([{ field_name: 'Extensão', operator: 'CONTÉM', value: 'pdf', logic_connector: 'AND' }]);
    
    setCleanAccents(false);
    setReplaceSpaces(false);
    setCaseFormat('NONE');
    setRegexPreset('NONE');
    setRegexPattern('');
    setRegexReplacement('');
    setActiveTemplateDesc(null);
  };

  const startResizing = () => {
    isResizingRef.current = true;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newLeftPercent = ((e.clientX - rect.left) / rect.width) * 100;
      if (newLeftPercent >= 35 && newLeftPercent <= 85) {
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
          
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <FolderPlus size={16} style={{ color: accentColor }} />
              <span>{editingId ? t('rule_builder.edit_title') : t('rule_builder.title')}</span>
            </h2>
            <div className="flex items-center gap-2">
              {editingId && (
                <button onClick={resetForm} className="text-xs text-red-500 font-bold hover:underline">
                  {t('rule_builder.cancel_edit')}
                </button>
              )}
              {rulesPanelCollapsed && (
                <button
                  onClick={() => setRulesPanelCollapsed(false)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840]"
                >
                  <PanelRightOpen size={13} /> {t('rule_builder.view_rules')} ({rules.length})
                </button>
              )}
            </div>
          </div>

          {!editingId && (
            <div className="bg-white dark:bg-[#1e1e24] p-3.5 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
                  <Wand2 size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white">{t('rule_builder.smart_organize')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{t('rule_builder.smart_organize_desc')}</p>
                </div>
              </div>
              <button 
                onClick={handleOpenSmartOrganize} 
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#383840] transition-colors shrink-0 flex items-center gap-1.5"
              >
                {isCorePlan ? <Lock size={13} className="opacity-70" /> : <Layers size={13} />}
                <span>{t('rule_builder.btn_execute')}</span>
              </button>
            </div>
          )}

          {!editingId && ENABLE_AI_FEATURES && (
            <div className="relative overflow-hidden p-4 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-[#1a1b26] dark:to-[#171622] shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={100} />
              </div>
              <div className="relative z-10 flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {t('rule_builder.ai_title')}
                  </span>
                </div>
                
                <div className="flex gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                  <input 
                    type="text"
                    placeholder={t('rule_builder.ai_placeholder')}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                    disabled={isAiLoading}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#202024] border border-indigo-200 dark:border-indigo-900/50 rounded-xl text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-60"
                  />
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isAiLoading || !aiPrompt.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {isAiLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span className="hidden sm:inline">{isAiLoading ? t('rule_builder.ai_btn_generating') : t('rule_builder.ai_btn_generate')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {!editingId && (
            <div className="p-3 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wand2 size={12} className="text-blue-500" /> {t('rule_builder.shortcuts_title')}
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                {quickTemplates.map((tItem, idx) => {
                  const Icon = tItem.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyTemplate(tItem)}
                      className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-[#18181b] hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-slate-200 dark:border-[#2e2e34] hover:border-blue-300 transition-all text-center group cursor-pointer"
                      title={tItem.description}
                    >
                      <Icon size={16} className="text-blue-500 dark:text-blue-400 mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight truncate w-full">{tItem.title}</span>
                      <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">{tItem.badge}</span>
                    </button>
                  );
                })}
              </div>

              {activeTemplateDesc && (
                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed animate-in fade-in slide-in-from-top-1 flex gap-2 items-start">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p><strong>{t('rule_builder.how_it_works')}</strong> {activeTemplateDesc}</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 dark:border-[#2d2d34] pb-1">{t('rule_builder.step_1')}</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('rule_builder.code_id')}</label>
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
                    {t('rule_builder.auto')}
                  </label>
                </div>
                <input 
                  type="text" 
                  disabled={autoCode}
                  placeholder={autoCode ? t('rule_builder.auto_placeholder') : t('rule_builder.code_placeholder')}
                  value={autoCode ? t('rule_builder.auto_placeholder') : customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono font-bold ${
                    autoCode ? 'bg-slate-100 dark:bg-[#141416] opacity-60 cursor-not-allowed' : 'bg-slate-50 dark:bg-[#18181b]'
                  }`}
                />
              </div>

              <div className="sm:col-span-9">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{t('rule_builder.rule_name')}</label>
                <input 
                  type="text" 
                  placeholder={t('rule_builder.rule_name_ph')}
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-semibold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">{t('rule_builder.source_dir')}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={t('rule_builder.source_dir_ph')}
                  value={sourceDir}
                  onChange={(e) => setSourceDir(e.target.value)}
                  className={`flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border rounded-xl text-slate-800 dark:text-white font-mono text-[11px] min-w-0 outline-none transition-all duration-300 ${
                    pulseSource ? 'border-amber-400 ring-2 ring-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10' : 'border-slate-200 dark:border-[#2e2e34]'
                  }`}
                />
                <button
                  type="button"
                  onClick={selectSourceFolder}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] shrink-0 transition-colors"
                >
                  <FolderSearch size={13} /> {t('rule_builder.btn_search')}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  {t('rule_builder.step_2')}
                </span>
                <button type="button" onClick={() => setActiveHelpModal('FILTERS')} className="text-slate-400 hover:text-blue-500">
                  <HelpCircle size={12} />
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-400">{t('rule_builder.match_condition')}</span>
                <select
                  value={masterLogicOperator}
                  onChange={(e) => handleMasterLogicChange(e.target.value)}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-[#27272a] text-blue-600 dark:text-blue-400 border-0 outline-none cursor-pointer"
                >
                  <option value="AND">{t('rule_builder.match_all')}</option>
                  <option value="OR">{t('rule_builder.match_any')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              {filters.map((f, idx) => {
                const isCategory = f.field_name === 'Tipo de Documento (Categoria)';
                const isDate = f.field_name.includes('Data') || f.field_name === 'Data de Criação' || f.field_name === 'Creation Date' || f.field_name.includes('Modifica') || f.field_name.includes('Modification');

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
                          } else if (e.target.value.includes('Data') || e.target.value.includes('Date')) {
                            nf[idx].operator = 'ESTÁ ENTRE (DATA/HORA)';
                            nf[idx].value = '';
                          } else {
                            nf[idx].value = '';
                          }
                          setFilters(nf);
                        }}
                        className="px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-medium outline-none cursor-pointer"
                      >
                        <option value="Extensão">{t('rule_builder.filter_ext')}</option>
                        <option value="Tipo de Documento (Categoria)">{t('rule_builder.filter_cat')}</option>
                        <option value="Nome do Arquivo">{t('rule_builder.filter_name')}</option>
                        <option value="Data de Criação">{t('rule_builder.filter_cdate')}</option>
                        <option value="Data de Modificação">{t('rule_builder.filter_mdate')}</option>
                        <option value="Tamanho (Bytes)">{t('rule_builder.filter_size')}</option>
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
                          <option value="É IGUAL A">{t('rule_builder.op_equals')}</option>
                        ) : isDate ? (
                          <>
                            <option value="ESTÁ ENTRE (DATA/HORA)">{t('rule_builder.op_between')}</option>
                            <option value="MAIOR QUE">{t('rule_builder.op_greater')}</option>
                            <option value="MENOR QUE">{t('rule_builder.op_less')}</option>
                          </>
                        ) : (
                          <>
                            <option value="CONTÉM">{t('rule_builder.op_contains')}</option>
                            <option value="É IGUAL A">{t('rule_builder.op_equals')}</option>
                            <option value="NÃO É (DIFERENTE DE)">{t('rule_builder.op_not_equals')}</option>
                            <option value="COMEÇA COM">{t('rule_builder.op_starts')}</option>
                            <option value="TERMINA COM">{t('rule_builder.op_ends')}</option>
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
                      ) : isDate ? (
                        f.operator === 'ESTÁ ENTRE (DATA/HORA)' ? (
                          <div className="flex gap-1.5 w-full">
                            <input
                              type="date"
                              title="Data de Início"
                              value={f.value.split(',')[0] || ''}
                              onChange={(e) => {
                                const nf = [...filters];
                                const endData = nf[idx].value.split(',')[1] || '';
                                nf[idx].value = `${e.target.value},${endData}`;
                                setFilters(nf);
                              }}
                              className="w-1/2 px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none dark:[color-scheme:dark]"
                            />
                            <input
                              type="date"
                              title="Data de Fim"
                              value={f.value.split(',')[1] || ''}
                              onChange={(e) => {
                                const nf = [...filters];
                                const startData = nf[idx].value.split(',')[0] || '';
                                nf[idx].value = `${startData},${e.target.value}`;
                                setFilters(nf);
                              }}
                              className="w-1/2 px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none dark:[color-scheme:dark]"
                            />
                          </div>
                        ) : (
                          <input
                            type="date"
                            value={f.value}
                            onChange={(e) => {
                              const nf = [...filters];
                              nf[idx].value = e.target.value;
                              setFilters(nf);
                            }}
                            className="w-full px-2 py-1 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none dark:[color-scheme:dark]"
                          />
                        )
                      ) : (
                        <input 
                          type="text"
                          placeholder={t('rule_builder.type_here')}
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
              <Plus size={14} /> {t('rule_builder.add_requirement')}
            </button>
          </div>

          <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block">
                  {t('rule_builder.step_3')}
                </span>
                <button type="button" onClick={() => setActiveHelpModal('TAGS')} className="text-slate-400 hover:text-emerald-500">
                  <HelpCircle size={12} />
                </button>
              </div>

              <div className="flex gap-1 text-[11px] bg-slate-100 dark:bg-[#18181b] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFolderMode('existente')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${folderMode === 'existente' ? 'bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-400'}`}
                >
                  {t('rule_builder.folder_fixed')}
                </button>
                <button
                  type="button"
                  onClick={() => setFolderMode('criar')}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${folderMode === 'criar' ? 'bg-white dark:bg-[#27272a] text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-slate-400'}`}
                >
                  {t('rule_builder.folder_dynamic')}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <select 
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-emerald-50 dark:bg-[#18181b] border border-emerald-200 dark:border-[#2e2e34] rounded-xl text-emerald-800 dark:text-emerald-400 font-bold outline-none cursor-pointer shrink-0"
              >
                <option value="MOVE">{t('rule_builder.action_move')}</option>
                <option value="COPY">{t('rule_builder.action_copy')}</option>
                <option value="ZIP">{t('rule_builder.action_zip')}</option>
                <option value="RENAME">{t('rule_builder.action_rename')}</option>
                <option value="DELETE">{t('rule_builder.action_delete')}</option>
              </select>

              {folderMode === 'existente' ? (
                <div className="flex-1 flex gap-2 w-full min-w-0">
                  <input 
                    type="text" 
                    placeholder={t('rule_builder.target_dir_ph')}
                    value={targetDir}
                    onChange={(e) => setTargetDir(e.target.value)}
                    className="flex-1 w-full min-w-0 px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono text-[11px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={selectTargetFolder}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#383840] flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    <FolderSearch size={13} /> {t('rule_builder.btn_search')}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-2 w-full min-w-0">
                  <input 
                    type="text" 
                    placeholder="Ex: {ano}/{mes}/{tipo_doc}"
                    value={createPattern}
                    onChange={(e) => setCreatePattern(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white font-mono text-[11px] outline-none focus:border-emerald-400"
                  />
                </div>
              )}
            </div>

            {folderMode === 'criar' && (
              <div className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl space-y-3 animate-in fade-in">
                <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  <strong>{t('rule_builder.magic_subfolders')}</strong> {t('rule_builder.magic_subfolders_desc')}
                </p>
                
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mr-1">{t('rule_builder.click_to_insert')}</span>
                  {dynamicTags.map(tag => (
                    <button
                      key={tag.label}
                      type="button"
                      onClick={() => insertTagToPattern(tag.label)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-[#202024] hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200 dark:border-[#333338] transition-colors flex items-center gap-1 shadow-sm"
                    >
                      {tag.name} <span className="opacity-40 font-mono text-[9px]">{tag.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-2 bg-white dark:bg-[#15151a] border border-slate-200 dark:border-slate-800 p-3 rounded-lg font-mono text-[10px] shadow-inner relative overflow-hidden">
                  <span className="absolute top-1.5 right-2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t('rule_builder.live_preview')}</span>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1.5"><Folder size={12}/> {sourceDir || t('rule_builder.mock_source_dir')}</div>
                  {createPattern.split('/').filter(Boolean).map((part, index) => {
                      let previewPart = part.replace('{ano}', '2026').replace('{mes}', '08').replace('{dia}', '21').replace('{tipo_doc}', t('rule_builder.mock_document')).replace('{extensao}', 'pdf').replace('{filename}', simulatedName);
                      return (
                          <div key={index} className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mt-1" style={{ paddingLeft: `${(index + 1) * 14}px` }}>
                              <CornerDownRight size={10} className="text-slate-300 dark:text-slate-600" /> <Folder size={12}/> {previewPart}
                          </div>
                      )
                  })}
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 mt-1 font-bold" style={{ paddingLeft: `${(createPattern.split('/').filter(Boolean).length + 1) * 14}px` }}>
                      <CornerDownRight size={10} className="text-slate-300 dark:text-slate-600" /> <FileText size={12}/> {simulatedName}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-[#2d2d34] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert size={13} className="text-amber-500" /> {t('rule_builder.conflict_title')}
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
                <option value="AUTONUMBER">{t('rule_builder.conflict_autonumber')}</option>
                <option value="INCREMENTAL">{t('rule_builder.conflict_incremental')}</option>
                <option value="OVERWRITE">{t('rule_builder.conflict_overwrite')}</option>
                <option value="SKIP">{t('rule_builder.conflict_skip')}</option>
              </select>
            </div>
          </div>

          {actionType !== 'DELETE' && (
            <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs space-y-3.5 animate-in fade-in border-l-4 border-l-purple-500 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2d2d34] pb-1">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider block z-10">
                  {t('rule_builder.step_4')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 z-10 relative">
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={cleanAccents} 
                    onChange={(e) => setCleanAccents(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('rule_builder.remove_accents')}</span>
                    <span className="text-[9px] text-slate-400">{t('rule_builder.remove_accents_desc')}</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-800 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={replaceSpaces} 
                    onChange={(e) => setReplaceSpaces(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0 w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('rule_builder.replace_spaces')}</span>
                    <span className="text-[9px] text-slate-400">{t('rule_builder.replace_spaces_desc')}</span>
                  </div>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 z-10 relative">
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Eraser size={12} className="text-purple-500"/> {t('rule_builder.capitalization')}
                  </label>
                  <select 
                    value={caseFormat} 
                    onChange={(e) => setCaseFormat(e.target.value)}
                    className="px-3 py-2 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#383840] rounded-xl font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="NONE">{t('rule_builder.cap_none')}</option>
                    <option value="UPPER">{t('rule_builder.cap_upper')}</option>
                    <option value="LOWER">{t('rule_builder.cap_lower')}</option>
                  </select>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 justify-between">
                    <div className="flex items-center gap-1">
                      <FileSearch size={12} className="text-purple-500"/> {t('rule_builder.data_extraction')}
                    </div>
                    <button type="button" onClick={() => setActiveHelpModal('REGEX')} className="text-slate-400 hover:text-purple-500 shrink-0">
                      <HelpCircle size={11} />
                    </button>
                  </label>
                  <select 
                    value={regexPreset} 
                    onChange={(e) => setRegexPreset(e.target.value as RegexPreset)}
                    className="px-3 py-2 text-xs bg-purple-50 dark:bg-[#18181b] border border-purple-200 dark:border-[#383840] rounded-xl font-bold text-purple-700 dark:text-purple-400 outline-none cursor-pointer"
                  >
                    <option value="NONE">{t('rule_builder.ext_none')}</option>
                    <option value="CLEAN_SCANNER">{t('rule_builder.ext_clean')}</option>
                    <option value="EXTRACT_MATRICULA">{t('rule_builder.ext_matricula')}</option>
                    <option value="EXTRACT_DATE">{t('rule_builder.ext_date')}</option>
                    <option value="NUMBERS_ONLY">{t('rule_builder.ext_numbers')}</option>
                    <option value="EXTRACT_CPF">{t('rule_builder.ext_cpf')}</option>
                    <option value="EXTRACT_CNPJ">{t('rule_builder.ext_cnpj')}</option>
                    <option value="CUSTOM">{t('rule_builder.ext_custom')}</option>
                  </select>
                </div>
              </div>

              {regexPreset === 'CUSTOM' && (
                <div className="mt-3 p-3 bg-slate-100/50 dark:bg-[#141416] rounded-xl border border-slate-200/50 dark:border-[#2e2e34] space-y-3 animate-in fade-in slide-in-from-top-2 z-10 relative">
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed shadow-sm">
                    <p className="font-bold flex items-center gap-1.5 mb-1.5"><Code size={13}/> {t('rule_builder.dev_mode_title')}</p>
                    <p>{t('rule_builder.dev_mode_desc1')}</p>
                    <div className="mt-2 grid gap-1">
                      <span className="flex items-center gap-2">{t('rule_builder.dev_mode_ex1')}</span>
                      <span className="flex items-center gap-2">{t('rule_builder.dev_mode_ex2')}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('rule_builder.find_pattern')}</label>
                      <input 
                        type="text" 
                        placeholder="Ex: \d{14}"
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">{t('rule_builder.replace_by')}</label>
                      <input 
                        type="text" 
                        placeholder="Ex: DOC_$1"
                        value={regexReplacement}
                        onChange={(e) => setRegexReplacement(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#1e1e24] border border-slate-200 dark:border-[#2e2e34] rounded-lg text-slate-800 dark:text-white font-mono outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d34] flex flex-col gap-2 z-10 relative">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('rule_builder.simulator_title')}</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#111113] border border-slate-200 dark:border-transparent p-3 rounded-xl shadow-inner text-xs font-mono w-full overflow-hidden">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 shrink-0">
                    <FileText size={14} />
                    <span className="truncate max-w-[120px] sm:max-w-xs">{t('rule_builder.mock_filename')}</span>
                  </div>
                  <ArrowRight size={14} className="text-purple-500 dark:text-purple-400 shrink-0" />
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold shrink-0 min-w-0">
                    <FileText size={14} />
                    <span className="truncate">{simulatedName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 pb-2">
            <div className="bg-slate-100/70 dark:bg-[#0c0c0e] rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 font-mono text-[11px] text-slate-700 dark:text-slate-300 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-[0.05] dark:opacity-10 pointer-events-none text-slate-400 dark:text-white"><Wand2 size={60}/></div>
              <p className="text-blue-500 font-bold mb-3 uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Eye size={12}/> {t('rule_builder.translator_title')}
              </p>
              
              <div className="space-y-2.5 relative z-10">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-500 font-black mt-0.5">{t('rule_builder.translator_if')}</span>
                  <span className="leading-relaxed">{t('rule_builder.translator_if_desc')} <strong className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">{sourceDir || t('rule_builder.mock_source_dir')}</strong></span>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-500 font-black mt-0.5">{t('rule_builder.translator_and')}</span>
                  <div className="flex flex-col gap-1.5 leading-relaxed">
                    {filters.map((f, i) => (
                      <span key={i}>
                        {i > 0 && <span className="text-blue-600 dark:text-blue-500 font-bold mr-1.5">{masterLogicOperator === 'AND' ? t('rule_builder.translator_and_also') : t('rule_builder.translator_or_else')}</span>}
                        {translateField(f.field_name)} {translateOp(f.operator).toLowerCase()} <strong className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">{f.value || '...'}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <span className="text-emerald-600 dark:text-emerald-500 font-black mt-0.5">{t('rule_builder.translator_then')}</span>
                  <span className="leading-relaxed">
                    {t('rule_builder.translator_then_desc')} <strong className="text-emerald-700 dark:text-emerald-400 font-black uppercase">{actionType === 'MOVE' ? t('rule_builder.translator_action_move') : actionType === 'COPY' ? t('rule_builder.translator_action_copy') : actionType === 'ZIP' ? t('rule_builder.translator_action_zip') : actionType === 'DELETE' ? t('rule_builder.translator_action_delete') : t('rule_builder.translator_action_rename')}</strong> {t('rule_builder.translator_the_file')}
                    {actionType !== 'DELETE' && <span> {t('rule_builder.translator_to')} <strong className="text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-transparent">{folderMode === 'criar' ? `${sourceDir || 'C:/...'}/${createPattern}` : targetDir || 'C:/Destino'}</strong></span>}
                  </span>
                </div>

                {actionType !== 'DELETE' && (regexPreset !== 'NONE' || cleanAccents || replaceSpaces || caseFormat !== 'NONE') && (
                  <div className="flex items-start gap-2 mt-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/50">
                    <span className="text-purple-600 dark:text-purple-500 font-black mt-0.5">{t('rule_builder.translator_name')}</span>
                    <span className="leading-relaxed">
                      {t('rule_builder.translator_name_desc')} <span className="line-through opacity-50 mr-1.5 ml-0.5">{t('rule_builder.mock_original_file')}</span> <ArrowRight size={10} className="inline text-purple-500 dark:text-purple-400 mx-1"/> <strong className="text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded border border-purple-200 dark:border-transparent">{simulatedName}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        <div className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-xs flex items-center justify-between shrink-0">
          <button 
            type="button"
            onClick={resetForm}
            className="px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={13} />
            <span>{t('rule_builder.clear_filters')}</span>
          </button>

          <button 
            onClick={handleSave}
            disabled={!sourceDir.trim() || !ruleName.trim() || (!targetDir.trim() && folderMode === 'existente')}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: (!sourceDir.trim() || !ruleName.trim()) ? '#94a3b8' : accentColor }}
          >
            <Save size={14} /> 
            <span>{t('rule_builder.save_rule')}</span>
          </button>
        </div>
      </div>

      {!rulesPanelCollapsed && (
        <div
          onMouseDown={startResizing}
          className="w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600 transition-colors mx-0.5 rounded-full shrink-0 hidden md:block"
        />
      )}

      {!rulesPanelCollapsed && (
        <div 
          style={{ width: `${100 - leftWidthPercent}%` }}
          className="bg-white dark:bg-[#1e1e24] p-4 rounded-2xl border border-slate-200 dark:border-[#2e2e34] flex flex-col space-y-3 shadow-sm min-w-[280px] shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListOrdered size={15} style={{ color: accentColor }} />
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{t('rule_builder.active_rules')}</h2>
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
                placeholder={t('rule_builder.search_rules')}
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
                  <option value="ALL">{t('rule_builder.all')} ({rules.length})</option>
                  <option value="MOVE">{t('rule_builder.action_move')}</option>
                  <option value="COPY">{t('rule_builder.action_copy')}</option>
                  <option value="ZIP">{t('rule_builder.action_zip')}</option>
                  <option value="RENAME">{t('rule_builder.action_rename')}</option>
                  <option value="DELETE">{t('rule_builder.action_delete')}</option>
                </select>
              </div>

              <div className="h-3 w-[1px] bg-slate-200 dark:bg-[#333338]" />

              <div className="flex items-center gap-1">
                <span>{t('rule_builder.order')}</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="bg-transparent text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer text-[10px]"
                >
                  <option value="id">ID</option>
                  <option value="name">{t('rule_builder.translator_name')}</option>
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
            {isLoading ? (
              <div className="h-40 flex flex-col items-center justify-center text-xs text-slate-400 gap-2 opacity-60">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
                <p>{t('rule_builder.loading_rules')}</p>
              </div>
            ) : filteredAndSortedRules.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-slate-400 text-center">
                {t('rule_builder.no_rules')}
              </div>
            ) : viewMode === 'blocks' ? (
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
                          setCleanAccents(r.actions[0].clean_accents || false);
                          setReplaceSpaces(r.actions[0].replace_spaces || false);
                          setCaseFormat(r.actions[0].case_format || 'NONE');
                          setRegexPattern(r.actions[0].regex_pattern || '');
                          setRegexReplacement(r.actions[0].regex_replacement || '');
                          
                          if (r.actions[0].regex_pattern === '[^0-9]') {
                            setRegexPreset('NUMBERS_ONLY');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{11}).*') {
                            setRegexPreset('EXTRACT_CPF');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{14}).*') {
                            setRegexPreset('EXTRACT_CNPJ');
                          } else if (r.actions[0].regex_pattern === '(?i)^(?:SCAN|DOC|IMG)[_\\-]?(.*)') {
                            setRegexPreset('CLEAN_SCANNER');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{2,4}[-/]\\d{2}[-/]\\d{2,4}).*') {
                            setRegexPreset('EXTRACT_DATE');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{5,7}).*') {
                            setRegexPreset('EXTRACT_MATRICULA');
                          } else if (r.actions[0].regex_pattern) {
                            setRegexPreset('CUSTOM');
                          } else {
                            setRegexPreset('NONE');
                          }
                        }
                      }} className="p-1 text-slate-400 hover:text-blue-500"><Edit3 size={13} /></button>
                      <button onClick={() => { if(confirm(t('rule_builder.delete_confirm'))) invoke('delete_rule', { ruleId: r.id }).then(loadRules); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                    <Folder size={13} className="text-amber-500 shrink-0" />
                    <span className="truncate" title={r.source_directory}>{r.source_directory}</span>
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200 dark:border-[#2d2d34]">
                    <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200/70 dark:bg-[#25252b] px-2 py-0.5 rounded shrink-0">
                      {r.actions[0]?.action_type === 'MOVE' ? t('rule_builder.action_move') : r.actions[0]?.action_type === 'COPY' ? t('rule_builder.action_copy') : r.actions[0]?.action_type === 'ZIP' ? t('rule_builder.action_zip') : r.actions[0]?.action_type === 'DELETE' ? t('rule_builder.action_delete') : t('rule_builder.action_rename')}
                    </div>

                    <button
                      onClick={() => handleToggleAutoPilot(r)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                        isCorePlan 
                          ? 'bg-slate-200/40 dark:bg-[#202024] text-slate-400 cursor-not-allowed border border-slate-200 dark:border-[#2e2e34]' 
                          : r.is_sentinel_active
                            ? 'bg-green-50 dark:bg-green-950/60 text-green-600 border border-green-300 dark:border-green-800'
                            : 'bg-slate-200/70 dark:bg-[#27272a] text-slate-500 hover:text-slate-700 dark:hover:text-white border border-slate-300 dark:border-[#383840]'
                      }`}
                      title={isCorePlan ? "Disponível apenas no plano Foldex Pro" : r.is_sentinel_active ? "Execução Automática ativa em background" : "Ligar Execução Automática"}
                    >
                      {isCorePlan ? <Lock size={12} className="opacity-70" /> : <Bot size={12} className={r.is_sentinel_active ? "text-green-600" : ""} />}
                      <span>{r.is_sentinel_active ? t('rule_builder.btn_auto') : t('rule_builder.btn_manual')}</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
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
                        {r.actions[0]?.action_type === 'MOVE' ? t('rule_builder.action_move') : r.actions[0]?.action_type === 'COPY' ? t('rule_builder.action_copy') : r.actions[0]?.action_type === 'ZIP' ? t('rule_builder.action_zip') : r.actions[0]?.action_type === 'DELETE' ? t('rule_builder.action_delete') : t('rule_builder.action_rename')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleAutoPilot(r)}
                        className={`p-1 rounded-md transition-colors ${
                          isCorePlan 
                            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                            : r.is_sentinel_active ? 'text-green-500 hover:text-green-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                        }`}
                        title={isCorePlan ? "Disponível apenas no plano Foldex Pro" : r.is_sentinel_active ? "Execução Automática Ligada" : "Ligar Execução Automática"}
                      >
                        {isCorePlan ? <Lock size={13} /> : <Bot size={13} />}
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
                          setCleanAccents(r.actions[0].clean_accents || false);
                          setReplaceSpaces(r.actions[0].replace_spaces || false);
                          setCaseFormat(r.actions[0].case_format || 'NONE');
                          setRegexPattern(r.actions[0].regex_pattern || '');
                          setRegexReplacement(r.actions[0].regex_replacement || '');
                          
                          if (r.actions[0].regex_pattern === '[^0-9]') {
                            setRegexPreset('NUMBERS_ONLY');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{11}).*') {
                            setRegexPreset('EXTRACT_CPF');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{14}).*') {
                            setRegexPreset('EXTRACT_CNPJ');
                          } else if (r.actions[0].regex_pattern === '(?i)^(?:SCAN|DOC|IMG)[_\\-]?(.*)') {
                            setRegexPreset('CLEAN_SCANNER');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{2,4}[-/]\\d{2}[-/]\\d{2,4}).*') {
                            setRegexPreset('EXTRACT_DATE');
                          } else if (r.actions[0].regex_pattern === '.*?(\\d{5,7}).*') {
                            setRegexPreset('EXTRACT_MATRICULA');
                          } else if (r.actions[0].regex_pattern) {
                            setRegexPreset('CUSTOM');
                          } else {
                            setRegexPreset('NONE');
                          }
                        }
                      }} className="p-1 text-slate-400 hover:text-blue-500" title="Editar"><Edit3 size={13} /></button>
                      <button onClick={() => { if(confirm(t('rule_builder.delete_confirm'))) invoke('delete_rule', { ruleId: r.id }).then(loadRules); }} className="p-1 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚡ MODAL: ORGANIZADOR INTELIGENTE DE PASTAS */}
      {showSmartModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-[#333338] shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#333338] pb-4">
              <div className="flex items-center gap-2.5 text-indigo-500">
                <Layers size={22} />
                <h3 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-white">{t('rule_builder.smart_organize')}</h3>
              </div>
              <button onClick={() => setShowSmartModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-[#18181b] rounded-2xl p-4 border border-slate-200 dark:border-[#2e2e34]">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 text-center">Como funciona a mágica?</p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-[#202023] border border-slate-200 dark:border-[#333338] rounded-xl shadow-sm w-32">
                  <div className="flex -space-x-2">
                    <FileText size={20} className="text-blue-500 bg-white dark:bg-[#202023]" />
                    <ImageIcon size={20} className="text-emerald-500 bg-white dark:bg-[#202023]" />
                    <FileSpreadsheet size={20} className="text-green-600 bg-white dark:bg-[#202023]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 text-center">Arquivos Misturados</span>
                </div>
                
                <ArrowRight size={24} className="text-indigo-400 animate-pulse" />

                <div className="flex flex-col items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-xl shadow-sm w-32">
                  <div className="flex gap-1">
                    <Folder size={20} className="text-indigo-500" />
                    <Folder size={20} className="text-indigo-500" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 text-center">Pastas Categorizadas</span>
                </div>
              </div>
              <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed">
                Fique tranquilo: nenhum arquivo é deletado. Tudo o que for organizado pode ser desfeito a qualquer momento na aba de Auditoria.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pasta Alvo (Ex: Downloads)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  placeholder="Selecione a pasta bagunçada..." 
                  value={smartSourceDir} 
                  className="flex-1 px-3 py-2.5 text-xs bg-slate-50 border rounded-xl outline-none dark:bg-[#18181b] border-slate-200 dark:border-[#2e2e34] font-mono text-slate-800 dark:text-slate-200" 
                />
                <button 
                  onClick={selectSmartFolder} 
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#27272a] text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-[#383840] hover:bg-slate-200 transition-colors"
                >
                  <FolderSearch size={14} /> Localizar
                </button>
              </div>
            </div>

            <button 
              onClick={runSmartOrganize} 
              disabled={isSmartRunning || !smartSourceDir} 
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSmartRunning ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />} 
              {isSmartRunning ? 'Organizando seus arquivos...' : t('rule_builder.btn_execute')}
            </button>
          </div>
        </div>
      )}

      {/* ⚡ MODAL DINÂMICO DE UPSELL */}
      {upsellFeature && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-sm rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-2.5 text-blue-500">
              {upsellFeature === 'AUTOPILOT' ? <Bot size={24} /> : <Layers size={24} />}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                  {upsellFeature === 'AUTOPILOT' ? 'Execução em 2º Plano' : 'Organização Inteligente'}
                </h3>
                <p className="text-[10px] text-blue-500/80 font-bold uppercase">Recurso Foldex Pro</p>
              </div>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
              {upsellFeature === 'AUTOPILOT' 
                ? "A automação silenciosa (Sentinel) permite que o Foldex monitore e mova seus arquivos automaticamente, sem que você precise clicar em nada."
                : "O Smart Organize varre pastas caóticas e categoriza todos os documentos, planilhas e mídias em subpastas organizadas com apenas 1 clique."
              }
              <br /><br />
              Faça o upgrade da sua licença para liberar este e outros recursos de produtividade corporativa.
            </p>

            <div className="flex flex-col gap-2 pt-4">
              <button 
                onClick={() => {
                  setUpsellFeature(null);
                  if (onNavigateToAccount) onNavigateToAccount();
                }} 
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold transition-transform active:scale-95 shadow-sm"
              >
                Ativar Licença Corporativa
              </button>
              <button 
                onClick={() => setUpsellFeature(null)} 
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-[#333338] transition-colors"
              >
                Talvez mais tarde
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Ajuda */}
      {activeHelpModal === 'REGEX' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2">
                <Code size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('rule_builder.help_regex_title')}</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>{t('rule_builder.help_regex_desc1')}</p>
              
              <div className="bg-slate-50 dark:bg-[#18181b] p-3 rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-2">
                <p className="font-bold text-[10px] uppercase text-slate-500">{t('rule_builder.help_regex_ex_title')}</p>
                <p><strong>{t('rule_builder.help_regex_ex_orig')}</strong> <code className="bg-white dark:bg-[#202024] px-1 rounded">SCAN_doc_12345678901234_final.pdf</code></p>
                <p><strong>{t('rule_builder.help_regex_ex_res')}</strong> <code className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 px-1 rounded font-bold">CNPJ_12345678901234.pdf</code></p>
              </div>
              <p className="text-[10px]">{t('rule_builder.help_regex_desc2')}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">{t('rule_builder.btn_understood')}</button>
            </div>
          </div>
        </div>
      )}

      {activeHelpModal === 'TAGS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#202023] w-full max-w-md rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2b2b30] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('rule_builder.help_tags_title')}</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              <p>• <strong>&#123;ano&#125;</strong>: {t('rule_builder.help_tags_desc1')}</p>
              <p>• <strong>&#123;mes&#125;</strong>: {t('rule_builder.help_tags_desc2')}</p>
              <p>• <strong>&#123;tipo_doc&#125;</strong>: {t('rule_builder.help_tags_desc3')}</p>
              <p>• <strong>&#123;extensao&#125;</strong>: {t('rule_builder.help_tags_desc4')}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">{t('rule_builder.btn_close')}</button>
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
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('rule_builder.help_filters_title')}</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>{t('rule_builder.match_all')}:</strong> {t('rule_builder.help_filters_desc1')}</p>
              <p>• <strong>{t('rule_builder.match_any')}:</strong> {t('rule_builder.help_filters_desc2')}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">{t('rule_builder.btn_close')}</button>
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
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('rule_builder.help_duplicates_title')}</h3>
              </div>
              <button onClick={() => setActiveHelpModal(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>• <strong>{t('rule_builder.conflict_autonumber').split('—')[0]}:</strong> {t('rule_builder.help_duplicates_desc1')}</p>
              <p>• <strong>{t('rule_builder.conflict_incremental').split('(')[0]}:</strong> {t('rule_builder.help_duplicates_desc2')}</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={() => setActiveHelpModal(null)} className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold">{t('rule_builder.btn_close')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default RuleBuilder;