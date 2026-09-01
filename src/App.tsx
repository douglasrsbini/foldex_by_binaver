import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { RuleBuilder } from './components/RuleBuilder';
import { FileExplorer } from './components/FileExplorer';
import { SimulationView } from './components/SimulationView';
import { HistoryView } from './components/HistoryView';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { SupportView } from './components/SupportView';
import { OnboardingTour } from './components/OnboardingTour';
import { LockedFeatureView } from './components/LockedFeatureView';
import { UpsellModal } from './components/UpsellModal';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeSetup } from './components/WelcomeSetup';
import { AccountView } from './components/AccountView';
import { AgentChatWidget } from './components/AgentChatWidget';
import { useLicense } from './context/LicenseContext';
import { useAppTheme } from './hooks/useAppTheme';
import { useLicenseAuth } from './hooks/useLicenseAuth';
import './i18n';

const ENABLE_AI_FEATURES = false;

export const App: React.FC = () => {
  const { setLicense: setContextLicense, canUseFeature } = useLicense();
  const [isLoadingApp, setIsLoadingApp] = useState(true);

  const [activeTab, setActiveTab] = useState('builder');
  const [upsellFeature, setUpsellFeature] = useState<'DASHBOARD' | null>(null);

  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => {
    return localStorage.getItem('foldex_setup_done') === 'true';
  });

  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => {
    return localStorage.getItem('onboarding_tour_completed') !== 'true';
  });

  const {
    theme, setTheme,
    accentColor, setAccentColor,
    glassIntensity, setGlassIntensity,
    cornerRadius, setCornerRadius,
  } = useAppTheme();

  const {
    license, setLicense,
    authStep, setAuthStep,
    inputEmail, setInputEmail,
    inputCode, setInputCode,
    hintCode,
    loadingActivation,
    copiedId,
    loadLicense,
    handleRequestCode,
    handleVerifyCode,
    handleStoreActivation,
    handleLogout,
    handleCopyMachineId,
  } = useLicenseAuth();

  const [userNiche, setUserNiche] = useState<string>(() => {
    return localStorage.getItem('foldex_user_niche') || '';
  });

  const [hourlyRate, setHourlyRate] = useState<number>(() => {
    const savedRate = localStorage.getItem('roi_hourly_rate');
    return savedRate ? parseFloat(savedRate) : 35.0;
  });

  const [selectedSourcePath, setSelectedSourcePath] = useState('');

  React.useEffect(() => {
    setContextLicense(license);
  }, [license, setContextLicense]);

  const handleUpdateHourlyRate = (rate: number) => {
    setHourlyRate(rate);
    localStorage.setItem('roi_hourly_rate', rate.toString());
  };

  const handleSetSourceFromExplorer = (path: string) => {
    setSelectedSourcePath(path);
    setActiveTab('builder');
  };

  const handleCompleteSetup = async (prefs: { niche: string | null; theme: 'Light' | 'Dark'; accentColor: string; reloadLicense?: boolean }) => {
    setTheme(prefs.theme);
    setAccentColor(prefs.accentColor);

    if (prefs.niche) {
      setUserNiche(prefs.niche);
      localStorage.setItem('foldex_user_niche', prefs.niche);
    }

    localStorage.setItem('app_theme', prefs.theme);
    localStorage.setItem('accent_color', prefs.accentColor);
    localStorage.setItem('foldex_setup_done', 'true');
    setIsSetupDone(true);

    if (prefs.reloadLicense) {
      await loadLicense();
    }
  };

  const showAppUI = !isLoadingApp && isSetupDone;

  return (
    <div className="flex h-screen w-screen text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none relative bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_35%),linear-gradient(135deg,_#f8fafc_0%,_#e2e8f0_35%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.18),_transparent_30%),linear-gradient(135deg,_#0B0F14_0%,_#111827_40%,_#0B0F14_100%)]">

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.1); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 12s infinite alternate ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-300/40 dark:bg-blue-600/15 mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-80 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-emerald-300/30 dark:bg-emerald-600/10 mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-80 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-300/30 dark:bg-cyan-600/10 mix-blend-multiply dark:mix-blend-screen filter blur-[140px] opacity-80 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 flex h-full w-full">

        {!isLoadingApp && !isSetupDone && (
          <WelcomeSetup onComplete={handleCompleteSetup} />
        )}

        {isLoadingApp && (
          <SplashScreen accentColor={accentColor} onFinish={() => setIsLoadingApp(false)} />
        )}

        <div className={`flex h-full w-full transition-opacity duration-300 ${showAppUI ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 z-[-1] pointer-events-none'}`}>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} accentColor={accentColor} license={license} />

          <main className="flex-1 p-4 overflow-hidden relative">
            {activeTab === 'builder' && (
              <div data-tour="rule-builder" className="h-full w-full">
                <RuleBuilder initialSource={selectedSourcePath || ''} accentColor={accentColor} onNavigateToAccount={() => setActiveTab('account')} userNiche={userNiche} />
              </div>
            )}

            {activeTab === 'explorer' && (
              <div data-tour="file-explorer" className="h-full w-full">
                <FileExplorer onSetSource={handleSetSourceFromExplorer} accentColor={accentColor} />
              </div>
            )}

            {activeTab === 'dryrun' && (
              <div data-tour="dry-run" className="h-full w-full">
                <SimulationView accentColor={accentColor} />
              </div>
            )}

            {activeTab === 'history' && (
              <div data-tour="history" className="h-full w-full">
                <HistoryView />
              </div>
            )}

            {activeTab === 'dashboards' && (
              canUseFeature('DASHBOARD') ? (
                <DashboardView hourlyRate={hourlyRate} accentColor={accentColor} />
              ) : (
                <LockedFeatureView
                  title="Relatórios Analíticos e Retorno de Investimento"
                  description="Descubra quanto o Foldex Automate economiza em tempo e dinheiro com métricas, histórico e indicadores de produtividade."
                  planLabel="Pro ou Enterprise"
                  accentColor={accentColor}
                  onOpenUpgrade={() => setUpsellFeature('DASHBOARD')}
                />
              )
            )}

            {activeTab === 'settings' && (
              <SettingsView theme={theme} setTheme={(t) => setTheme(t as 'Light' | 'Dark')} accentColor={accentColor} setAccentColor={setAccentColor} hourlyRate={hourlyRate} setHourlyRate={handleUpdateHourlyRate} glassIntensity={glassIntensity} setGlassIntensity={setGlassIntensity} cornerRadius={cornerRadius} setCornerRadius={setCornerRadius} />
            )}

            {activeTab === 'support' && (
              <SupportView accentColor={accentColor} onOpenTour={() => setIsTourOpen(true)} />
            )}

            {activeTab === 'account' && (
              <AccountView
                accentColor={accentColor}
                license={license}
                setLicense={setLicense}
                authStep={authStep}
                setAuthStep={setAuthStep}
                inputEmail={inputEmail}
                setInputEmail={setInputEmail}
                inputCode={inputCode}
                setInputCode={setInputCode}
                hintCode={hintCode}
                loadingActivation={loadingActivation}
                copiedId={copiedId}
                loadLicense={loadLicense}
                handleRequestCode={handleRequestCode}
                handleVerifyCode={handleVerifyCode}
                handleStoreActivation={handleStoreActivation}
                handleLogout={handleLogout}
                handleCopyMachineId={handleCopyMachineId}
              />
            )}

            <OnboardingTour
              accentColor={accentColor}
              isOpen={isTourOpen && isSetupDone}
              onClose={() => setIsTourOpen(false)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            <UpsellModal
              isOpen={upsellFeature !== null}
              feature={upsellFeature}
              currentPlan={license?.plan_name || 'Community'}
              accentColor={accentColor}
              onClose={() => setUpsellFeature(null)}
              onUpgrade={() => window.open('https://binaver.com', '_blank')}
            />
          </main>

          {ENABLE_AI_FEATURES && <AgentChatWidget />}
        </div>
      </div>
    </div>
  );
};

export default App;
