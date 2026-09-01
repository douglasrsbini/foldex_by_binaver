import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { HardDrive, LoaderCircle, ScanSearch, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { StorageHealthReport } from '../types';

interface StorageHealthPanelProps {
  accentColor: string;
}

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

export const StorageHealthPanel: React.FC<StorageHealthPanelProps> = ({ accentColor }) => {
  const [report, setReport] = useState<StorageHealthReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanFolder = async () => {
    const selected = await open({ directory: true, multiple: false, title: 'Escolher pasta para análise de armazenamento' });
    if (typeof selected !== 'string') return;

    setError(null);
    setIsScanning(true);
    try {
      const result = await invoke<StorageHealthReport>('scan_storage_health_command', { path: selected });
      setReport(result ?? null);
    } catch (reason) {
      setError(String(reason));
      setReport(null);
    } finally {
      setIsScanning(false);
    }
  };

  const fixIssues = async (kind: 'duplicates' | 'junk') => {
    if (!report) return;
    const paths = kind === 'duplicates'
      ? (report.duplicate_groups ?? []).flatMap((group) => group?.duplicate_paths ?? [])
      : (report.junk_files ?? []).map((file) => file?.path).filter((path): path is string => Boolean(path));
    if (paths.length === 0) return;

    const label = kind === 'duplicates' ? 'duplicatas' : 'arquivos temporários/lixo';
    if (!window.confirm(`Remover permanentemente ${paths.length} ${label}? Esta ação não pode ser desfeita.`)) return;

    setError(null);
    setIsFixing(true);
    try {
      await invoke<number>('fix_storage_issues_command', { paths });
      setReport((current) => current ? {
        ...current,
        duplicate_groups: kind === 'duplicates' ? [] : current.duplicate_groups ?? [],
        duplicate_wasted_bytes: kind === 'duplicates' ? 0 : current.duplicate_wasted_bytes ?? 0,
        junk_files: kind === 'junk' ? [] : current.junk_files ?? [],
        junk_total_bytes: kind === 'junk' ? 0 : current.junk_total_bytes ?? 0,
      } : current);
    } catch (reason) {
      setError(String(reason));
    } finally {
      setIsFixing(false);
    }
  };

  const duplicateBytes = report?.duplicate_wasted_bytes ?? 0;
  const junkBytes = report?.junk_total_bytes ?? 0;

  return (
    <section className="rounded-2xl border border-white/50 bg-white/55 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5 text-white shadow-lg" style={{ backgroundColor: accentColor }}>
            <HardDrive size={19} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Saúde do Armazenamento</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Encontre duplicatas e arquivos descartáveis em uma pasta.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={scanFolder}
          disabled={isScanning || isFixing}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-md transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {isScanning ? <LoaderCircle size={15} className="animate-spin" /> : <ScanSearch size={15} />}
          {isScanning ? 'Analisando...' : 'Analisar pasta'}
        </button>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-300">{error}</p>}

      {!report && !isScanning && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <Sparkles size={15} style={{ color: accentColor }} /> Selecione uma pasta para gerar seu relatório de governança.
        </div>
      )}

      {report && (
        <div className="mt-4 space-y-3">
          <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={report.scanned_path}>{report.total_files_scanned ?? 0} arquivos analisados em {report.scanned_path}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <HealthCard
              title="Duplicatas encontradas"
              value={formatBytes(duplicateBytes)}
              detail={`${(report.duplicate_groups ?? []).length} grupo(s) idêntico(s)`}
              buttonLabel="Remover duplicatas"
              disabled={duplicateBytes === 0 || isFixing}
              onClick={() => fixIssues('duplicates')}
              icon={<ShieldCheck size={17} />}
              accentColor={accentColor}
            />
            <HealthCard
              title="Arquivos descartáveis"
              value={formatBytes(junkBytes)}
              detail={`${(report.junk_files ?? []).length} arquivo(s) candidato(s)`}
              buttonLabel="Limpar arquivos"
              disabled={junkBytes === 0 || isFixing}
              onClick={() => fixIssues('junk')}
              icon={<Trash2 size={17} />}
              accentColor={accentColor}
            />
          </div>
        </div>
      )}
    </section>
  );
};

interface HealthCardProps {
  title: string;
  value: string;
  detail: string;
  buttonLabel: string;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  accentColor: string;
}

const HealthCard: React.FC<HealthCardProps> = ({ title, value, detail, buttonLabel, disabled, onClick, icon, accentColor }) => (
  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
        <p className="mt-1 text-lg font-black text-slate-800 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
      <span className="rounded-lg bg-white p-2 shadow-sm dark:bg-slate-900" style={{ color: accentColor }}>{icon}</span>
    </div>
    <button type="button" onClick={onClick} disabled={disabled} className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
      {disabled ? 'Nenhuma ação pendente' : buttonLabel}
    </button>
  </div>
);
