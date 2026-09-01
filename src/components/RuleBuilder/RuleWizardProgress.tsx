import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface RuleWizardProgressProps {
  steps: string[];
  currentStep: number;
  furthestStep: number;
  accentColor: string;
  onStepChange: (step: number) => void;
}

export const RuleWizardProgress: React.FC<RuleWizardProgressProps> = ({
  steps,
  currentStep,
  furthestStep,
  accentColor,
  onStepChange,
}) => (
  <div className="px-6 shrink-0 mb-6 hidden sm:block" aria-label="Progresso da criação da regra">
    <div className="flex justify-between items-center relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-slate-200 dark:bg-white/10 z-0" />
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isAccessible = index <= furthestStep;

        return (
          <button
            type="button"
            key={step}
            disabled={!isAccessible}
            onClick={() => onStepChange(index)}
            className={`relative z-10 flex flex-col items-center gap-2 bg-transparent border-0 ${isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            aria-current={isActive ? 'step' : undefined}
            aria-label={`${step}, etapa ${index + 1}`}
          >
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                isActive
                  ? 'text-white shadow-[0_0_0_4px_rgba(37,99,235,0.15)] scale-110'
                  : isCompleted
                    ? 'bg-slate-800 dark:bg-slate-900 border-slate-700 dark:border-white/15 text-emerald-400'
                    : 'bg-white/70 dark:bg-slate-900/70 border-slate-300 dark:border-white/15 text-slate-400'
              }`}
              style={isActive ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
            >
              {isCompleted ? <CheckCircle2 size={16} /> : index + 1}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
              {step}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);

export default RuleWizardProgress;
