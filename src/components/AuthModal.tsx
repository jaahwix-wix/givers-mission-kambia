import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { UserRole } from '../types';
import {
  ShieldCheck,
  BookOpen,
  User,
  KeyRound,
  Lock,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { data, login, authTargetRole, setAuthTargetRole, currentSession } = useSchool();

  const [activeTab, setActiveTab] = useState<UserRole>(authTargetRole || 'exams_office');

  // Exams Office Inputs
  const [adminId, setAdminId] = useState('EXAM-ADMIN-01');
  const [adminPassword, setAdminPassword] = useState('Admin@2026');

  // Teacher Inputs
  const [selectedTeacherStaffId, setSelectedTeacherStaffId] = useState(
    data.teachers[0]?.staffId || 'STAFF-MTH-01',
  );
  const [teacherPassword, setTeacherPassword] = useState('Staff@2026');

  // Student Inputs
  const [studentId, setStudentId] = useState(data.students[0]?.studentId || 'STU-2026-0101');
  const [studentPin, setStudentPin] = useState(data.students[0]?.pin || 'PIN-842915');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(authTargetRole);
  }, [authTargetRole]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let res: { success: boolean; error?: string };

    if (activeTab === 'exams_office') {
      res = login('exams_office', adminId, adminPassword);
    } else if (activeTab === 'teacher') {
      res = login('teacher', selectedTeacherStaffId, teacherPassword);
    } else {
      res = login('parent_student', studentId, studentPin);
    }

    if (!res.success) {
      setErrorMsg(res.error || 'Authentication failed. Please check credentials.');
    }
  };

  const handleQuickStudentSelect = (stu: (typeof data.students)[0]) => {
    setStudentId(stu.studentId);
    setStudentPin(stu.pin);
    setErrorMsg(null);
  };

  const currentSelectedTeacher = data.teachers.find(
    (t) => t.staffId === selectedTeacherStaffId,
  ) || data.teachers[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Authentication</h3>
              <p className="text-xs text-slate-300">Privilege-Based Role Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('exams_office');
              setAuthTargetRole('exams_office');
              setErrorMsg(null);
            }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'exams_office'
                ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Exams Office</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('teacher');
              setAuthTargetRole('teacher');
              setErrorMsg(null);
            }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Faculty Teacher</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('parent_student');
              setAuthTargetRole('parent_student');
              setErrorMsg(null);
            }}
            className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'parent_student'
                ? 'border-slate-900 text-slate-900 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Student/Parent</span>
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: EXAMS OFFICE */}
          {activeTab === 'exams_office' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" /> Administrator Privileges Obtained:
                </span>
                <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5">
                  <li>Full results ratification and immutable marks locking.</li>
                  <li>Formal revision unlock audit trail authority.</li>
                  <li>Student registry enrollment and PIN generation.</li>
                  <li>System backup snapshots and database restoration.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exams Officer Staff ID / Username
                </label>
                <input
                  type="text"
                  required
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Default Demo ID: <code className="font-bold text-slate-700">EXAM-ADMIN-01</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Access Key / Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* TAB 2: FACULTY TEACHER */}
          {activeTab === 'teacher' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-700" /> Faculty Instructor Privileges Obtained:
                </span>
                <ul className="list-disc list-inside text-[11px] text-sky-800 space-y-0.5">
                  <li>Grade Continuous Assessment (30) & Final Exam (70).</li>
                  <li>Cryptographically submit and seal marks sheets.</li>
                  <li>Mark daily classroom attendance registers.</li>
                  <li>Restricted strictly to assigned subjects and classes.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Faculty Instructor Profile
                </label>
                <select
                  value={selectedTeacherStaffId}
                  onChange={(e) => setSelectedTeacherStaffId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {data.teachers.map((t) => (
                    <option key={t.id} value={t.staffId}>
                      {t.fullName} ({t.staffId} • {t.department})
                    </option>
                  ))}
                </select>
              </div>

              {currentSelectedTeacher && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                  <span className="font-bold text-slate-800 block mb-0.5">Assigned Teaching Scope:</span>
                  {currentSelectedTeacher.assignedSubjects.map((sub, idx) => {
                    const subjectObj = data.subjects.find((s) => s.id === sub.subjectId);
                    const classObj = data.classes.find((c) => c.id === sub.classId);
                    return (
                      <span key={idx} className="inline-block mr-2 text-slate-700">
                        • {subjectObj?.name} ({classObj?.name})
                      </span>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Faculty Password
                </label>
                <input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* TAB 3: STUDENT & PARENT */}
          {activeTab === 'parent_student' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <User className="w-4 h-4 text-indigo-700" /> Student & Parent Privileges Obtained:
                </span>
                <ul className="list-disc list-inside text-[11px] text-indigo-800 space-y-0.5">
                  <li>View terminal scores, subject grades, and class rank.</li>
                  <li>Inspect classroom attendance percentages and history.</li>
                  <li>Generate and print official certified Report Cards.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student ID Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STU-2026-0101"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confidential Access PIN
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PIN-842915"
                  value={studentPin}
                  onChange={(e) => setStudentPin(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  1-Click Demo Profiles:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {data.students.slice(0, 4).map((stu) => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleQuickStudentSelect(stu)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                        studentId === stu.studentId
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {stu.fullName.split(' ')[0]} ({stu.studentId})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Current: <strong className="text-slate-800">{currentSession.name}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Obtain Privileges & Sign In
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
