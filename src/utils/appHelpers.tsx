import React from 'react';
import { LicenseInfo } from '../types';

/**
 * 🏷️ Deriva um rótulo de plano amigável a partir da licença.
 * Blindado contra licença nula/incompleta — nunca quebra a UI.
 */
export const getLicenseTag = (lic: LicenseInfo | null) => {
  if (!lic || !lic.is_activated || !lic.plan_name) return 'Community';
  const p = String(lic.plan_name).toLowerCase();

  if (p.includes('enterprise') || p.includes('master')) return 'Enterprise';
  if (p.includes('pro') || p.includes('professional')) return 'Pro';
  if (p.includes('basic') || p.includes('core')) return 'Basic';

  return 'Basic';
};

/**
 * 🎨 Converte uma cor hex (#rrggbb) em "r, g, b" para uso em rgba() dinâmico.
 * Blindado contra entradas inválidas/nulas — nunca quebra a UI.
 */
export const hexToRgbValues = (hex?: string | null): string => {
  const fallback = '0, 120, 212';
  if (!hex) return fallback;
  const normalized = hex.trim().replace('#', '');
  const isShort = normalized.length === 3;
  const isFull = normalized.length === 6;
  if (!isShort && !isFull) return fallback;

  const expand = (s: string) => (isShort ? s.split('').map(c => c + c).join('') : s);
  const full = expand(normalized);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if ([r, g, b].some(v => Number.isNaN(v))) return fallback;
  return `${r}, ${g}, ${b}`;
};

/**
 * 📝 Renderiza texto com marcações leves (**negrito**, `código`) e quebras de parágrafo.
 * Usado pelo chat do Agente FOLDEX. Blindado contra texto vazio/nulo.
 */
export const renderFormattedText = (text: string) => {
  const safeText = text ?? '';
  const paragraphs = safeText.split(/\n\s*\n/);

  return paragraphs.map((paragraph, pIdx) => {
    const lines = paragraph.split('\n');

    return (
      <p key={`p-${pIdx}`} className="mb-2 last:mb-0">
        {lines.map((line, lIdx) => {
          const parts = line.split(/(\*\*.*?\*\*)/g);

          return (
            <React.Fragment key={`l-${lIdx}`}>
              {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={`s-${i}`} className="font-extrabold text-indigo-900 dark:text-indigo-200">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
                  return (
                    <span key={`c-${i}`} className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px] font-mono mx-0.5">
                      {part.slice(1, -1)}
                    </span>
                  );
                }
                return part;
              })}
              {lIdx < lines.length - 1 && <br />}
            </React.Fragment>
          );
        })}
      </p>
    );
  });
};
