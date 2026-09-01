import { useEffect, useState } from 'react';
import { hexToRgbValues } from '../utils/appHelpers';

/**
 * 🎨 Hook centralizando todo o estado de personalização visual (tema, cor de sotaque,
 * intensidade do Liquid Glass e raio de borda) — inclui persistência em localStorage
 * e sincronização com as CSS custom properties consumidas pelo Tailwind.
 */
export const useAppTheme = () => {
  const [theme, setTheme] = useState<'Light' | 'Dark'>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    return (savedTheme === 'Dark' || savedTheme === 'Light') ? savedTheme : 'Light';
  });

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem('accent_color') || '#0078d4';
  });

  const [glassIntensity, setGlassIntensity] = useState<number>(() => {
    const saved = Number(localStorage.getItem('glass_intensity'));
    return Number.isFinite(saved) && saved >= 20 && saved <= 50 ? saved : 32;
  });

  const [cornerRadius, setCornerRadius] = useState<number>(() => {
    const saved = Number(localStorage.getItem('corner_radius'));
    return Number.isFinite(saved) && saved >= 12 && saved <= 30 ? saved : 20;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-rgb-value', hexToRgbValues(accentColor));
    root.style.setProperty('--glass-blur', `${glassIntensity}px`);
    root.style.setProperty('--glass-opacity', `${Math.min(glassIntensity / 100, 0.5)}`);
    root.style.setProperty('--app-radius', `${cornerRadius}px`);
    localStorage.setItem('glass_intensity', String(glassIntensity));
    localStorage.setItem('corner_radius', String(cornerRadius));
  }, [accentColor, glassIntensity, cornerRadius]);

  const handleUpdateAccentColor = (color: string) => {
    setAccentColor(color);
    localStorage.setItem('accent_color', color);
  };

  const handleUpdateGlassIntensity = (value: number) => setGlassIntensity(value);
  const handleUpdateCornerRadius = (value: number) => setCornerRadius(value);

  return {
    theme,
    setTheme,
    accentColor,
    setAccentColor: handleUpdateAccentColor,
    glassIntensity,
    setGlassIntensity: handleUpdateGlassIntensity,
    cornerRadius,
    setCornerRadius: handleUpdateCornerRadius,
  };
};
