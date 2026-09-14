import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';
import {
  Search,
  KeyRound,
  Award,
  CheckCircle,
  CalendarCheck,
  Printer,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ReportCardModal } from './ReportCardModal';
import { formatOrdinal } from '../utils/grading';

export const StudentPortal: React.FC = () => {
  const { data, activeSemester, setActiveSemester } = useSchool();

  const [studentIdInput, setStudentIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authenticatedStudent, setAuthenticatedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Quick Demo Auto-fill
  const handleSelectDemoStudent = (stu: Student) => {
    setStudentIdInput(stu.studentId);
    setPinInput(stu.pin);
    setErrorMessage(null);
    setAuthenticatedStudent(stu);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = studentIdInput.trim().toUpperCase();
    const cleanPin = pinInput.trim().toUpperCase();

    const matched = data.students.find(
      (s) =>
        s.studentId.toUpperCase() === cleanId &&
        s.pin.toUpperCase() === cleanPin,
    );

    if (matched) {
      setAuthenticatedStudent(matched);
    } else {
      setErrorMessage('Invalid Student ID or PIN. Please check your credentials issued by the Exams Office.');
    }
  };

  const studentClass = data.classes.find((c) => c.id === authenticatedStudent?.classId);
  const parent = data.parents.find((p) => p.id === authenticatedStudent?.parentId);

  // Calculate results for the authenticated student
  const classSubmissions = authenticatedStudent
    ? data.submissions.filter(
        (sub) =>
          sub.classId === authenticatedStudent.classId &&
          sub.semester === activeSemester &&
          sub.status !== 'draft',
      )
    : [];

  const subjectResults = classSubmissions
    .map((sub) => {
      const subject = data.subjects.find((s) => s.id === sub.subjectId);
      const record = sub.records.find((r) => r.studentId === authenticatedStudent?.id);
      if (!subject || !record) return null;
      return { subject, record };
    })
    .filter(Boolean) as {
    subject: (typeof data.subjects)[0];
    record: NonNullable<(typeof classSubmissions)[0]['records'][0]>;
  }[];

  // Overall calculations
  const totalScoreSum = subjectResults.reduce((acc, curr) => acc + curr.record.total, 0);
  const totalCredits = subjectResults.reduce((acc, curr) => acc + curr.subject.creditUnits, 0);
  const weightedPoints = subjectResults.reduce((acc, curr) => acc + curr.record.gradePoint * curr.subject.creditUnits, 0);

  const averageScore = subjectResults.length > 0 ? (totalScoreSum / subjectResults.length).toFixed(1) : '0.0';
  const gpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : '0.00';

  // Attendance for student
  const classAttendance = authenticatedStudent
    ? data.attendance.filter((a) => a.classId === authenticatedStudent.classId && a.semester === activeSemester)
    : [];
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  let daysExcused = 0;

  classAttendance.forEach((att) => {
    const rec = att.records.find((r) => r.studentId === authenticatedStudent?.id);
    if (rec) {
      if (rec.status === 'Present') daysPresent++;
      else if (rec.status === 'Absent') daysAbsent++;
      else if (rec.status === 'Late') daysLate++;
      else if (rec.status === 'Excused') daysExcused++;
    }
  });

  const totalDays = classAttendance.length || 0;
  const attendanceRate = totalDays > 0 ? (((daysPresent + daysLate) / totalDays) * 100).toFixed(1) : '100.0';

  // Rank in class
  const classStudents = authenticatedStudent ? data.students.filter((s) => s.classId === authenticatedStudent.classId) : [];
  const classStudentTotals = classStudents.map((stu) => {
    let sum = 0;
    let count = 0;
    classSubmissions.forEach((sub) => {
      const rec = sub.records.find((r) => r.studentId === stu.id);
      if (rec) {
        sum += rec.total;
        count++;
      }
    });
    return {
      studentId: stu.id,
      average: count > 0 ? sum / count : 0,
    };
  });
  classStudentTotals.sort((a, b) => b.average - a.average);
  const overallRank = classStudentTotals.findIndex((item) => item.studentId === authenticatedStudent?.id) + 1;

  return (
    <div className="space-y-6">
      {/* Search & Authentication Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <KeyRound className="w-6 h-6 text-emerald-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Student & Parent Result Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter the Student ID and Secret PIN printed on your official Student Access Card to view your terminal result slip.
          </p>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Student ID (e.g. STU-2026-0101)"
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="relative sm:w-44">
              <input
                type="text"
                placeholder="PIN (e.g. PIN-842915)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                required
                className="w-full px-4 py-3 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 font-bold text-sm text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              Access Results
            </button>
          </form>

          {errorMessage && (
            <p className="text-xs text-rose-600 font-semibold mt-2">{errorMessage}</p>
          )}

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test: Click any student profile to auto-fill credentials:
            </span>
            <div className="flex flex-wrap gap-2">
              {data.students.slice(0, 5).map((stu) => (
                <button
                  key={stu.id}
                  onClick={() => handleSelectDemoStudent(stu)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    authenticatedStudent?.id === stu.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {stu.fullName} ({stu.studentId})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Authenticated Results Dashboard */}
      {authenticatedStudent && (
        <div className="space-y-6">
          {/* Student Profile & Result Header Card */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-2xl shrink-0 shadow-md">
                {authenticatedStudent.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black">{authenticatedStudent.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    {studentClass?.name} ({studentClass?.section})
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  ID: {authenticatedStudent.studentId} • Access PIN: {authenticatedStudent.pin}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Parent: {parent?.fullName || 'Registered Parent'} ({parent?.phone || 'No phone'})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setReportModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                View & Print Official Result Slip
              </button>
            </div>
          </div>

          {/* Key Term Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Term Average
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{averageScore}%</span>
              <span className="text-[11px] text-emerald-700 font-medium block mt-0.5">Grade Performance</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cumulative GPA
              </span>
              <span className="text-3xl font-black text-indigo-700 mt-1 block">
                {gpa} <span className="text-xs font-normal text-slate-400">/ 4.0</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">Standard 4.0 Scale</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Class Position
              </span>
              <span className="text-3xl font-black text-emerald-700 mt-1 block">
                {formatOrdinal(overallRank || 1)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                Out of {classStudents.length} students
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Attendance Rate
              </span>
              <span className="text-3xl font-black text-slate-900 mt-1 block">{attendanceRate}%</span>
              <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                {daysPresent} of {totalDays} Days Present
              </span>
            </div>
          </div>

          {/* Subject Grades Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Subject Performance Breakdown ({activeSemester})
                </h4>
                <p className="text-xs text-slate-500">
                  Continuous Assessment (CA) and Final Examination scores ratified by the Exams Office
                </p>
              </div>

              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setActiveSemester('Semester 1')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    activeSemester === 'Semester 1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semester 1
                </button>
                <button
                  onClick={() => setActiveSemester('Semester 2')}
                  className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    activeSemester === 'Semester 2' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Semester 2
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="pb-3 px-3">Subject Name</th>
                    <th className="pb-3 px-2 text-center">Unit</th>
                    <th className="pb-3 px-2 text-center">CA Test (30)</th>
                    <th className="pb-3 px-2 text-center">Exam (70)</th>
                    <th className="pb-3 px-2 text-center">Total (100)</th>
                    <th className="pb-3 px-2 text-center">Grade</th>
                    <th className="pb-3 px-2 text-center">Points</th>
                    <th className="pb-3 px-3">Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjectResults.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No approved marks released yet for {activeSemester}. Please check with your form teacher.
                      </td>
                    </tr>
                  ) : (
                    subjectResults.map((item) => (
                      <tr key={item.subject.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-3 font-bold text-slate-900">
                          {item.subject.name}
                          <span className="block text-[11px] font-normal text-slate-500 font-mono">
                            {item.subject.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center text-slate-500 font-mono">
                          {item.subject.creditUnits}
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono font-medium">{item.record.caScore}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-medium">{item.record.examScore}</td>
                        <td className="py-3.5 px-2 text-center font-mono font-black text-slate-900 text-base">
                          {item.record.total}
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          <span className="font-bold px-2.5 py-0.5 rounded text-xs bg-slate-100 border border-slate-300">
                            {item.record.grade}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono text-slate-700">
                          {item.record.gradePoint.toFixed(1)}
                        </td>
                        <td className="py-3.5 px-3 text-xs text-slate-600 font-medium">
                          {item.record.remarks}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Terminal Result Slip Modal */}
          {reportModalOpen && (
            <ReportCardModal
              student={authenticatedStudent}
              onClose={() => setReportModalOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
};
