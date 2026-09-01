import React from 'react';
import { Wand2, ChevronRight, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickTemplate {
  title: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  niches: string[];
}

interface TemplatesModalProps {
  isOpen: boolean;
  templates: QuickTemplate[];
  onSelectTemplate: (template: QuickTemplate) => void;
  onClose: () => void;
  accentColor: string;
  userNiche?: string;
}

/**
 * 💎 TEMPLATES MODAL SUBCOMPONENT
 * Exibe templates rápidas para criação acelerada de regras
 */
export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  templates,
  onSelectTemplate,
  onClose,
  accentColor,
  userNiche,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  // 🛡️ Null-safety
  const safeTemplates = Array.isArray(templates) ? templates : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl bg-gradient-to-br from-white to-slate-50 dark:from-[#18181b] dark:to-[#1e1e24] rounded-2xl border border-slate-200/50 dark:border-[#2e2e34]/50 shadow-2xl overflow-hidden animate-zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-6 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-b border-slate-200 dark:border-[#2e2e34]"
            style={{
              backgroundImage: `linear-gradient(135deg, ${accentColor}20 0%, ${accentColor}10 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <Wand2 className="w-6 h-6" style={{ color: accentColor }} />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t('rule_builder.templates_modal_title') || 'Templates Rápidas'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {t('rule_builder.templates_modal_subtitle') || 'Escolha uma template para começar rapidamente'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {safeTemplates.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">{t('rule_builder.no_templates') || 'Nenhuma template disponível'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {safeTemplates.map((template, idx) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectTemplate(template);
                        onClose();
                      }}
                      className="relative p-4 rounded-xl border border-slate-200 dark:border-[#2e2e34] bg-white/50 dark:bg-[#27272a]/50 hover:border-slate-300 dark:hover:border-[#383840] hover:bg-white dark:hover:bg-[#2e2e34] transition-all duration-300 text-left group overflow-hidden"
                    >
                      {/* Background glow */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at 100% 100%, ${accentColor}10 0%, transparent 50%)`,
                        }}
                      />

                      {/* Content */}
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="p-2 rounded-lg"
                              style={{ backgroundColor: `${accentColor}15` }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: accentColor }}
                              />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                {template.title}
                              </h3>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {template.name}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                          {template.description}
                        </p>

                        {/* Badge */}
                        <div
                          className="inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            color: accentColor,
                            border: `1px solid ${accentColor}40`,
                          }}
                        >
                          {template.badge}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
