import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ArrowRight } from 'lucide-react';

interface HelpTooltipProps {
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  accentColor: string;
  children?: React.ReactNode;
  isComplex?: boolean;
  ctaText?: string;
  onCTA?: () => void;
}

/**
 * 💡 HELP TOOLTIP PREMIUM
 * Popover elegante que aparece no hover ou click
 */
export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  title,
  content,
  position = 'top',
  accentColor,
  children,
  isComplex = false,
  ctaText,
  onCTA,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 🎯 Calcular posição do tooltip
  const getTooltipClasses = () => {
    const baseClasses =
      'absolute bg-gradient-to-br from-slate-900 to-slate-800 border border-white/20 rounded-lg shadow-xl p-4 z-tooltip text-sm min-w-xs animate-fade-in';

    const positionClasses: Record<string, string> = {
      top: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
      bottom: 'top-full mt-3 left-1/2 -translate-x-1/2',
      left: 'right-full mr-3 top-1/2 -translate-y-1/2',
      right: 'left-full ml-3 top-1/2 -translate-y-1/2',
    };

    return `${baseClasses} ${positionClasses[position]}`;
  };

  // 🎯 Seta do tooltip
  const getArrowClasses = () => {
    const baseClasses =
      'absolute w-2 h-2 bg-slate-900 border border-white/20 transform rotate-45';

    const arrowClasses: Record<string, string> = {
      top: 'top-full left-1/2 -translate-x-1/2 -translate-y-1',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-1',
      left: 'left-full top-1/2 -translate-y-1/2 translate-x-1',
      right: 'right-full top-1/2 -translate-y-1/2 -translate-x-1',
    };

    return `${baseClasses} ${arrowClasses[position]}`;
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => !isComplex && setIsOpen(true)}
      onMouseLeave={() => !isComplex && setIsOpen(false)}
      onClick={() => isComplex && setIsOpen(!isOpen)}
    >
      {/* Trigger Button */}
      {children ? (
        children
      ) : (
        <button
          className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-help"
          style={{
            color: accentColor,
          }}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}

      {/* Tooltip */}
      {isOpen && (
        <div ref={tooltipRef} className={getTooltipClasses()}>
          {/* Arrow */}
          <div className={getArrowClasses()} />

          {/* Close button (para complex tooltips) */}
          {isComplex && (
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}

          {/* Content */}
          <div className="max-w-sm">
            <h4
              className="font-semibold text-white mb-1 pr-4"
              style={{
                color: isComplex ? accentColor : 'white',
              }}
            >
              {title}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              {content}
            </p>

            {/* CTA Button (se aplicável) */}
            {ctaText && onCTA && (
              <button
                onClick={onCTA}
                className="text-xs font-semibold flex items-center gap-1 transition-colors py-1"
                style={{
                  color: accentColor,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.opacity = '0.7')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.opacity = '1')
                }
              >
                {ctaText}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface InfoBoxProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  accentColor: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/**
 * 📦 CONTEXTUAL INFO BOX
 * Caixa de informação elegante para ajuda em contexto
 */
export const ContextualInfoBox: React.FC<InfoBoxProps> = ({
  type,
  title,
  message,
  accentColor,
  icon,
  dismissible = true,
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const typeColors = {
    info: {
      bgGradient: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/30',
      textTitle: 'text-blue-400',
      textContent: 'text-blue-200',
    },
    warning: {
      bgGradient: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/30',
      textTitle: 'text-amber-400',
      textContent: 'text-amber-200',
    },
    success: {
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      border: 'border-green-500/30',
      textTitle: 'text-green-400',
      textContent: 'text-green-200',
    },
    error: {
      bgGradient: 'from-red-500/10 to-pink-500/10',
      border: 'border-red-500/30',
      textTitle: 'text-red-400',
      textContent: 'text-red-200',
    },
  };

  const colors = typeColors[type];

  return (
    <div
      className={`rounded-lg border bg-gradient-to-r p-4 animate-fade-in ${colors.bgGradient} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        {icon && <div className="flex-shrink-0 pt-0.5">{icon}</div>}

        <div className="flex-1">
          <h4 className={`font-semibold text-sm mb-1 ${colors.textTitle}`}>
            {title}
          </h4>
          <p className={`text-xs leading-relaxed ${colors.textContent}`}>
            {message}
          </p>
        </div>

        {dismissible && (
          <button
            onClick={() => {
              setIsDismissed(true);
              onDismiss?.();
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * 🎓 INLINE HELP BADGE
 * Badge pequeno que exibe ajuda on-demand
 */
export const InlineHelp: React.FC<{
  text: string;
  tooltip: string;
  accentColor: string;
}> = ({ text, tooltip, accentColor }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="text-xs font-medium text-slate-300">{text}</span>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
        style={{ color: accentColor }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {showTooltip && (
        <div
          className="absolute left-0 bottom-full mb-2 p-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-300 whitespace-nowrap bg-opacity-95 backdrop-blur-sm shadow-lg z-tooltip animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {tooltip}
          <div className="absolute top-full left-3 w-2 h-2 bg-slate-900 border-r border-b border-white/10 transform rotate-45" />
        </div>
      )}
    </div>
  );
};
