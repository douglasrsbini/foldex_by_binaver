import React, { useState, useEffect } from 'react';
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
  Layers,
  ArrowRight,
  FileText,
  FolderDown,
  ShieldCheck,
  MousePointer2
} from 'lucide-react';

/**
 * 👻 GHOST CURSOR — waypoints (percentuais dentro do painel de simulação)
 * percorridos automaticamente para simular uma ação real sendo demonstrada.
 */
const GHOST_CURSOR_WAYPOINTS: Record<number, { x: number; y: number }[]> = {
  0: [{ x: 20, y: 30 }, { x: 60, y: 55 }, { x: 85, y: 40 }],
  1: [{ x: 25, y: 45 }, { x: 55, y: 50 }, { x: 80, y: 35 }],
  2: [{ x: 20, y: 35 }, { x: 45, y: 60 }, { x: 75, y: 45 }],
  3: [{ x: 30, y: 50 }, { x: 50, y: 40 }, { x: 75, y: 55 }],
  4: [{ x: 25, y: 55 }, { x: 60, y: 45 }, { x: 85, y: 30 }],
  5: [{ x: 20, y: 40 }, { x: 55, y: 55 }, { x: 80, y: 40 }],
  6: [{ x: 25, y: 50 }, { x: 65, y: 40 }, { x: 75, y: 55 }],
};

/**
 * 👻 Cursor de mouse simulado que percorre a tela de demonstração,
 * dando a sensação de uma ação sendo realizada automaticamente.
 */
const GhostCursor: React.FC<{ step: number; simState: number }> = ({ step, simState }) => {
  const waypoints = GHOST_CURSOR_WAYPOINTS[step] ?? GHOST_CURSOR_WAYPOINTS[0];
  const point = waypoints[simState % waypoints.length] ?? { x: 50, y: 50 };

  return (
    <div
      className="pointer-events-none absolute z-20 transition-all duration-[1400ms] ease-in-out"
      style={{ left: `${point.x}%`, top: `${point.y}%`, transform: 'translate(-10%, -10%)' }}
    >
      <MousePointer2
        size={22}
        className="text-white drop-shadow-[0_0_6px_rgba(59,130,246,0.9)] animate-pulse-subtle"
        fill="currentColor"
      />
      <span className="absolute left-4 top-4 h-2.5 w-2.5 rounded-full bg-blue-400/70 animate-ping" />
    </div>
  );
};
import { useTranslation } from 'react-i18next';

interface OnboardingTourProps {
  accentColor: string;
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

interface TourStepCore {
  tabTarget: string;
  icon: React.ElementType;
}

const TOUR_STEPS: TourStepCore[] = [
  { tabTarget: 'builder', icon: Sparkles },
  { tabTarget: 'builder', icon: FolderPlus },
  { tabTarget: 'builder', icon: Layers },
  { tabTarget: 'dryrun', icon: FlaskConical },
  { tabTarget: 'history', icon: History },
  { tabTarget: 'settings', icon: ShieldCheck },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  accentColor,
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  // ⚡ Estado para simular as animações de clique e movimentação de arquivos em cada passo
  const [simState, setSimState] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setSimState(0);
      onNavigateTab(TOUR_STEPS[0].tabTarget);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Loop de animação interna para dar vida às simulações do tour (troca a cada 2.5 segundos)
    const timer = setInterval(() => setSimState((prev) => (prev + 1) % 3), 3000);
    return () => clearInterval(timer);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const currentStepCore = TOUR_STEPS[currentStep];
  const StepIcon = currentStepCore.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      setSimState(0);
      onNavigateTab(TOUR_STEPS[nextIdx].tabTarget);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      setSimState(0);
      onNavigateTab(TOUR_STEPS[prevIdx].tabTarget);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('onboarding_tour_completed', 'true');
    onClose();
  };

  // ⚡ RENDERIZADOR DAS SIMULAÇÕES ANIMADAS POR PASSO
  const renderSimulatedScreen = () => {
    switch (currentStep) {
      case 0: // Visão Geral & Zero-Knowledge
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span className="flex items-center gap-1.5 text-blue-400"><ShieldCheck size={13} /> Zero-Knowledge Protocol</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">100% Local</span>
            </div>
            <div className="space-y-1.5 my-auto">
              <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg">
                <span className="text-slate-300">C:/Downloads/nota_fiscal.pdf</span>
                <span className="text-blue-400">Processando na Máquina...</span>
              </div>
              <div className="flex items-center justify-between bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">Criptografia SHA-256</span>
                <span className="text-emerald-400 font-bold">Seguro ✓</span>
              </div>
            </div>
          </div>
        );

      case 1: // Nome e origem
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>1. Nome e origem</span>
              <span className="text-blue-400">Passo 1 de 6</span>
            </div>
            <div className="flex items-center justify-center gap-3 my-auto">
              <div className={`p-2 rounded-xl bg-blue-500/20 text-blue-300 transition-all duration-500 ${simState === 1 ? 'scale-110 translate-x-2' : ''}`}>
                <FolderDown size={20} />
                <span className="text-[9px] block">Origem</span>
              </div>
              <ArrowRight size={16} className="text-slate-500 animate-pulse" />
              <div className="flex flex-col gap-1">
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Nome da regra</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Pasta de origem</span>
              </div>
            </div>
          </div>
        );

      case 2: // Condições e ações
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>Condições e ações</span>
              <span className="text-amber-400">AND / OR</span>
            </div>
            <div className="space-y-1.5 my-auto">
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg">
                <span className="text-blue-400 font-bold">SE:</span>
                <span className="text-slate-300">Extensão É IGUAL A</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-1.5 rounded">.pdf</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-lg">
                <span className="text-purple-400 font-bold">ENTÃO:</span>
                <span className="text-slate-300">Mover para</span>
                <span className="text-blue-300 bg-blue-500/10 px-1.5 rounded">/Contratos/{'{ano}'}</span>
              </div>
            </div>
          </div>
        );

      case 3: // Simulação
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>Simulação antes da execução</span>
              <span className="flex items-center gap-1 text-blue-400 font-bold">Dry-Run</span>
            </div>
            <div className="my-auto flex items-center justify-around text-center">
              <div className="bg-white/5 p-2 rounded-xl">
                <FileText size={18} className="text-blue-400 mx-auto mb-1" />
                <span className="text-[9px] text-slate-300">Regra</span>
              </div>
              <div className="text-blue-400 font-bold text-lg animate-bounce">➔</div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-xl">
                <CheckCircle2 size={18} className="text-emerald-400 mx-auto mb-1" />
                <span className="text-[9px] text-emerald-300">Prévia</span>
              </div>
            </div>
          </div>
        );

      case 4: // Auditoria
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>Auditoria e rollback</span>
              <span className="text-emerald-400">Rastreável</span>
            </div>
            <div className="my-auto flex items-center justify-between bg-white/5 p-2 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">LOG</div>
                <div>
                  <p className="text-white text-xs font-bold">Lote de operações</p>
                  <p className="text-[9px] text-slate-400">Registro local • SHA-256</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold">Auditado ✓</span>
            </div>
          </div>
        );

      case 5: // Ambiente
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>Ambiente e licença</span>
              <span className="text-blue-400">Controle local</span>
            </div>
            <div className="space-y-1.5 my-auto">
              <div className="flex items-center justify-between bg-white/5 p-1.5 rounded-lg text-[10px]">
                <span className="text-slate-400">Tema e cor de destaque</span>
                <span className="text-blue-400">Configurações</span>
              </div>
              <div className="text-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 py-1 rounded">
                Licença, idioma e preferências em um só lugar.
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="h-32 bg-slate-900/90 dark:bg-[#12161c] rounded-2xl p-3 border border-white/10 flex flex-col justify-between relative overflow-hidden font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 border-b border-white/10 pb-2">
              <span>Trilha Forense SHA-256</span>
              <span className="text-emerald-400">Anti-Fraude</span>
            </div>
            <div className="my-auto space-y-1">
              <div className="flex items-center justify-between text-[10px] bg-white/5 p-1.5 rounded">
                <span className="text-slate-300">Lote #849 - Reverter</span>
                <span className="text-emerald-400 font-bold underline cursor-pointer">1-Click Rollback ↺</span>
              </div>
              <p className="text-[9px] text-slate-400 text-center">Operador: Windows_User • Assinatura Válida</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-300">
      
      {/* Container com Liquid Glass (Vidro Fosco Real) */}
      <div 
        className="liquid-glass-surface w-full max-w-4xl max-h-[min(760px,calc(100vh-2rem))] rounded-[28px] overflow-hidden flex flex-col relative"
        style={{ fontFamily: "'Quicksand', sans-serif" }}
      >
        
        {/* Cabeçalho do Card */}
        <div className="p-4 sm:p-5 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <StepIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t('tour.step_prefix')} {currentStep + 1} {t('tour.of')} {TOUR_STEPS.length}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Varela Round', sans-serif" }}>
                {t(`tour.current_steps.${currentStep}.title`)}
              </h3>
            </div>
          </div>

          <button 
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
            title={t('tour.btn_skip')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 md:grid-cols-[190px_minmax(0,1fr)]">
          <aside className="hidden md:flex flex-col gap-2 border-r border-slate-200/60 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03] p-4">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Como começar</span>
            {TOUR_STEPS.map((stepItem, idx) => {
              const ItemIcon = stepItem.icon;
              return (
                <button
                  key={stepItem.tabTarget + idx}
                  onClick={() => {
                    setCurrentStep(idx);
                    setSimState(0);
                    onNavigateTab(stepItem.tabTarget);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11px] font-semibold transition-colors ${idx === currentStep ? 'bg-white text-slate-900 shadow-sm dark:bg-white/10 dark:text-white' : 'text-slate-500 hover:bg-white/70 dark:text-slate-400 dark:hover:bg-white/5'}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${idx === currentStep ? 'text-white' : 'bg-slate-200/70 dark:bg-white/10'}`} style={idx === currentStep ? { backgroundColor: accentColor } : undefined}>
                    <ItemIcon size={13} />
                  </span>
                  <span className="truncate">{t(`tour.current_steps.${idx}.title`)}</span>
                </button>
              );
            })}
          </aside>

          {/* Conteúdo Central com a Simulação Animada */}
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* ⚡ SIMULADOR VISUAL ANIMADO DA TELA + GHOST CURSOR TOUR */}
          <div className="relative">
            {renderSimulatedScreen()}
            <GhostCursor step={currentStep} simState={simState} />
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200" style={{ fontFamily: "'Varela Round', sans-serif" }}>
              {t(`tour.current_steps.${currentStep}.subtitle`)}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(`tour.current_steps.${currentStep}.description`)}
            </p>
          </div>

          <div className="p-4 bg-white/45 dark:bg-white/[0.06] rounded-2xl border border-white/55 dark:border-white/10 space-y-2 backdrop-blur-md shadow-inner">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t('tour.highlights_title')}
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>{t(`tour.current_steps.${currentStep}.h1`)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>{t(`tour.current_steps.${currentStep}.h2`)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span>{t(`tour.current_steps.${currentStep}.h3`)}</span>
              </div>
            </div>
          </div>

          {/* Indicadores de Etapa (Bolinhas) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentStep(idx);
                  setSimState(0);
                    onNavigateTab(TOUR_STEPS[idx].tabTarget);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'w-6 bg-blue-600' 
                    : 'w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400'
                }`}
                style={idx === currentStep ? { backgroundColor: accentColor } : {}}
              />
            ))}
          </div>
          </div>
        </div>

        {/* Rodapé de Navegação */}
        <div className="p-4 bg-slate-50/80 dark:bg-[#0f141a]/80 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between gap-3 backdrop-blur-xl">
          <button
            onClick={handleFinish}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-semibold underline"
          >
            {t('tour.btn_skip')}
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 rounded-xl bg-white/55 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/15 text-xs font-bold text-slate-700 dark:text-slate-300 border border-white/65 dark:border-white/15 flex items-center gap-1.5 transition-colors shadow-xs backdrop-blur-md"
              >
                <ChevronLeft size={14} /> {t('tour.btn_prev')}
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
              style={{ backgroundColor: accentColor }}
            >
              <span>{isLast ? t('tour.btn_finish') : t('tour.btn_next')}</span>
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};