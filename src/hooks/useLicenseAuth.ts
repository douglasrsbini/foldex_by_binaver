import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LicenseInfo } from '../types';
import { createAdminLicense, isAdminEmail } from '../services/licensePolicy';
import { getLicenseTag } from '../utils/appHelpers';

interface VerificationResponse {
  success: boolean;
  message: string;
  simulated_code?: string;
}

/**
 * 🔐 Hook centralizando todo o fluxo de licenciamento/autenticação:
 * carregamento inicial, bypass admin, verificação por e-mail/OTP,
 * ativação via Microsoft Store, logout e atualização do título da janela.
 * Todas as chamadas ao backend Tauri são blindadas contra falhas/nulos.
 */
export const useLicenseAuth = () => {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [authStep, setAuthStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [inputEmail, setInputEmail] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [hintCode, setHintCode] = useState<string | null>(null);
  const [loadingActivation, setLoadingActivation] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const loadLicense = async () => {
    try {
      const res = await invoke<LicenseInfo>('get_license_status');
      setLicense(res ?? null);
    } catch (e) {
      console.error('❌ [License Error]', e);
      setLicense(null);
    }
  };

  useEffect(() => {
    loadLicense();
  }, []);

  useEffect(() => {
    const updateWindowTitle = async () => {
      try {
        const tag = getLicenseTag(license);
        await getCurrentWindow().setTitle(`Foldex Automate ${tag} — by BINAVER`);
      } catch (e) {
        console.error('Falha ao atualizar o título da janela', e);
      }
    };
    updateWindowTitle();
  }, [license]);

  const handleRequestCode = async () => {
    if (!inputEmail.trim()) {
      alert('Por favor, informe seu e-mail de compra.');
      return;
    }
    setLoadingActivation(true);
    try {
      // 🔐 BYPASS ADMIN CHECK - Force Enterprise access for admin emails
      if (isAdminEmail(inputEmail)) {
        console.log('✅ [Admin Bypass Activated] Email:', inputEmail);
        const adminLicense = createAdminLicense(inputEmail);
        setLicense(adminLicense);
        setInputEmail('');
        setInputCode('');
        setHintCode(null);
        setAuthStep('EMAIL');
        alert('🎉 Licença Enterprise Master ativada com sucesso (Admin Bypass).');
        return;
      }

      // ✅ Standard license verification flow
      const res = await invoke<VerificationResponse>('request_login_code', { email: inputEmail });
      setAuthStep('OTP');
      if (res?.simulated_code) {
        setHintCode(res.simulated_code);
      }
    } catch (e) {
      alert(`Falha ao solicitar código: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleVerifyCode = async () => {
    if (inputCode.trim().length !== 6) {
      alert('O código de verificação deve conter 6 dígitos.');
      return;
    }
    setLoadingActivation(true);
    try {
      const res = await invoke<LicenseInfo>('verify_login_code', { email: inputEmail, code: inputCode });
      setLicense(res ?? null);
      setInputEmail('');
      setInputCode('');
      setHintCode(null);
      setAuthStep('EMAIL');
      alert('Licença confirmada e ativada com sucesso.');
    } catch (e) {
      alert(`Falha na validação: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleStoreActivation = async () => {
    setLoadingActivation(true);
    try {
      const res = await invoke<LicenseInfo>('activate_store_license');
      setLicense(res ?? null);
      alert('Compra da Microsoft Store vinculada com sucesso.');
    } catch (e) {
      alert(`Falha ao vincular com a Microsoft Store: ${e}`);
    } finally {
      setLoadingActivation(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Deseja desconectar a licença deste computador? O aplicativo retornará ao modo Demonstração.')) {
      try {
        await invoke('logout_license');
        await loadLicense();
      } catch (e) {
        alert(e);
      }
    }
  };

  const handleCopyMachineId = () => {
    if (!license?.machine_id) return;
    navigator.clipboard.writeText(license.machine_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 3000);
  };

  return {
    license,
    setLicense,
    authStep,
    setAuthStep,
    inputEmail,
    setInputEmail,
    inputCode,
    setInputCode,
    hintCode,
    setHintCode,
    loadingActivation,
    copiedId,
    loadLicense,
    handleRequestCode,
    handleVerifyCode,
    handleStoreActivation,
    handleLogout,
    handleCopyMachineId,
  };
};
