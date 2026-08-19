import React, { useState } from 'react';
import { 
  Sparkles, 
  FolderPlus, 
  FolderSearch, 
  FlaskConical, 
  History, 
  Zap, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface OnboardingTourProps {
  accentColor: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

interface TourStep {
  title: string;
  subtitle: string;
  description: string;
  tabTarget: string;
  icon: React.ElementType;
  highlights: string[];
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  accentColor,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TourStep[] = [
    {
      title: 'Bem-vindo ao Binaver Foldex Enterprise!',
      subtitle: 'Governança, automação e triagem de arquivos de alto desempenho',
      description:
        'O Foldex elimina o retrabalho manual de organizar pastas, planilhas e documentos. Em conformidade estrita com a LGPD, todo o processamento ocorre 100% no seu computador, com segurança forense auditável.',
      tabTarget: 'builder',
      icon: Sparkles,
      highlights: [
        'Sem upload de arquivos para a nuvem (Zero-Knowledge)',
        'Trilha de auditoria criptografada com SHA-256',
        'Compatível com qualquer pasta local ou de rede',
      ],
    },
    {
      title: '1. Construtor de Regras Inteligentes',
      subtitle: 'Como criar e personalizar suas rotinas de triagem',
      description:
        'Crie regras personalizadas combinando critérios como extensões (.pdf, .xlsx), datas de emissão ou nomes de arquivos. Defina se os arquivos devem ser movidos, copiados, renomeados ou compactados em lote.',
      tabTarget: 'builder',
      icon: FolderPlus,
      highlights: [
        'Organização por pastas dinâmicas (ex: {ano}/{mes}/{tipo_doc})',
        'Filtros múltiplos combinados com lógica E (AND) ou OU (OR)',
        'Tratamento automático contra sobrescrita de duplicados',
      ],
    },
    {
      title: '2. Piloto Automático em Tempo Real',
      subtitle: 'Automação contínua sem necessidade de intervenção humana',
      description:
        'Ao ligar o botão "Piloto Automático" em qualquer regra, o Foldex monitora a pasta de origem silenciosamente em segundo plano. Assim que um novo arquivo é baixado ou salvo, ele é classificado no mesmo instante.',
      tabTarget: 'builder',
      icon: Zap,
      highlights: [
        'Monitoramento nativo por eventos do Windows (baixo consumo de CPU)',
        'Delay de segurança configurável para downloads do navegador',
        'Avisos e notificações discretas no canto da tela',
      ],
    },
    {
      title: '3. Explorador de Arquivos & Compressão .ZIP',
      subtitle: 'Gestão rápida de diretórios e favoritos',
      description:
        'Navegue pelos seus discos e pastas com velocidade instantânea. Use o menu com o botão direito para compactar múltiplos itens pesados em .ZIP e definir pastas de origem com apenas um clique.',
      tabTarget: 'explorer',
      icon: FolderSearch,
      highlights: [
        'Acesso rápido a Downloads, Documentos e Área de Trabalho',
        'Compressão nativa de alta velocidade em background',
        'Fixação de pastas favoritas no painel lateral',
      ],
    },
    {
      title: '4. Simulação Segura (Dry-Run) & Execução',
      subtitle: 'Veja o resultado antes de movimentar qualquer arquivo real',
      description:
        'Antes de aplicar uma nova regra em pastas com milhares de documentos, use a tela de Simulação para conferir exatamente para onde cada arquivo irá, garantindo total previsibilidade e zero erros operacionais.',
      tabTarget: 'dryrun',
      icon: FlaskConical,
      highlights: [
        'Pré-visualização detalhada de De -> Para em memória',
        'Contagem exata de arquivos que atendem aos filtros',
        'Execução com gravação de lote de auditoria',
      ],
    },
    {
      title: '5. Auditoria Forense & Desfazer (Rollback)',
      subtitle: 'Tranquilidade total: restaure qualquer operação em 1 clique',
      description:
        'Todas as ações são registradas com data, operador do Windows e hash SHA-256. Se você organizar algo por engano, basta clicar em "Reverter Lote" para devolver cada arquivo ao seu local de origem imediatamente.',
      tabTarget: 'history',
      icon: History,
      highlights: [
        'Restauração atômica sem perda de dados',
        'Exportação de relatórios de conformidade em planilha .CSV',
        'Verificador de integridade de cadeia de custódia',
      ],
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      onNavigateTab(steps[nextIdx].tabTarget);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      onNavigateTab(steps[prevIdx].tabTarget);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_tour_completed', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1e1e24] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-[#33333a] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho do Card */}
        <div className="p-5 border-b border-slate-100 dark:border-[#2b2b30] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <StepIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Guia Prático • Passo {currentStep + 1} de {steps.length}
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors"
            title="Pular Tour"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo Central */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {step.subtitle}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {step.description}
            </p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#2b2b30] space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Destaques do Recurso:
            </span>
            <div className="space-y-1.5">
              {step.highlights.map((h, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores de Etapa (Bolinhas) */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  onNavigateTab(steps[idx].tabTarget);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-blue-600' 
                    : 'w-1.5 bg-slate-200 dark:bg-[#333338] hover:bg-slate-300'
                }`}
                style={idx === currentStep ? { backgroundColor: accentColor } : {}}
              />
            ))}
          </div>
        </div>

        {/* Rodapé de Navegação */}
        <div className="p-4 bg-slate-50 dark:bg-[#18181b] border-t border-slate-100 dark:border-[#2b2b30] flex items-center justify-between">
          <button
            onClick={handleFinish}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold underline"
          >
            Pular Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-white dark:bg-[#27272a] hover:bg-slate-100 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#383840] flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: accentColor }}
            >
              <span>{isLast ? 'Concluir e Começar' : 'Próximo'}</span>
              {isLast ? <ShieldCheck size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};