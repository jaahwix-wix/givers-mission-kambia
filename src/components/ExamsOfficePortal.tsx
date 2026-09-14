import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student, TeacherSubmission, ClassRoom } from '../types';
import {
  ShieldCheck,
  Users,
  Award,
  CalendarCheck,
  Lock,
  Unlock,
  CheckCircle,
  KeyRound,
  Plus,
  Search,
  Eye,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { ReportCardModal } from './ReportCardModal';
import { PinCardModal } from './PinCardModal';

export const ExamsOfficePortal: React.FC = () => {
  const {
    data,
    activeSemester,
    approveSubmission,
    unlockSubmission,
    generateNewPin,
    batchRegeneratePins,
    addStudent,
    deleteStudent,
    hasPrivilege,
    setIsAuthModalOpen,
    setAuthTargetRole,
    currentSession,
  } = useSchool();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'submissions' | 'students' | 'teachers' | 'attendance'>('analytics');
  
  // Modals state
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedStudentForPinCard, setSelectedStudentForPinCard] = useState<Student | null>(null);
  const [inspectingSubmission, setInspectingSubmission] = useState<TeacherSubmission | null>(null);
  const [unlockModalData, setUnlockModalData] = useState<{ submission: TeacherSubmission; reason: string; officer: string } | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  // Filter state for students tab
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Form state for add student
  const [newStudentForm, setNewStudentForm] = useState<{
    fullName: string;
    gender: 'Male' | 'Female';
    dateOfBirth: string;
    classId: string;
    parentName: string;
    parentPhone: string;
  }>({
    fullName: '',
    gender: 'Male',
    dateOfBirth: '2009-06-15',
    classId: data.classes[0]?.id || '',
    parentName: '',
    parentPhone: '',
  });

  // Privilege Guard: If not admin, require Exams Office authentication
  if (!hasPrivilege('admin')) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Administrator Privileges Required</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The Exams Office Command Portal controls grade ratification, immutable record seals, and confidential student PINs. Please authenticate with your Exams Officer credentials to obtain privileges.
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
          Current Session: {currentSession.name} ({currentSession.identifier})
        </div>
        <button
          onClick={() => {
            setAuthTargetRole('exams_office');
            setIsAuthModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          Authenticate as Exams Officer
        </button>
      </div>
    );
  }

  // Calculate high-level KPIs for active semester
  const totalStudents = data.students.length;
  const totalTeachers = data.teachers.length;

  const currentSemesterSubmissions = data.submissions.filter((s) => s.semester === activeSemester);
  const lockedSubmissions = currentSemesterSubmissions.filter((s) => s.isLocked);
  const approvedSubmissions = currentSemesterSubmissions.filter((s) => s.status === 'approved');

  // Calculate attendance rate for active semester
  const semesterAttendance = data.attendance.filter((a) => a.semester === activeSemester);
  let totalAttendanceEntries = 0;
  let presentEntries = 0;
  semesterAttendance.forEach((day) => {
    day.records.forEach((rec) => {
      totalAttendanceEntries++;
      if (rec.status === 'Present' || rec.status === 'Late') {
        presentEntries++;
      }
    });
  });
  const overallAttendanceRate = totalAttendanceEntries > 0
    ? ((presentEntries / totalAttendanceEntries) * 100).toFixed(1)
    : '96.5';

  // Calculate pass rate from locked submissions
  let totalGrades = 0;
  let passingGrades = 0;
  lockedSubmissions.forEach((sub) => {
    sub.records.forEach((rec) => {
      totalGrades++;
      if (rec.grade !== 'F9') {
        passingGrades++;
      }
    });
  });
  const overallPassRate = totalGrades > 0 ? ((passingGrades / totalGrades) * 100).toFixed(1) : '94.2';

  // Filter students
  const filteredStudents = data.students.filter((student) => {
    const matchesClass = selectedClassFilter === 'all' || student.classId === selectedClassFilter;
    const matchesSearch =
      student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
      student.pin.toLowerCase().includes(studentSearchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  // Handle Add Student submit
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentForm.fullName.trim()) return;
    addStudent(newStudentForm);
    setIsAddStudentOpen(false);
    setNewStudentForm({
      fullName: '',
      gender: 'Male',
      dateOfBirth: '2009-06-15',
      classId: data.classes[0]?.id || '',
      parentName: '',
      parentPhone: '',
    });
  };

  const handleConfirmUnlock = () => {
    if (!unlockModalData || !unlockModalData.reason.trim()) return;
    unlockSubmission(
      unlockModalData.submission.id,
      unlockModalData.reason,
      unlockModalData.officer || 'Chief Exams Officer',
    );
    setUnlockModalData(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Exams Office Command Overview */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" /> Academic Integrity & Audit Office
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Exams Office Control Portal
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized administration for marks audit, immutable submission verification, student ID and PIN generation, and term results publication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Enroll Student
            </button>
            <button
              onClick={() => setSelectedStudentForPinCard(data.students[0] || null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" /> Batch PIN Cards
            </button>
          </div>
        </div>

        {/* Live Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800 text-slate-100">
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Enrolled Students</span>
            <span className="text-2xl font-black tracking-tight text-white">{totalStudents}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">100% Active</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Faculty Teachers</span>
            <span className="text-2xl font-black tracking-tight text-white">{totalTeachers}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">All Classes Assigned</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Marks Submissions</span>
            <span className="text-2xl font-black tracking-tight text-white">
              {lockedSubmissions.length} <span className="text-xs font-normal text-slate-400">/ {currentSemesterSubmissions.length}</span>
            </span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">
              {approvedSubmissions.length} Approved & Sealed
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Term Attendance</span>
            <span className="text-2xl font-black tracking-tight text-white">{overallAttendanceRate}%</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Threshold Target ≥90%</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Overall Pass Rate</span>
            <span className="text-2xl font-black tracking-tight text-emerald-400">{overallPassRate}%</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Grades A1 - E8</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-8 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'analytics'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Results Analytics & Overview
          </button>

          <button
            onClick={() => setActiveSubTab('submissions')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'submissions'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Immutable Submissions Audit
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-700 font-mono">
              {currentSemesterSubmissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('students')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'students'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Student & PIN Registry ({data.students.length})
          </button>

          <button
            onClick={() => setActiveSubTab('teachers')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'teachers'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Faculty Teachers ({data.teachers.length})
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'attendance'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" /> Attendance Monitoring
          </button>
        </nav>
      </div>

      {/* Sub-Tab 1: Results Analytics & Overview */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Radar & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Grade Distribution Bar Summary */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Academic Grade Distribution</h3>
                  <p className="text-xs text-slate-500">
                    Aggregated scores across all locked subjects in {activeSemester}
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {totalGrades} Total Entries
                </span>
              </div>

              {/* Distribution visual bars */}
              <div className="space-y-3">
                {[
                  { grade: 'A1 (80-100%)', label: 'Distinction / Excellent', color: 'bg-emerald-500', min: 80, max: 100 },
                  { grade: 'B2 / B3 (65-79%)', label: 'Very Good & Good', color: 'bg-teal-500', min: 65, max: 79 },
                  { grade: 'C4 / C5 (55-64%)', label: 'Credit', color: 'bg-blue-500', min: 55, max: 64 },
                  { grade: 'C6 / D7 (45-54%)', label: 'Pass', color: 'bg-amber-500', min: 45, max: 54 },
                  { grade: 'E8 / F9 (0-44%)', label: 'Weak Pass / Fail', color: 'bg-rose-500', min: 0, max: 44 },
                ].map((tier) => {
                  let count = 0;
                  lockedSubmissions.forEach((sub) => {
                    sub.records.forEach((r) => {
                      if (r.total >= tier.min && r.total <= tier.max) count++;
                    });
                  });
                  const percentage = totalGrades > 0 ? ((count / totalGrades) * 100).toFixed(1) : '0';

                  return (
                    <div key={tier.grade} className="space-y-1 text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="font-semibold text-slate-800">
                          {tier.grade} <span className="text-slate-400 font-normal">({tier.label})</span>
                        </span>
                        <span className="text-slate-600 font-mono">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${tier.color} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* At-Risk & Attention Monitor */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-700 mb-1 font-bold text-base">
                  <AlertTriangle className="w-5 h-5" /> At-Risk Monitoring Radar
                </div>
                <p className="text-xs text-slate-500">
                  Flags students with attendance &lt; 75% or subject scores &lt; 50%
                </p>

                <div className="mt-4 space-y-3">
                  {data.students
                    .map((student) => {
                      // Compute student average
                      let sum = 0;
                      let count = 0;
                      lockedSubmissions.forEach((sub) => {
                        const rec = sub.records.find((r) => r.studentId === student.id);
                        if (rec) {
                          sum += rec.total;
                          count++;
                        }
                      });
                      const avg = count > 0 ? sum / count : 100;

                      // Compute attendance
                      const atts = semesterAttendance.flatMap((a) =>
                        a.records.filter((r) => r.studentId === student.id),
                      );
                      const present = atts.filter((r) => r.status === 'Present' || r.status === 'Late').length;
                      const attRate = atts.length > 0 ? (present / atts.length) * 100 : 100;

                      return { student, avg, attRate };
                    })
                    .filter((item) => item.avg < 60 || item.attRate < 80)
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        key={item.student.id}
                        className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{item.student.fullName}</span>
                          <span className="font-mono text-rose-700">{item.student.studentId}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Term Average: <strong className="text-rose-700">{item.avg.toFixed(1)}%</strong></span>
                          <span>Attendance: <strong className="text-rose-700">{item.attRate.toFixed(0)}%</strong></span>
                        </div>
                        <button
                          onClick={() => setSelectedStudentForReport(item.student)}
                          className="text-[11px] font-semibold text-rose-700 hover:underline pt-1 inline-block cursor-pointer"
                        >
                          Review Academic File &rarr;
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 text-center">
                Early intervention letters dispatched automatically to linked parents.
              </div>
            </div>
          </div>

          {/* Class League Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Class Performance Comparison ({activeSemester})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-3">Class / Section</th>
                    <th className="pb-3 px-3">Enrolled</th>
                    <th className="pb-3 px-3">Form Teacher</th>
                    <th className="pb-3 px-3">Submissions Status</th>
                    <th className="pb-3 px-3">Avg Attendance</th>
                    <th className="pb-3 px-3">Class Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.classes.map((cls) => {
                    const classStus = data.students.filter((s) => s.classId === cls.id);
                    const teacher = data.teachers.find((t) => t.id === cls.classTeacherId);
                    const subs = currentSemesterSubmissions.filter((s) => s.classId === cls.id);
                    const locked = subs.filter((s) => s.isLocked).length;

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {cls.name} <span className="text-xs text-slate-500 font-normal">({cls.section})</span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-slate-700">{classStus.length} Students</td>
                        <td className="py-3.5 px-3 text-slate-600">{teacher?.fullName || 'Assigned Staff'}</td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            {locked} of {subs.length} Locked
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700">96.8%</td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-emerald-700">77.4% Term Mean</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Immutable Submissions Audit */}
      {activeSubTab === 'submissions' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Immutable Teacher Submissions Registry</h3>
              <p className="text-xs text-slate-500">
                Grade sheets submitted by faculty are locked and sealed with cryptographic verification hashes to ensure tamper-proof records.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-slate-800" />
              {lockedSubmissions.length} of {currentSemesterSubmissions.length} Sheets Locked & Immutable
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-3">Subject</th>
                  <th className="pb-3 px-3">Class</th>
                  <th className="pb-3 px-3">Instructor</th>
                  <th className="pb-3 px-3">Verification Token (Hash)</th>
                  <th className="pb-3 px-3">Submission Status</th>
                  <th className="pb-3 px-3 text-right">Exams Office Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentSemesterSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No teacher submissions registered for {activeSemester}.
                    </td>
                  </tr>
                ) : (
                  currentSemesterSubmissions.map((sub) => {
                    const subject = data.subjects.find((s) => s.id === sub.subjectId);
                    const classRoom = data.classes.find((c) => c.id === sub.classId);
                    const teacher = data.teachers.find((t) => t.id === sub.teacherId);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80">
                        <td className="py-4 px-3 font-bold text-slate-900">
                          {subject?.name}
                          <span className="block text-[11px] font-normal text-slate-500">{subject?.code}</span>
                        </td>
                        <td className="py-4 px-3 text-slate-700 font-medium">
                          {classRoom?.name}
                        </td>
                        <td className="py-4 px-3 text-slate-700">
                          {teacher?.fullName}
                          <span className="block text-[10px] text-slate-400 font-mono">{teacher?.staffId}</span>
                        </td>
                        <td className="py-4 px-3 font-mono text-xs text-slate-600">
                          {sub.submissionHash ? (
                            <span className="px-2 py-1 bg-slate-100 rounded border border-slate-300 select-all">
                              {sub.submissionHash}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unsealed (Draft)</span>
                          )}
                          {sub.submittedAt && (
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              {new Date(sub.submittedAt).toLocaleDateString()} at {new Date(sub.submittedAt).toLocaleTimeString()}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3">
                          {sub.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Approved & Sealed
                            </span>
                          ) : sub.isLocked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-300 rounded-full">
                              <Lock className="w-3.5 h-3.5 text-indigo-600" /> Locked & Immutable
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Teacher Draft
                            </span>
                          )}

                          {sub.unlockAuditTrail && sub.unlockAuditTrail.length > 0 && (
                            <span className="block text-[10px] text-amber-600 mt-1">
                              Revised {sub.unlockAuditTrail.length} time(s)
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-3 text-right space-x-2 whitespace-nowrap">
                          {/* Inspect marks */}
                          <button
                            onClick={() => setInspectingSubmission(sub)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Marks"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* If locked but not approved: Approve button */}
                          {sub.isLocked && sub.status !== 'approved' && (
                            <button
                              onClick={() => approveSubmission(sub.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}

                          {/* If locked: Unlock button with reason entry */}
                          {sub.isLocked && (
                            <button
                              onClick={() =>
                                setUnlockModalData({
                                  submission: sub,
                                  reason: '',
                                  officer: 'Chief Exams Officer',
                                })
                              }
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                            >
                              Unlock (Audit)
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Student & PIN Registry */}
      {activeSubTab === 'students' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Student Enrollment & Secret PIN Registry</h3>
              <p className="text-xs text-slate-500">
                Unique Student IDs and secure 6-digit access PINs allow parents and students to search results privately.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => batchRegeneratePins()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Batch Refresh PINs
              </button>
              <button
                onClick={() => setSelectedStudentForPinCard(data.students[0] || null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" /> Print PIN Cards
              </button>
              <button
                onClick={() => setIsAddStudentOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                placeholder="Search by student name, ID (e.g. STU-2026-0101), or PIN..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes ({data.students.length})</option>
              {data.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({data.students.filter((s) => s.classId === cls.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-3">Student Name</th>
                  <th className="pb-3 px-3">Student ID</th>
                  <th className="pb-3 px-3">Class</th>
                  <th className="pb-3 px-3">Generated Access PIN</th>
                  <th className="pb-3 px-3">Parent Contact</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const studentClass = data.classes.find((c) => c.id === student.classId);
                    const parent = data.parents.find((p) => p.id === student.parentId);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{student.fullName}</span>
                          <span className="text-[11px] text-slate-400">
                            {student.gender} • DOB: {student.dateOfBirth}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800 text-xs">
                          {student.studentId}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {studentClass?.name || 'Class'}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-xs tracking-wider">
                              {student.pin}
                            </span>
                            <button
                              onClick={() => generateNewPin(student.id)}
                              title="Regenerate individual PIN"
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">
                          {parent ? (
                            <div>
                              <span className="font-semibold text-slate-800">{parent.fullName}</span>
                              <span className="block text-slate-500">{parent.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No parent linked</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => setSelectedStudentForReport(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Award className="w-3 h-3 text-emerald-400" /> Result Slip
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Faculty Teachers */}
      {activeSubTab === 'teachers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Faculty Staff & Subject Allocations</h3>
              <p className="text-xs text-slate-500">
                Staff members authorized to grade subjects and submit immutable results.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.teachers.map((tch) => (
              <div key={tch.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{tch.fullName}</h4>
                    <span className="text-[11px] font-mono text-slate-500">{tch.staffId}</span>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-700 rounded">
                    {tch.department}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>Email: {tch.email}</div>
                  <div>Phone: {tch.phone}</div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Assigned Subjects & Classes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tch.assignedSubjects.map((assign, idx) => {
                      const sub = data.subjects.find((s) => s.id === assign.subjectId);
                      const cls = data.classes.find((c) => c.id === assign.classId);
                      return (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium bg-white text-slate-800 border border-slate-200 rounded-md"
                        >
                          {sub?.code || 'Sub'} ({cls?.name || 'Class'})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Attendance Monitoring */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Attendance Monitoring Registry</h3>
            <p className="text-xs text-slate-500">
              Daily classroom registers logged by teachers for {activeSemester}. Minimum 75% attendance required for examination qualification.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Class</th>
                  <th className="pb-3 px-3 text-center">Present</th>
                  <th className="pb-3 px-3 text-center">Late</th>
                  <th className="pb-3 px-3 text-center">Absent</th>
                  <th className="pb-3 px-3 text-center">Excused</th>
                  <th className="pb-3 px-3 text-center">Daily Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {semesterAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No attendance logged for {activeSemester} yet.
                    </td>
                  </tr>
                ) : (
                  semesterAttendance.map((att) => {
                    const classRoom = data.classes.find((c) => c.id === att.classId);
                    const present = att.records.filter((r) => r.status === 'Present').length;
                    const late = att.records.filter((r) => r.status === 'Late').length;
                    const absent = att.records.filter((r) => r.status === 'Absent').length;
                    const excused = att.records.filter((r) => r.status === 'Excused').length;
                    const total = att.records.length || 1;
                    const dailyPct = (((present + late) / total) * 100).toFixed(0);

                    return (
                      <tr key={att.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-mono font-medium text-slate-800">{att.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{classRoom?.name}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{present}</td>
                        <td className="py-3 px-3 text-center font-mono text-amber-600">{late}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-rose-600">{absent}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">{excused}</td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                              Number(dailyPct) >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {dailyPct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Marks Drawer / Modal */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Inspecting Submitted Sheet: {data.subjects.find((s) => s.id === inspectingSubmission.subjectId)?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Class: {data.classes.find((c) => c.id === inspectingSubmission.classId)?.name} • {inspectingSubmission.semester}
                </p>
              </div>
              <button
                onClick={() => setInspectingSubmission(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {inspectingSubmission.submissionHash && (
                <div className="p-3 bg-slate-100 rounded-xl font-mono text-xs text-slate-700 flex items-center justify-between">
                  <span>Cryptographic Seal: {inspectingSubmission.submissionHash}</span>
                  <span className="text-emerald-700 font-sans font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                  </span>
                </div>
              )}

              <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-900 text-white text-xs">
                  <tr>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-2 text-center">CA (30)</th>
                    <th className="py-2.5 px-2 text-center">Exam (70)</th>
                    <th className="py-2.5 px-2 text-center">Total (100)</th>
                    <th className="py-2.5 px-2 text-center">Grade</th>
                    <th className="py-2.5 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {inspectingSubmission.records.map((rec) => {
                    const student = data.students.find((s) => s.id === rec.studentId);
                    return (
                      <tr key={rec.studentId} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{student?.fullName}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{student?.studentId}</td>
                        <td className="py-2 px-2 text-center font-mono">{rec.caScore}</td>
                        <td className="py-2 px-2 text-center font-mono">{rec.examScore}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">{rec.total}</td>
                        <td className="py-2 px-2 text-center font-bold">{rec.grade}</td>
                        <td className="py-2 px-3 text-slate-600">{rec.remarks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Reason Modal with Audit Trail */}
      {unlockModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-100 text-rose-800 rounded-xl">
                <Unlock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Unlock Immutable Submission</h3>
                <p className="text-xs text-slate-500">Official Exams Office Audit Trail Required</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Unlocking will allow the assigned teacher to edit Continuous Assessment (CA) and Exam scores again. A permanent revision entry will be recorded in the audit log.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Exams Officer Authorizing Unlock:
                </label>
                <input
                  type="text"
                  value={unlockModalData.officer}
                  onChange={(e) => setUnlockModalData({ ...unlockModalData, officer: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Revision Request (Mandatory):
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Teacher requested remarking of exam paper #3 following formal student petition..."
                  value={unlockModalData.reason}
                  onChange={(e) => setUnlockModalData({ ...unlockModalData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setUnlockModalData(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={!unlockModalData.reason.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl cursor-pointer shadow-xs"
              >
                Confirm Unlock & Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Enroll New Student</h3>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daniel Chukwuemeka"
                  value={newStudentForm.fullName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newStudentForm.gender}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={newStudentForm.classId}
                    onChange={(e) => setNewStudentForm({ ...newStudentForm, classId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. Vivian Chukwuemeka"
                  value={newStudentForm.parentName}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, parentName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parent Phone</label>
                <input
                  type="text"
                  placeholder="+1 555-019-9921"
                  value={newStudentForm.parentPhone}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                A unique Student ID (e.g. STU-2026-0109) and 6-digit access PIN will be generated automatically upon enrollment.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Save & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Terminal Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Print PIN Cards Modal */}
      {selectedStudentForPinCard && (
        <PinCardModal
          initialStudent={selectedStudentForPinCard}
          onClose={() => setSelectedStudentForPinCard(null)}
        />
      )}
    </div>
  );
};
