import React from 'react';
import { Lock, ArrowUpRight } from 'lucide-react';

interface LockedFeatureViewProps {
  title: string;
  description: string;
  planLabel: string;
  accentColor: string;
  onOpenUpgrade: () => void;
}

export const LockedFeatureView: React.FC<LockedFeatureViewProps> = ({
  title,
  description,
  planLabel,
  accentColor,
  onOpenUpgrade,
}) => (
  <section className="relative flex h-full min-h-[360px] items-center justify-center overflow-hidden rounded-3xl liquid-glass-surface p-8 text-center">
    <div className="pointer-events-none absolute inset-0 bg-slate-950/[0.04] backdrop-blur-[2px] dark:bg-black/20" />
    <div className="relative z-10 max-w-lg">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/45 text-slate-500 shadow-inner dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300">
        <Lock size={28} />
      </div>
      <span className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accentColor }}>
        Exclusivo {planLabel}
      </span>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
      <button
        type="button"
        onClick={onOpenUpgrade}
        className="mt-7 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-95"
        style={{ backgroundColor: accentColor, boxShadow: `0 12px 28px ${accentColor}45` }}
      >
        <Lock size={14} /> Conhecer planos
        <ArrowUpRight size={14} />
      </button>
    </div>
  </section>
);

export default LockedFeatureView;
