import React from 'react';
import { useSchool } from '../context/SchoolContext';
import { Semester, UserRole } from '../types';
import {
  GraduationCap,
  ShieldCheck,
  BookOpen,
  UserCheck,
  Search,
  Database,
  KeyRound,
  Calendar,
  Lock,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  onOpenBackup: () => void;
  onOpenPinCards: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenBackup, onOpenPinCards }) => {
  const {
    data,
    currentRole,
    setCurrentRole,
    activeSemester,
    setActiveSemester,
    currentSession,
    logout,
    setIsAuthModalOpen,
    setAuthTargetRole,
    hasPrivilege,
  } = useSchool();

  const handlePortalSwitch = (role: UserRole) => {
    if (role === 'exams_office') {
      if (hasPrivilege('admin')) {
        setCurrentRole('exams_office');
      } else {
        setAuthTargetRole('exams_office');
        setIsAuthModalOpen(true);
      }
    } else if (role === 'teacher') {
      if (hasPrivilege('teacher')) {
        setCurrentRole('teacher');
      } else {
        setAuthTargetRole('teacher');
        setIsAuthModalOpen(true);
      }
    } else {
      setCurrentRole('parent_student');
    }
  };

  const getPrivilegeBadge = () => {
    if (currentSession.privilegeLevel === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Admin Privileges
        </span>
      );
    }
    if (currentSession.privilegeLevel === 'teacher') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 rounded-full">
          <BookOpen className="w-3.5 h-3.5 text-sky-700" />
          Teacher Privileges
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-full">
        <User className="w-3.5 h-3.5 text-slate-500" />
        Student/Parent
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Brand & School Details */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
                  {data.schoolName}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Exams Certified
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Academic Results & Attendance Management System
              </p>
            </div>
          </div>

          {/* Right Tools: Auth Status, Semester Switcher & System Utilities */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Authenticated User & Privilege Badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[130px] sm:max-w-[180px]">
                    {currentSession.name}
                  </span>
                  {getPrivilegeBadge()}
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {currentSession.identifier}
                </span>
              </div>

              <button
                onClick={() => {
                  setAuthTargetRole(currentRole);
                  setIsAuthModalOpen(true);
                }}
                className="ml-1 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
                title="Authenticate with different credentials"
              >
                Switch / Log In
              </button>

              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Sign Out / Lock Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Semester Switcher */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <span className="hidden sm:flex items-center gap-1 px-2 text-xs font-semibold text-slate-500">
                <Calendar className="w-3.5 h-3.5" /> {data.academicYear}
              </span>
              <button
                onClick={() => setActiveSemester('Semester 1')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSemester === 'Semester 1'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 1
              </button>
              <button
                onClick={() => setActiveSemester('Semester 2')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeSemester === 'Semester 2'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semester 2
              </button>
            </div>

            {/* Print PIN Cards Button */}
            <button
              onClick={onOpenPinCards}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Issue and Print Student ID & PIN Cards"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">PIN Cards</span>
            </button>

            {/* Automated Backup Button */}
            <button
              onClick={onOpenBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs"
              title="Automated Backup Status & Exports"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Backup</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          </div>
        </div>

        {/* Portal View Tabs with Privilege Enforcement */}
        <div className="flex border-t border-slate-200 mt-1">
          <nav className="flex space-x-1 sm:space-x-4 py-2" aria-label="Portals">
            <button
              onClick={() => handlePortalSwitch('exams_office')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentRole === 'exams_office'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Exams Office Portal
              {!hasPrivilege('admin') && (
                <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handlePortalSwitch('teacher')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentRole === 'teacher'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              Teacher Gradebook & Register
              {!hasPrivilege('teacher') && (
                <Lock className="w-3 h-3 text-slate-400 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => handlePortalSwitch('parent_student')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                currentRole === 'parent_student'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4 text-amber-400" />
              Student & Parent Search
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

