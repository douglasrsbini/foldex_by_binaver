import React, { useState } from 'react';
import { 
  FolderPlus, 
  FolderSearch, 
  PlayCircle, 
  History, 
  BarChart3, 
  Headphones, 
  Settings, 
  UserCheck, 
  ChevronLeft, 
  ChevronRight,
  Database
} from 'lucide-react';
import { LicenseInfo } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  accentColor: string;
  license: LicenseInfo | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  accentColor,
  license 
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const getLicenseDetails = () => {
    if (!license || !license.is_activated) {
      return { label: 'Community', color: 'purple' };
    }
    
    const p = license.plan_name.toLowerCase();
    
    if (p.includes('enterprise') || p.includes('master')) {
      return { label: 'Enterprise', color: 'blue' };
    }
    if (p.includes('pro') || p.includes('professional')) {
      return { label: 'Pro', color: 'amber' };
    }
    if (p.includes('core')) {
      return { label: 'Core', color: 'emerald' };
    }
    
    return { label: 'Core', color: 'emerald' };
  };

  // ⚡ TODOS OS ITENS PADRONIZADOS COM "e" PARA UM DESIGN MINIMALISTA E LIMPO
  const navItems = [
    { id: 'builder', label: 'Construtor de Regras', icon: FolderPlus },
    { id: 'explorer', label: 'Explorador de Pastas', icon: FolderSearch },
    { id: 'dryrun', label: 'Simulação e Execução', icon: PlayCircle },
    { id: 'history', label: 'Auditoria e Rollback', icon: History },
    { id: 'backup', label: 'Backup e Cofres', icon: Database }, 
    { id: 'dashboards', label: 'Relatórios e Métricas', icon: BarChart3 },
    { id: 'support', label: 'Suporte e Ajuda', icon: Headphones },
  ];

  const { label: planTag, color: planColor } = getLicenseDetails();

  const badgeStyles: Record<string, string> = {
    purple: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  };

  return (
    <aside 
      className={`h-screen flex flex-col justify-between p-3 border-r border-slate-200 dark:border-[#2e2e34] bg-white dark:bg-[#18181b] transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      <div className="space-y-4">
        {/* Topo com Logo Oficial e Nome Dinâmico por Licença */}
        <div className={`flex items-start ${collapsed ? 'flex-col gap-2' : 'justify-between'} px-1 py-1`}>
          <div className="flex items-start gap-2.5 relative">
            <div className="w-8 h-8 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="folderGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3b82f6" />
                    <stop offset="1" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <path d="M2 7C2 5.34315 3.34315 4 5 4H9.17157C9.96722 4 10.7303 4.31607 11.2929 4.87868L12.7071 6.29289C13.2697 6.8555 14.0328 7.17157 14.8284 7.17157H19C20.6569 7.17157 22 8.51472 22 10.1716V17C22 18.6569 20.6569 20 19 20H5C3.34315 20 2 18.6569 2 17V7Z" fill="url(#folderGrad)" />
                <path d="M13 9.5L9.5 14.5H12L11 18.5L15.5 13H12.5L13 9.5Z" fill="#ffffff" />
              </svg>
            </div>

            {!collapsed && (
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 h-8">
                  <span className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white leading-none mt-0.5">
                    FOLDEX
                  </span>
                  <span 
                    className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md border leading-none ${badgeStyles[planColor]}`}
                  >
                    {planTag}
                  </span>
                </div>
                
                <div className="absolute top-[28px] left-[42px] flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-semibold text-slate-400 tracking-wider leading-none">by</span>
                  <img src="/logotipo.png" alt="BINAVER" className="h-[10px] object-contain dark:brightness-150" />
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 mt-0.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors shrink-0"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="space-y-1 mt-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27272a]'
                } ${collapsed ? 'justify-center px-0' : ''}`}
                style={isActive ? { backgroundColor: accentColor } : {}}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Inferior */}
      <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-[#2e2e34]">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'settings'
              ? 'text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27272a]'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          style={activeTab === 'settings' ? { backgroundColor: accentColor } : {}}
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">Configurações</span>}
        </button>

        {/* ⚡ ATUALIZADO TAMBÉM NO RODAPÉ */}
        <button
          onClick={() => setActiveTab('account')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'account'
              ? 'text-white font-bold shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#27272a]'
          } ${collapsed ? 'justify-center px-0' : ''}`}
          style={activeTab === 'account' ? { backgroundColor: accentColor } : {}}
          title={collapsed ? 'Conta e Licença' : undefined}
        >
          <UserCheck size={16} className="shrink-0" />
          {!collapsed && <span className="truncate">Conta e Licença</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;