import React, { useState } from 'react';
import { 
  Headphones, 
  Mail, 
  MessageSquare, 
  Globe, 
  FileQuestion, 
  ExternalLink,
  ShieldCheck,
  Sparkles,
  BookOpen,
  FolderPlus,
  Zap,
  FlaskConical,
  History,
  FolderArchive,
  ChevronRight,
  Search
} from 'lucide-react';

interface SupportViewProps {
  accentColor: string;
  onOpenTour?: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ accentColor, onOpenTour }) => {
  const [activeManualTopic, setActiveManualTopic] = useState<string>('intro');
  const [manualSearch, setManualSearch] = useState('');

  const manualTopics = [
    {
      id: 'intro',
      title: 'Visão Geral e Segurança',
      icon: BookOpen,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            O que é o Binaver Foldex Enterprise?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            O <strong>Binaver Foldex</strong> atua como um assistente digital automático: ele monitora os arquivos que chegam nas suas pastas, confere as regras cadastradas e organiza tudo no destino correto sem intervenção manual.
          </p>
          <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
            <span className="text-[11px] font-bold text-blue-900 dark:text-blue-200 block">
              🛡️ Privacidade e LGPD (Zero-Knowledge):
            </span>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Nenhum arquivo ou dado corporativo é enviado para a nuvem.</li>
              <li>• Toda a triagem, renomeação e compressão é executada 100% no hardware do seu computador.</li>
              <li>• Trilha de auditoria forense criptografada com assinatura SHA-256 em cada ação.</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'rules',
      title: 'Como Criar Regras',
      icon: FolderPlus,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Passo a Passo: Criando sua Primeira Regra
          </h4>
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 list-decimal pl-4">
            <li><strong>Nome:</strong> Dê um nome objetivo (ex: <em>Organizar Notas Fiscais e Boletos</em>).</li>
            <li><strong>Pasta de Origem:</strong> Selecione de onde os arquivos vão sair (ex: <code>C:\Users\Downloads</code>).</li>
            <li><strong>Filtros:</strong> Escolha critérios como Extensão, Categoria, Nome ou Data (ex: <code>Extensão É IGUAL A pdf</code>).</li>
            <li><strong>Ação:</strong> Escolha <code>MOVER</code>, <code>COPIAR</code> ou <code>COMPACTAR (.ZIP)</code>.</li>
            <li><strong>Destino Dinâmico:</strong> Em <em>Criar Nova Pasta</em>, use etiquetas automáticas como <code>{'{ano}'}/{'{mes}'}/{'{tipo_doc}'}</code>.</li>
            <li><strong>Salvar:</strong> A regra é gravada com segurança no banco SQLite local.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'autopilot',
      title: 'Execução Automática',
      icon: Zap,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Automação Contínua em Segundo Plano
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            A <strong>Execução Automática</strong> monitora suas pastas silenciosamente. Ao salvar ou baixar um arquivo, ele organiza o documento sem precisar abrir a tela do aplicativo.
          </p>
          <div className="p-3.5 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white block">Como Ativar:</span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              No painel lateral de <strong>Regras Cadastradas</strong>, clique no botão <code>Execução Automática: Desligado</code>. Ele mudará para verde (<code>Execução Automática: Ligado</code>).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'simulation',
      title: 'Simulação Segura (Dry-Run)',
      icon: FlaskConical,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Testando Antes de Movimentar
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Use a tela de <strong>Simulação e Execução</strong> para testar uma ou mais regras selecionadas antes de movimentar arquivos reais.
          </p>
        </div>
      ),
    },
    {
      id: 'rollback',
      title: 'Auditoria e Rollback',
      icon: History,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Tranquilidade Total: Desfazendo Operações
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Se uma regra mover arquivos indesejados, basta acessar <strong>Auditoria e Rollback</strong> e clicar em <strong>"Desfazer Último Lote (Rollback)"</strong> para restaurar todos os arquivos aos locais de origem.
          </p>
        </div>
      ),
    },
    {
      id: 'zip',
      title: 'Compactação em .ZIP',
      icon: FolderArchive,
      content: (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Compressão Nativa de Alto Desempenho
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            No <strong>Explorador de Pastas</strong>, selecione múltiplos itens, clique com o botão direito e selecione <strong>"Compactar para .ZIP"</strong>.
          </p>
        </div>
      ),
    },
  ];

  const filteredTopics = manualTopics.filter(t => 
    t.title.toLowerCase().includes(manualSearch.toLowerCase()) || 
    t.id.toLowerCase().includes(manualSearch.toLowerCase())
  );

  const selectedTopic = manualTopics.find(t => t.id === activeManualTopic) || manualTopics[0];

  return (
    <div className="flex flex-col h-full gap-4 overflow-y-auto pr-1 select-none w-full">
      
      {/* Cabeçalho */}
      <div className="p-4 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Headphones size={18} style={{ color: accentColor }} />
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Central de Atendimento e Manual do Usuário
            </h2>
            <p className="text-[11px] text-slate-400">Documentação técnica oficial, suporte corporativo e manuais práticos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <Sparkles size={14} />
              <span>Tour Interativo</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-green-50 dark:bg-green-950/40 text-green-600 border border-green-200 dark:border-green-800">
            <ShieldCheck size={14} />
            <span>Suporte Enterprise Ativo</span>
          </div>
        </div>
      </div>

      {/* Manual Interativo do Usuário */}
      <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-[#2e2e34] pb-3 gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: accentColor }} />
            <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Manual Interativo do Usuário (Guia Passo a Passo)
            </h3>
          </div>

          <div className="relative w-60">
            <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar no manual..."
              value={manualSearch}
              onChange={(e) => setManualSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#2e2e34] rounded-xl text-slate-800 dark:text-white outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-1 pr-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-[#2e2e34] pb-2 md:pb-0">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isActive = activeManualTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveManualTopic(topic.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 font-bold border border-blue-200 dark:border-blue-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#27272a]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="truncate">{topic.title}</span>
                  </div>
                  <ChevronRight size={13} className={isActive ? 'text-blue-600' : 'text-slate-300'} />
                </button>
              );
            })}
          </div>

          <div className="md:col-span-8 p-4 bg-slate-50/70 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2e2e34] overflow-y-auto max-h-80">
            {selectedTopic.content}
          </div>
        </div>
      </div>

      {/* Cartões de Canais de Suporte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* E-mail Corporativo */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <Mail size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">E-mail Corporativo</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">Para dúvidas técnicas, homologações e suporte a faturamento:</p>
            <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">contato@binaver.com</p>
          </div>

          <button
            onClick={() => window.open('mailto:contato@binaver.com', '_blank')}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383840] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Enviar Mensagem</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* WhatsApp Corporativo */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 flex items-center justify-center">
              <MessageSquare size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">WhatsApp Corporativo</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">Atendimento em tempo real para clientes e parceiros:</p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Segunda a Sexta (08h às 18h)</p>
          </div>

          <button
            onClick={() => window.open('https://binaver.com', '_blank')}
            className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#27272a] hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383840] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Falar com Consultor</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Portal Oficial */}
        <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">Portal da Binaver</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">Gestão de licenças, manuais e novas versões:</p>
            <p className="text-xs font-mono font-bold text-blue-500">https://binaver.com</p>
          </div>

          <button
            onClick={() => window.open('https://binaver.com', '_blank')}
            className="w-full py-2 rounded-xl text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all"
            style={{ backgroundColor: accentColor }}
          >
            <span>Acessar Portal</span>
            <ExternalLink size={12} />
          </button>
        </div>

      </div>

      {/* FAQ */}
      <div className="p-5 bg-white dark:bg-[#1e1e24] rounded-2xl border border-slate-200 dark:border-[#2e2e34] shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#2e2e34] pb-3">
          <FileQuestion size={16} style={{ color: accentColor }} />
          <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Dúvidas Frequentes sobre o Foldex Enterprise
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-white">O que acontece se uma regra mover um arquivo por engano?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              O Foldex possui trilha de auditoria forense integrada. Basta acessar a aba <strong>Auditoria e Rollback</strong> e clicar em <strong>"Desfazer Lote"</strong> para restaurar todos os arquivos aos locais de origem com 1 clique.
            </p>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34] space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-white">Meus arquivos são enviados para servidores externos?</h4>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Não. O Foldex opera sob o princípio de <em>Zero-Knowledge</em> em conformidade estrita com a <strong>LGPD</strong>. 100% da leitura, renomeação e compressão é executada localmente no hardware da máquina.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé Institucional */}
      <div className="p-4 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2e2e34] text-center text-xs text-slate-400">
        Desenvolvido por <strong>BINAVER Soluções Tecnológicas - Ltda</strong> • Primavera do Leste / Brasil
      </div>

    </div>
  );
};