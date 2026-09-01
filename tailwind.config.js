/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // 🎨 LIQUID GLASS COLOR SYSTEM - Apple-inspired palette
      colors: {
        // 💧 Liquid Glass colors (frosted, translucent)
        'liquid-light': 'rgba(255, 255, 255, 0.06)',
        'liquid-dark': 'rgba(0, 0, 0, 0.1)',
        'glass-dark': 'rgba(18, 22, 28, 0.8)',
        'glass-light': 'rgba(255, 255, 255, 0.08)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'frosted': 'rgba(255, 255, 255, 0.04)',
        'frosted-light': 'rgba(255, 255, 255, 0.12)',
      },
      
      // 📐 PROFESSIONAL SPACING & RADII
      borderRadius: {
        'glass': '16px',
        'premium': '20px',
      },
      
      // 🎬 LIQUID GLASS ANIMATIONS - Smooth, Apple-like transitions
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'zoom-in': 'zoomIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'morphing': 'morphing 4s ease-in-out infinite',
        'glass-shimmer': 'glassShimmer 3s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(40px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: 'calc(200% + 0px) 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        morphing: {
          '0%': { borderRadius: '40%' },
          '50%': { borderRadius: '60%' },
          '100%': { borderRadius: '40%' },
        },
        glassShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '50%': { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      
      // 💎 LIQUID GLASS BLUR EFFECTS - Multiple depths
      backdropBlur: {
        glass: '8px',
        'glass-md': '12px',
        'glass-lg': '16px',
        premium: '20px',
        'premium-xl': '24px',
        'liquid': '30px',
        'liquid-deep': '40px',
      },
      
      // � LIQUID GLASS SHADOW SYSTEM - Apple-inspired depth
      boxShadow: {
        // Liquid Glass effects (frosted glass look)
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1), inset 1px 1px 2px rgba(255, 255, 255, 0.1)',
        'glass-md': '0 12px 48px rgba(0, 0, 0, 0.12), inset 1px 1px 3px rgba(255, 255, 255, 0.12)',
        'glass-lg': '0 20px 64px rgba(0, 0, 0, 0.15), inset 1px 1px 4px rgba(255, 255, 255, 0.15)',
        'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.4), inset 1px 1px 2px rgba(255, 255, 255, 0.08)',
        'liquid': '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'liquid-lg': '0 40px 80px -16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        'premium': '0 20px 60px rgba(0, 0, 0, 0.15)',
        'premium-dark': '0 20px 60px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 1px 3px rgba(255, 255, 255, 0.2), 0 8px 32px rgba(0, 0, 0, 0.1)',
        'neon-glow': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)',
      },
      
      
      // 🎨 LIQUID GLASS GRADIENTS - Smooth, blended backgrounds
      backgroundImage: {
        'gradient-liquid': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-dark-liquid': 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)',
        'gradient-accent': 'linear-gradient(135deg, var(--accent-color), rgba(var(--accent-rgb-value), 0.5))',
        'gradient-mesh': 'linear-gradient(45deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(59, 130, 246, 0.05) 100%)',
        'gradient-premium': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.05) 100%)',
      },
      zIndex: {
        'tooltip': '1000',
        'dropdown': '900',
        'modal': '800',
        'popover': '750',
        'overlay': '500',
      },
    },
  },
  plugins: [
    // 🚀 Custom plugin for accent color system (dynamic theming)
    function({ addBase, matchUtilities, theme }) {
      matchUtilities(
        {
          accent: (value) => ({
            '--accent-color': value,
            '--accent-rgb': 'var(--accent-rgb-value)',
          }),
        },
        { values: theme('colors') }
      );
    },
  ],
}