import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Navbar } from './components/Navbar';
import { ExamsOfficePortal } from './components/ExamsOfficePortal';
import { TeacherPortal } from './components/TeacherPortal';
import { StudentPortal } from './components/StudentPortal';
import { BackupModal } from './components/BackupModal';
import { PinCardModal } from './components/PinCardModal';
import { AuthModal } from './components/AuthModal';
import { ShieldCheck, Database, Lock } from 'lucide-react';

function SchoolApp() {
  const { currentRole, data, activeSemester, isAuthModalOpen, setIsAuthModalOpen } = useSchool();
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [pinCardModalOpen, setPinCardModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      {/* Top Academic Navigation Bar */}
      <Navbar
        onOpenBackup={() => setBackupModalOpen(true)}
        onOpenPinCards={() => setPinCardModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'exams_office' && <ExamsOfficePortal />}
        {currentRole === 'teacher' && <TeacherPortal />}
        {currentRole === 'parent_student' && <StudentPortal />}
      </main>

      {/* Clean Academic Footer - No Third-Party Branding or Banners */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">{data.schoolName}</span>
            <span>• Academic Session {data.academicYear} ({activeSemester})</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" /> Immutable Submissions Active
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-emerald-500" /> Automated Backup: Daily 0 0 * * *
            </span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {backupModalOpen && <BackupModal onClose={() => setBackupModalOpen(false)} />}
      {pinCardModalOpen && <PinCardModal onClose={() => setPinCardModalOpen(false)} />}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <SchoolProvider>
      <SchoolApp />
    </SchoolProvider>
  );
}
