import React, { useState, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Database, Download, Upload, RotateCcw, CheckCircle, Clock, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface BackupModalProps {
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ onClose }) => {
  const { data, triggerBackup, exportDatabaseToJson, importDatabaseFromJson, resetToDemoData } = useSchool();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualBackup = () => {
    const snap = triggerBackup('manual');
    setStatusMessage({
      type: 'success',
      text: `Backup snapshot (${snap.id}) generated successfully! Size: ${snap.sizeKb} KB.`,
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleDownload = () => {
    const jsonStr = exportDatabaseToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text: 'Complete database export downloaded successfully.',
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importDatabaseFromJson(content);
      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: 'Database successfully restored from JSON file.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to restore database.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Reset database to clean initial school demo data? Current edits will be replaced.')) {
      resetToDemoData();
      setStatusMessage({
        type: 'success',
        text: 'Database successfully restored to clean demo state.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Automated Backup & Data Management</h3>
              <p className="text-xs text-slate-500">Scheduled snapshots, disaster recovery, and JSON import/export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Feedback banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Cron Schedule Info Box */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Cron Schedule Active
                </span>
              </div>
              <p className="font-mono text-xs text-slate-300">
                schedule = &quot;0 0 * * *&quot; • route = &quot;/api/automatic-backup&quot;
              </p>
              <p className="text-[11px] text-slate-400">
                Daily midnight snapshot active. Last automated backup: {data.lastAutomaticBackupAt ? new Date(data.lastAutomaticBackupAt).toLocaleString() : 'Today'}
              </p>
            </div>

            <button
              onClick={handleManualBackup}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Backup Now
            </button>
          </div>

          {/* Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-700" /> Export Database
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Download all students, marks, locked teacher sheets, and attendance records as a standalone JSON file.
                </p>
              </div>
              <button
                onClick={handleDownload}
                className="mt-4 w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Download JSON Backup
              </button>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-slate-700" /> Restore Database
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a previously exported JSON backup file to restore the entire school registry instantly.
                </p>
              </div>
              <div>
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Upload JSON File
                </button>
              </div>
            </div>
          </div>

          {/* Snapshot History */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent Backup Snapshots
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs max-h-40 overflow-y-auto">
              {data.backupSnapshots.length === 0 ? (
                <div className="p-3 text-center text-slate-400">No snapshots recorded yet.</div>
              ) : (
                data.backupSnapshots.map((snap) => (
                  <div key={snap.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-mono font-medium text-slate-800">
                          {new Date(snap.timestamp).toLocaleString()}
                        </span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                          {snap.trigger === 'automatic_cron' ? 'Cron (0 0 * * *)' : 'Manual'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-slate-500 font-mono">
                      <span>{snap.sizeKb} KB</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Danger Zone: Reset to Clean Initial Data */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to start fresh with clean sample records?</span>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo School
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
