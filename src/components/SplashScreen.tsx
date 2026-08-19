import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  accentColor: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, accentColor }) => {
  const [progress, setProgress] = useState(15);
  const [statusMessage, setStatusMessage] = useState('Inicializando subsistemas locais...');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const steps = [
      { p: 35, msg: 'Conectando ao banco SQLite local...' },
      { p: 65, msg: 'Carregando regras de automação...' },
      { p: 85, msg: 'Verificando integridade da trilha forense SHA-256...' },
      { p: 100, msg: 'Pronto para operar!' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatusMessage(steps[currentStep].msg);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => setFadeOut(true), 300);
        setTimeout(onFinish, 700);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-10 bg-[#0e0e11] text-white select-none transition-opacity duration-500 ${
      fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div />

      {/* Centro: Logo Oficial Pasta + Raio (Estilo Barra de Tarefas) */}
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
            <defs>
              <linearGradient id="splashGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3b82f6" />
                <stop offset="1" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>
            <path d="M2 7C2 5.34315 3.34315 4 5 4H9.17157C9.96722 4 10.7303 4.31607 11.2929 4.87868L12.7071 6.29289C13.2697 6.8555 14.0328 7.17157 14.8284 7.17157H19C20.6569 7.17157 22 8.51472 22 10.1716V17C22 18.6569 20.6569 20 19 20H5C3.34315 20 2 18.6569 2 17V7Z" fill="url(#splashGrad)" />
            <path d="M13 9.5L9.5 14.5H12L11 18.5L15.5 13H12.5L13 9.5Z" fill="#ffffff" />
          </svg>
        </div>

        <div className="flex flex-col items-center space-y-1 text-center">
          <h1 className="text-2xl font-black tracking-widest text-white">FOLDEX</h1>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
            Binaver Enterprise Solution
          </span>
        </div>

        <div className="w-64 space-y-2 pt-2">
          <div className="w-full h-1.5 bg-[#1f1f26] rounded-full overflow-hidden border border-[#2e2e38]">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: accentColor }}
            />
          </div>
          <p className="text-[11px] font-mono text-slate-400 text-center truncate">
            {statusMessage}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
        <ShieldCheck size={14} className="text-green-500" />
        <span>BINAVER Soluções Tecnológicas - Ltda • Proteção Forense & LGPD</span>
      </div>
    </div>
  );
};