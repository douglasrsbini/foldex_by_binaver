import { LicenseInfo } from '../types';

export const ADMIN_BYPASS_EMAILS = [
  'douglasrsbini@gmail.com',
  'averleonardo@gmail.com',
] as const;

export const isAdminEmail = (email: string): boolean => {
  const normalizedEmail = email.trim().toLowerCase();
  return ADMIN_BYPASS_EMAILS.includes(normalizedEmail as (typeof ADMIN_BYPASS_EMAILS)[number]);
};

export const createAdminLicense = (email: string): LicenseInfo => ({
  is_activated: true,
  user_email: email.trim(),
  license_key: 'ADMIN-BYPASS-MASTER-KEY',
  machine_id: 'admin-override',
  plan_name: 'Binaver Enterprise Master Full',
  max_rules: 999999,
  is_sentinel_allowed: true,
  source_channel: 'ADMIN_BYPASS',
  expires_at: '2099-12-31',
});
