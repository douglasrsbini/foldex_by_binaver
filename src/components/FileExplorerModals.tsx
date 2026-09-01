import React from 'react';
import { AlertTriangle, Eye, EyeOff, FileArchive, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  selectedCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 🗑️ Modal de confirmação de exclusão do Explorador de Arquivos.
 * Extraído de FileExplorer.tsx para reduzir o monólito (diretiva de arquitetura).
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, selectedCount, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-[#202023] w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-[#333338] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center gap-2.5 text-red-500">
          <AlertTriangle size={20} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">{t('explorer.modal_del_title')}</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {t('explorer.modal_del_desc_1')} <strong className="text-red-500">{selectedCount === 1 ? t('explorer.modal_del_item') : `${selectedCount} ${t('explorer.modal_del_items')}`}</strong>{t('explorer.modal_del_desc_2')}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">{t('explorer.btn_cancel')}</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-sm transition-colors">{t('explorer.btn_yes_delete')}</button>
        </div>
      </div>
    </div>
  );
};

interface ZipModalProps {
  isOpen: boolean;
  accentColor: string;
  zipFileName: string;
  setZipFileName: (v: string) => void;
  zipEncrypt: boolean;
  setZipEncrypt: (v: boolean) => void;
  zipPassword: string;
  setZipPassword: (v: string) => void;
  showZipPassword: boolean;
  setShowZipPassword: (v: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 📦 Modal de compactação (ZIP) com proteção por senha opcional.
 * Extraído de FileExplorer.tsx para reduzir o monólito (diretiva de arquitetura).
 */
export const ZipModal: React.FC<ZipModalProps> = ({
  isOpen,
  accentColor,
  zipFileName,
  setZipFileName,
  zipEncrypt,
  setZipEncrypt,
  zipPassword,
  setZipPassword,
  showZipPassword,
  setShowZipPassword,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white dark:bg-[#202023] w-full max-w-sm rounded-3xl p-6 border border-slate-200 dark:border-[#333338] shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-100">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <FileArchive size={16} className="text-amber-500" /> {t('explorer.modal_zip_title')}
        </h3>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{t('explorer.modal_zip_name')}</label>
          <input type="text" value={zipFileName} onChange={(e) => setZipFileName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onConfirm()} autoFocus className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-[#333338] rounded-xl text-slate-800 dark:text-white font-medium outline-none" />
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-[#2e2e34]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold flex items-center gap-2 text-slate-800 dark:text-white"><Lock size={15} className="text-emerald-500" /> {t('explorer.modal_zip_protect')}</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={zipEncrypt} onChange={(e) => setZipEncrypt(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-[#333338] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
          {zipEncrypt && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#2d2d34] relative">
              <input type={showZipPassword ? "text" : "password"} placeholder={t('explorer.modal_zip_pass_ph')} value={zipPassword} onChange={(e) => setZipPassword(e.target.value)} className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-[#202024] border border-slate-200 dark:border-[#383840] rounded-xl outline-none font-mono focus:ring-1 focus:ring-emerald-500 transition-shadow" />
              <button type="button" onClick={() => setShowZipPassword(!showZipPassword)} className="absolute right-3 top-[22px] text-slate-400 hover:text-emerald-500 transition-colors">
                {showZipPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors">{t('explorer.btn_cancel')}</button>
          <button onClick={onConfirm} className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-sm transition-transform active:scale-95" style={{ backgroundColor: accentColor }}>{t('explorer.btn_compress')}</button>
        </div>
      </div>
    </div>
  );
};
