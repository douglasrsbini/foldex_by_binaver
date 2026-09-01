import React, { createContext, useContext, useState, useEffect } from 'react';
import { LicenseInfo } from '../types';
import { createAdminLicense, isAdminEmail } from '../services/licensePolicy';

/**
 * 🔐 SISTEMA DE LICENCIAMENTO CENTRALIZADO COM BYPASS ADMIN
 * 
 * Emails hardcoded para acesso Enterprise irrestrito:
 * - douglasrsbini@gmail.com
 * - averleonardo@gmail.com
 * 
 * Quando um destes emails é detectado, a licença é forcefully ativada
 * como "Binaver Enterprise Master Full" com direitos vitalícios.
 */

interface LicenseContextType {
  license: LicenseInfo | null;
  setLicense: (license: LicenseInfo | null) => void;
  isLicensed: boolean;
  isAdmin: boolean;
  plan: 'COMMUNITY' | 'BASIC' | 'PRO' | 'ENTERPRISE';
  canUseFeature: (feature: string) => boolean;
  tryActivateWithBypass: (email: string) => void;
  // 🎮 TEST MODE
  isTestMode: boolean;
  enableTestMode: () => void;
  disableTestMode: () => void;
  setTestPlan: (plan: 'COMMUNITY' | 'BASIC' | 'PRO' | 'ENTERPRISE') => void;
  getTestPlans: () => Array<{ plan: string; description: string }>;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const isAdmin = license?.source_channel === 'ADMIN_BYPASS';
  
  // 🎮 TEST MODE
  const [isTestMode, setIsTestMode] = useState(() => {
    // Carregar test mode do localStorage (somente para admin)
    const storedTestMode = localStorage.getItem('foldex_test_mode');
    return storedTestMode === 'true';
  });

  const [testPlan, setTestPlanState] = useState<'COMMUNITY' | 'BASIC' | 'PRO' | 'ENTERPRISE'>(
    () => {
      const stored = localStorage.getItem('foldex_test_plan');
      return (stored as any) || 'COMMUNITY';
    }
  );

  /**
   * 🔒 Verifica se um email é admin e força a licença Enterprise
   */
  const tryActivateWithBypass = (email: string) => {
    if (isAdminEmail(email)) {
      setLicense(createAdminLicense(email));
      console.log('✅ [LicenseContext] Admin bypass ativado para:', email);
    }
  };

  /**
   * 🎯 Mapeia plan_name para categorias
   */
  const getPlanType = (): 'COMMUNITY' | 'BASIC' | 'PRO' | 'ENTERPRISE' => {
    // 🎮 TEST MODE: override com plano de teste
    if (isAdmin && isTestMode) {
      return testPlan;
    }

    if (!license?.is_activated || !license?.plan_name) return 'COMMUNITY';
    
    const plan = String(license.plan_name).toLowerCase();
    
    if (plan.includes('enterprise') || plan.includes('master')) return 'ENTERPRISE';
    if (plan.includes('pro') || plan.includes('professional')) return 'PRO';
    if (plan.includes('basic') || plan.includes('core')) return 'BASIC';
    
    return 'COMMUNITY';
  };

  /**
   * 🎮 Ativa mode de teste (apenas para admins)
   */
  const enableTestMode = () => {
    if (isAdmin) {
      setIsTestMode(true);
      localStorage.setItem('foldex_test_mode', 'true');
      console.log('🎮 [LicenseContext] Test mode ATIVADO');
    }
  };

  /**
   * 🎮 Desativa mode de teste
   */
  const disableTestMode = () => {
    setIsTestMode(false);
    localStorage.removeItem('foldex_test_mode');
    console.log('🎮 [LicenseContext] Test mode DESATIVADO');
  };

  /**
   * 🎮 Muda plano de teste (apenas quando test mode está ativo)
   */
  const setTestPlan = (plan: 'COMMUNITY' | 'BASIC' | 'PRO' | 'ENTERPRISE') => {
    if (isTestMode) {
      setTestPlanState(plan);
      localStorage.setItem('foldex_test_plan', plan);
      console.log('🎮 [LicenseContext] Test plan alterado para:', plan);
    }
  };

  /**
   * 🎮 Retorna lista de planos disponíveis para teste
   */
  const getTestPlans = () => [
    {
      plan: 'COMMUNITY',
      description: 'Plano Gratuito (5 regras máx)',
    },
    {
      plan: 'BASIC',
      description: 'Plano Basic (20 regras máx)',
    },
    {
      plan: 'PRO',
      description: 'Plano Pro (100 regras + Premium Features)',
    },
    {
      plan: 'ENTERPRISE',
      description: 'Plano Enterprise (Ilimitado + Todas as Features)',
    },
  ];

  /**
   * ✅ Verifica se um recurso está disponível no plano
   */
  const canUseFeature = (feature: string): boolean => {
    const plan = getPlanType();
    
    // 🚀 Recursos por plano
    const featureMatrix: Record<string, string[]> = {
      // Recursos Enterprise
      AUTOPILOT: ['ENTERPRISE'],
      SMART_ORGANIZE: ['ENTERPRISE', 'PRO'],
      DASHBOARD: ['ENTERPRISE', 'PRO'],
      SENTINEL_MODE: ['ENTERPRISE'],
      ADVANCED_RULES: ['ENTERPRISE', 'PRO'],
      BATCH_EXECUTION: ['ENTERPRISE', 'PRO'],
      
      // Recursos Pro
      DRY_RUN: ['ENTERPRISE', 'PRO', 'BASIC'],
      HISTORY_AUDIT: ['ENTERPRISE', 'PRO', 'BASIC'],
      FILE_EXPLORER: ['ENTERPRISE', 'PRO', 'BASIC', 'COMMUNITY'],
      RULE_BUILDER: ['ENTERPRISE', 'PRO', 'BASIC', 'COMMUNITY'],
    };

    const allowedPlans = featureMatrix[feature] || [];
    return allowedPlans.includes(plan);
  };

  return (
    <LicenseContext.Provider
      value={{
        license,
        setLicense,
        isLicensed: license?.is_activated ?? false,
        isAdmin,
        plan: getPlanType(),
        canUseFeature,
        tryActivateWithBypass,
        // 🎮 TEST MODE
        isTestMode,
        enableTestMode,
        disableTestMode,
        setTestPlan,
        getTestPlans,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
};

/**
 * 🎣 Hook para usar o contexto de licenciamento
 */
export const useLicense = () => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense deve ser usado dentro de <LicenseProvider>');
  }
  return context;
};

export default LicenseContext;
