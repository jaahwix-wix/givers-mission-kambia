import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { GradeEntry, TeacherSubmission, AttendanceRecord, AttendanceStatus } from '../types';
import { computeGrade } from '../utils/grading';
import {
  BookOpen,
  CalendarCheck,
  Lock,
  CheckCircle,
  Save,
  AlertCircle,
  UserCheck,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const TeacherPortal: React.FC = () => {
  const {
    data,
    activeSemester,
    selectedTeacherId,
    setSelectedTeacherId,
    saveSubmissionDraft,
    lockSubmission,
    saveAttendance,
    hasPrivilege,
    setIsAuthModalOpen,
    setAuthTargetRole,
    currentSession,
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'gradebook' | 'attendance'>('gradebook');

  // Privilege Guard: If not teacher or admin, require teacher authentication
  if (!hasPrivilege('teacher')) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center mx-auto border border-sky-200">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Faculty Instructor Privileges Required</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The Teacher Gradebook and Classroom Register portal requires authorized faculty credentials to grade students, submit immutable marks, and mark attendance.
        </p>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono">
          Current Session: {currentSession.name} ({currentSession.identifier})
        </div>
        <button
          onClick={() => {
            setAuthTargetRole('teacher');
            setIsAuthModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
        >
          <Lock className="w-4 h-4 text-sky-400" />
          Authenticate as Faculty Teacher
        </button>
      </div>
    );
  }

  // Active Teacher
  const currentTeacher = data.teachers.find((t) => t.id === selectedTeacherId) || data.teachers[0];

  // Subject & Class Selection
  const assigned = currentTeacher?.assignedSubjects || [];
  const [selectedClassId, setSelectedClassId] = useState<string>(assigned[0]?.classId || data.classes[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(assigned[0]?.subjectId || data.subjects[0]?.id || '');

  // Keep selection in sync when teacher changes
  useEffect(() => {
    if (assigned.length > 0) {
      setSelectedClassId(assigned[0].classId);
      setSelectedSubjectId(assigned[0].subjectId);
    }
  }, [selectedTeacherId]);

  // Find students in this class
  const classStudents = data.students.filter((s) => s.classId === selectedClassId);

  // Find existing submission or initialize draft
  const existingSubmission = data.submissions.find(
    (s) =>
      s.classId === selectedClassId &&
      s.subjectId === selectedSubjectId &&
      s.semester === activeSemester &&
      s.academicYear === data.academicYear,
  );

  // Local state for grade entries
  const [records, setRecords] = useState<GradeEntry[]>([]);
  const [confirmLockModalOpen, setConfirmLockModalOpen] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Initialize or update records when submission or students change
  useEffect(() => {
    if (existingSubmission) {
      // Ensure all current class students exist in records
      const mergedRecords = classStudents.map((student) => {
        const found = existingSubmission.records.find((r) => r.studentId === student.id);
        if (found) return found;
        return {
          studentId: student.id,
          caScore: 0,
          examScore: 0,
          total: 0,
          ...computeGrade(0),
        };
      });
      setRecords(mergedRecords);
    } else {
      // New draft
      const newRecords = classStudents.map((student) => ({
        studentId: student.id,
        caScore: 0,
        examScore: 0,
        total: 0,
        ...computeGrade(0),
      }));
      setRecords(newRecords);
    }
  }, [existingSubmission?.id, selectedClassId, selectedSubjectId, activeSemester, classStudents.length]);

  const isLocked = existingSubmission?.isLocked || false;

  const handleScoreChange = (studentId: string, field: 'caScore' | 'examScore', val: number) => {
    if (isLocked) return;
    const cleanVal = isNaN(val) ? 0 : Math.max(0, val);
    const maxVal = field === 'caScore' ? 30 : 70;
    const clamped = Math.min(cleanVal, maxVal);

    setRecords((prev) =>
      prev.map((r) => {
        if (r.studentId === studentId) {
          const ca = field === 'caScore' ? clamped : r.caScore;
          const exam = field === 'examScore' ? clamped : r.examScore;
          const total = ca + exam;
          const gradeInfo = computeGrade(total);
          return {
            ...r,
            caScore: ca,
            examScore: exam,
            total,
            ...gradeInfo,
          };
        }
        return r;
      }),
    );
  };

  const handleSaveDraft = () => {
    const submissionId = existingSubmission?.id || `subm-${selectedClassId}-${selectedSubjectId}-${activeSemester.toLowerCase().replace(' ', '')}`;
    const newSubmission: TeacherSubmission = {
      id: submissionId,
      classId: selectedClassId,
      subjectId: selectedSubjectId,
      teacherId: currentTeacher.id,
      semester: activeSemester,
      academicYear: data.academicYear,
      records,
      isLocked: false,
      status: 'draft',
    };
    saveSubmissionDraft(newSubmission);
    setSaveToast('Draft saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleConfirmLock = () => {
    const submissionId = existingSubmission?.id || `subm-${selectedClassId}-${selectedSubjectId}-${activeSemester.toLowerCase().replace(' ', '')}`;
    // First save draft if new
    if (!existingSubmission) {
      const newSubmission: TeacherSubmission = {
        id: submissionId,
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        teacherId: currentTeacher.id,
        semester: activeSemester,
        academicYear: data.academicYear,
        records,
        isLocked: false,
        status: 'draft',
      };
      saveSubmissionDraft(newSubmission);
    }
    // Now lock
    lockSubmission(submissionId);
    setConfirmLockModalOpen(false);
    setSaveToast('Submission locked & sealed with cryptographic verification hash!');
    setTimeout(() => setSaveToast(null), 4000);
  };

  // ATTENDANCE STATE
  const [attendanceDate, setAttendanceDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const existingAttendance = data.attendance.find(
    (a) => a.date === attendanceDate && a.classId === selectedClassId && a.semester === activeSemester,
  );

  const [dailyAttendance, setDailyAttendance] = useState<{ [studentId: string]: { status: AttendanceStatus; note: string } }>({});

  useEffect(() => {
    const initial: { [studentId: string]: { status: AttendanceStatus; note: string } } = {};
    classStudents.forEach((s) => {
      const rec = existingAttendance?.records.find((r) => r.studentId === s.id);
      initial[s.id] = {
        status: rec?.status || 'Present',
        note: rec?.note || '',
      };
    });
    setDailyAttendance(initial);
  }, [attendanceDate, selectedClassId, activeSemester, existingAttendance?.id]);

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: { [studentId: string]: { status: AttendanceStatus; note: string } } = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status,
        note: dailyAttendance[s.id]?.note || '',
      };
    });
    setDailyAttendance(updated);
  };

  const handleSaveAttendance = () => {
    const recordList = classStudents.map((s) => ({
      studentId: s.id,
      status: dailyAttendance[s.id]?.status || 'Present',
      note: dailyAttendance[s.id]?.note || '',
    }));

    const attendanceRecord: AttendanceRecord = {
      id: existingAttendance?.id || `att-${attendanceDate.replace(/-/g, '')}-${selectedClassId}`,
      date: attendanceDate,
      classId: selectedClassId,
      semester: activeSemester,
      academicYear: data.academicYear,
      records: recordList,
    };

    saveAttendance(attendanceRecord);
    setSaveToast('Classroom attendance successfully registered!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const selectedClass = data.classes.find((c) => c.id === selectedClassId);
  const selectedSubject = data.subjects.find((s) => s.id === selectedSubjectId);

  return (
    <div className="space-y-6">
      {/* Teacher Profile & Scope Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {currentTeacher?.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{currentTeacher?.fullName}</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-700">
                {currentTeacher?.staffId}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department: {currentTeacher?.department} • {assigned.length} Allocated Subjects
            </p>
          </div>
        </div>

        {/* Teacher Switcher (Simulated login for testing all faculty roles) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Switch Instructor:</span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none"
          >
            {data.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Switcher: Gradebook vs Attendance */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'gradebook'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-500" />
          Continuous Assessment & Exam Gradebook
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-emerald-500" />
          Daily Classroom Attendance Register
        </button>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB 1: GRADEBOOK */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          {/* Class & Subject Selector Controls */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                >
                  {data.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Class & Section
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                >
                  {data.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Active Term
                </label>
                <span className="inline-block px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-200 rounded-xl text-slate-800">
                  {activeSemester} • {data.academicYear}
                </span>
              </div>
            </div>

            {/* Submission Actions */}
            <div className="flex items-center gap-2">
              {!isLocked ? (
                <>
                  <button
                    onClick={handleSaveDraft}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Draft
                  </button>
                  <button
                    onClick={() => setConfirmLockModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Submit & Lock (Immutable)
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Immutable Submission Locked
                </div>
              )}
            </div>
          </div>

          {/* Immutable Notice Banner */}
          {isLocked && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">This Gradebook Sheet is Sealed & Immutable</h4>
                  <p className="text-xs text-slate-300">
                    Verification Token: <span className="font-mono text-emerald-300">{existingSubmission?.submissionHash}</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">
                Contact the Exams Office if an authorized revision unlock is required.
              </span>
            </div>
          )}

          {/* Marks Spreadsheet Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-3">Student Name</th>
                    <th className="pb-3 px-3">Student ID</th>
                    <th className="pb-3 px-3 text-center">CA Test (Max 30)</th>
                    <th className="pb-3 px-3 text-center">Final Exam (Max 70)</th>
                    <th className="pb-3 px-3 text-center">Total (100)</th>
                    <th className="pb-3 px-3 text-center">Grade</th>
                    <th className="pb-3 px-3 text-center">Points</th>
                    <th className="pb-3 px-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No students enrolled in {selectedClass?.name}.
                      </td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const student = data.students.find((s) => s.id === r.studentId);
                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50/60">
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {student?.fullName}
                          </td>
                          <td className="py-3 px-3 font-mono text-xs text-slate-500">
                            {student?.studentId}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              disabled={isLocked}
                              value={r.caScore === 0 ? '' : r.caScore}
                              placeholder="0"
                              onChange={(e) =>
                                handleScoreChange(r.studentId, 'caScore', parseInt(e.target.value, 10))
                              }
                              className="w-16 py-1 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="70"
                              disabled={isLocked}
                              value={r.examScore === 0 ? '' : r.examScore}
                              placeholder="0"
                              onChange={(e) =>
                                handleScoreChange(r.studentId, 'examScore', parseInt(e.target.value, 10))
                              }
                              className="w-16 py-1 text-center font-mono font-bold text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-black text-slate-900 text-sm">
                            {r.total}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold px-2 py-0.5 rounded text-xs bg-slate-100 border border-slate-300">
                              {r.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-xs text-slate-700">
                            {r.gradePoint.toFixed(1)}
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-600 font-medium">
                            {r.remarks}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick stats summary */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span>Auto-Grading Rule: Continuous Assessment 30% + Final Exam 70% = Total 100%</span>
              <span>
                Class Average:{' '}
                <strong className="text-slate-800">
                  {records.length > 0
                    ? (records.reduce((acc, curr) => acc + curr.total, 0) / records.length).toFixed(1)
                    : 0}
                  %
                </strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE REGISTER */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                >
                  {data.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Quick Action
                </label>
                <button
                  onClick={() => handleMarkAll('Present')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
                >
                  Mark All Present
                </button>
              </div>
            </div>

            <button
              onClick={handleSaveAttendance}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5" /> Save Attendance Register
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-3">Student Name</th>
                    <th className="pb-3 px-3">Student ID</th>
                    <th className="pb-3 px-3 text-center">Status</th>
                    <th className="pb-3 px-3">Notes / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((s) => {
                    const currentStatus = dailyAttendance[s.id]?.status || 'Present';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-bold text-slate-900">{s.fullName}</td>
                        <td className="py-3 px-3 font-mono text-xs text-slate-500">{s.studentId}</td>
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                            {(['Present', 'Late', 'Absent', 'Excused'] as AttendanceStatus[]).map((status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  setDailyAttendance((prev) => ({
                                    ...prev,
                                    [s.id]: { ...prev[s.id], status },
                                  }))
                                }
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                  currentStatus === status
                                    ? status === 'Present'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : status === 'Late'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : status === 'Absent'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-slate-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Optional note (e.g. excused for athletic event)"
                            value={dailyAttendance[s.id]?.note || ''}
                            onChange={(e) =>
                              setDailyAttendance((prev) => ({
                                ...prev,
                                [s.id]: { ...prev[s.id], note: e.target.value },
                              }))
                            }
                            className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                          />
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

      {/* Confirm Lock & Immutable Submission Modal */}
      {confirmLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                <Lock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Lock Submission & Make Immutable</h3>
                <p className="text-xs text-slate-500">Security Verification Warning</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to submit the marks for <strong>{selectedSubject?.name}</strong> (
              <strong>{selectedClass?.name}</strong>)?
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-700" /> Once Locked:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700">
                <li>Scores cannot be edited by teachers.</li>
                <li>A cryptographic verification hash is attached to prevent tampering.</li>
                <li>Only the Exams Office can authorize formal revisions.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmLockModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel & Keep Editing
              </button>
              <button
                onClick={handleConfirmLock}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer shadow-xs"
              >
                Yes, Seal & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
