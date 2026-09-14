import React from 'react';
import { Student } from '../types';
import { useSchool } from '../context/SchoolContext';
import { computeGrade, formatOrdinal } from '../utils/grading';
import { Printer, X, Award, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReportCardModalProps {
  student: Student;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const { data, activeSemester } = useSchool();

  // Find all subjects and student's grades in active semester
  const studentClass = data.classes.find((c) => c.id === student.classId);
  const classStudents = data.students.filter((s) => s.classId === student.classId);

  // Get all submissions for this class and semester
  const classSubmissions = data.submissions.filter(
    (sub) => sub.classId === student.classId && sub.semester === activeSemester && sub.status !== 'draft',
  );

  // Build subject score list for this student
  const subjectScores = classSubmissions
    .map((sub) => {
      const subject = data.subjects.find((s) => s.id === sub.subjectId);
      const record = sub.records.find((r) => r.studentId === student.id);
      if (!subject || !record) return null;

      // Calculate subject class rank
      const sortedRecords = [...sub.records].sort((a, b) => b.total - a.total);
      const rank = sortedRecords.findIndex((r) => r.studentId === student.id) + 1;
      const classAvg = Math.round(sub.records.reduce((acc, curr) => acc + curr.total, 0) / (sub.records.length || 1));

      return {
        subject,
        record,
        rank,
        classAvg,
      };
    })
    .filter(Boolean) as {
    subject: (typeof data.subjects)[0];
    record: NonNullable<(typeof classSubmissions)[0]['records'][0]>;
    rank: number;
    classAvg: number;
  }[];

  // Calculate overall GPA and Average
  const totalScoreSum = subjectScores.reduce((acc, curr) => acc + curr.record.total, 0);
  const totalCredits = subjectScores.reduce((acc, curr) => acc + curr.subject.creditUnits, 0);
  const weightedPointsSum = subjectScores.reduce((acc, curr) => acc + curr.record.gradePoint * curr.subject.creditUnits, 0);

  const averageScore = subjectScores.length > 0 ? (totalScoreSum / subjectScores.length).toFixed(1) : '0.0';
  const gpa = totalCredits > 0 ? (weightedPointsSum / totalCredits).toFixed(2) : '0.00';

  // Overall class position calculation
  // Compute totals for all students in class
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
  const studentOverallRank = classStudentTotals.findIndex((item) => item.studentId === student.id) + 1;

  // Attendance metrics
  const classAttendanceRecords = data.attendance.filter(
    (a) => a.classId === student.classId && a.semester === activeSemester,
  );
  let daysPresent = 0;
  let daysAbsent = 0;
  let daysLate = 0;
  let daysExcused = 0;

  classAttendanceRecords.forEach((att) => {
    const rec = att.records.find((r) => r.studentId === student.id);
    if (rec) {
      if (rec.status === 'Present') daysPresent++;
      else if (rec.status === 'Absent') daysAbsent++;
      else if (rec.status === 'Late') daysLate++;
      else if (rec.status === 'Excused') daysExcused++;
    }
  });

  const totalSchoolDays = classAttendanceRecords.length || 0;
  const attendancePercentage = totalSchoolDays > 0 ? (((daysPresent + daysLate) / totalSchoolDays) * 100).toFixed(1) : '100.0';

  const handlePrint = () => {
    window.print();
  };

  const parent = data.parents.find((p) => p.id === student.parentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      {/* Container */}
      <div className="relative w-full max-w-4xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Action Header - Hidden during print */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Official Terminal Report Card</h3>
              <p className="text-xs text-slate-500">
                {activeSemester} • {data.academicYear} • Verified Digital Result Slip
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Card Body */}
        <div id="printable-report-card" className="p-8 print:p-6 text-slate-800 bg-white">
          {/* School Header */}
          <div className="flex flex-col items-center text-center pb-6 border-b-2 border-slate-800">
            <div className="w-14 h-14 mb-2 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
              {data.schoolName}
            </h1>
            <p className="text-xs font-semibold tracking-widest text-slate-600 uppercase mt-0.5">
              &ldquo;{data.schoolMotto}&rdquo;
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {data.schoolAddress} • {data.schoolContact}
            </p>
            <div className="mt-3 inline-block px-4 py-1 bg-slate-100 rounded-full border border-slate-300">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Official Terminal Result Slip • {activeSemester.toUpperCase()} ({data.academicYear})
              </span>
            </div>
          </div>

          {/* Student Biographical Data Box */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 mt-6 bg-slate-50 rounded-xl border border-slate-200 text-sm">
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Student Name</span>
              <span className="font-bold text-slate-900">{student.fullName}</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Student ID / Roll</span>
              <span className="font-mono font-bold text-slate-800">{student.studentId}</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Class & Section</span>
              <span className="font-bold text-slate-800">{studentClass?.name || 'Class'} ({studentClass?.section})</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Gender / DOB</span>
              <span className="text-slate-800">{student.gender} • {student.dateOfBirth}</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Parent / Guardian</span>
              <span className="text-slate-800">{parent?.fullName || 'Registered Parent'}</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Class Population</span>
              <span className="text-slate-800 font-semibold">{classStudents.length} Students</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Term Rank / Position</span>
              <span className="font-bold text-emerald-700">{formatOrdinal(studentOverallRank || 1)} in Class</span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Attendance Rate</span>
              <span className="font-bold text-slate-900">{attendancePercentage}% ({daysPresent}/{totalSchoolDays} Days)</span>
            </div>
          </div>

          {/* Subject Performance Table */}
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Subject Name</th>
                  <th className="py-3 px-2 text-center">Unit</th>
                  <th className="py-3 px-2 text-center">CA (30)</th>
                  <th className="py-3 px-2 text-center">Exam (70)</th>
                  <th className="py-3 px-2 text-center">Total (100)</th>
                  <th className="py-3 px-2 text-center">Grade</th>
                  <th className="py-3 px-2 text-center">Points</th>
                  <th className="py-3 px-2 text-center">Class Avg</th>
                  <th className="py-3 px-2 text-center">Position</th>
                  <th className="py-3 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectScores.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-slate-500">
                      No locked subject results available for this semester yet.
                    </td>
                  </tr>
                ) : (
                  subjectScores.map((item, idx) => (
                    <tr key={item.subject.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{item.subject.name}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{item.subject.creditUnits}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{item.record.caScore}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-medium">{item.record.examScore}</td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">{item.record.total}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="font-bold px-2 py-0.5 rounded text-xs bg-slate-100 border border-slate-300">
                          {item.record.grade}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">{item.record.gradePoint.toFixed(1)}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono text-xs">{item.classAvg}%</td>
                      <td className="py-2.5 px-2 text-center text-slate-700 text-xs font-semibold">{formatOrdinal(item.rank)}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-600 font-medium">{item.record.remarks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Academic Performance Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-xs font-medium text-slate-500">Total Marks Scored</span>
              <span className="text-lg font-black text-slate-900">
                {totalScoreSum} <span className="text-xs font-normal text-slate-400">/ {subjectScores.length * 100}</span>
              </span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-xs font-medium text-slate-500">Term Average</span>
              <span className="text-lg font-black text-emerald-700">{averageScore}%</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-xs font-medium text-slate-500">Cumulative GPA</span>
              <span className="text-lg font-black text-indigo-700">{gpa} <span className="text-xs font-normal text-slate-400">/ 4.00</span></span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="block text-xs font-medium text-slate-500">Class Rank</span>
              <span className="text-lg font-black text-slate-900">{formatOrdinal(studentOverallRank || 1)}</span>
            </div>
          </div>

          {/* Grading Key & Behavioral Rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-slate-600">
            {/* Grading Scale Legend */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Grading System Key</h4>
              <div className="grid grid-cols-3 gap-1.5 font-mono">
                <div>A1: 80–100% (4.0)</div>
                <div>B2: 70–79% (3.5)</div>
                <div>B3: 65–69% (3.0)</div>
                <div>C4: 60–64% (2.5)</div>
                <div>C5: 55–59% (2.0)</div>
                <div>C6: 50–54% (1.5)</div>
                <div>D7: 45–49% (1.0)</div>
                <div>E8: 40–44% (0.5)</div>
                <div>F9: 0–39% (0.0)</div>
              </div>
            </div>

            {/* Attendance & Conduct Evaluation */}
            <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Affective & Psychomotor Assessment</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Punctuality & Attendance:</span>
                  <span className="font-semibold text-slate-800">{Number(attendancePercentage) >= 90 ? 'Excellent' : 'Satisfactory'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Neatness & Attire:</span>
                  <span className="font-semibold text-slate-800">Excellent</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Classroom Conduct:</span>
                  <span className="font-semibold text-slate-800">Very Good</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Leadership & Diligence:</span>
                  <span className="font-semibold text-slate-800">Very Good</span>
                </div>
              </div>
            </div>
          </div>

          {/* Signatures & Stamps */}
          <div className="grid grid-cols-3 gap-6 pt-10 mt-6 border-t border-slate-300 text-center">
            <div>
              <div className="h-10 flex items-end justify-center font-serif italic text-slate-700 text-sm">
                Eleanor Campbell
              </div>
              <div className="border-t border-slate-400 pt-1 text-xs font-semibold text-slate-700">
                Form Teacher Signature
              </div>
            </div>
            <div>
              <div className="h-10 flex items-end justify-center">
                <div className="w-16 h-16 -mb-4 rounded-full border-2 border-emerald-600 flex items-center justify-center text-[9px] font-bold uppercase tracking-tight text-emerald-700 rotate-[-12deg] bg-emerald-50/50">
                  EXAMS OFFICE<br />VERIFIED
                </div>
              </div>
              <div className="border-t border-slate-400 pt-1 text-xs font-semibold text-slate-700">
                Exams Officer Seal
              </div>
            </div>
            <div>
              <div className="h-10 flex items-end justify-center font-serif italic text-slate-700 text-sm">
                Dr. R. Sterling, Ph.D.
              </div>
              <div className="border-t border-slate-400 pt-1 text-xs font-semibold text-slate-700">
                Principal & Director
              </div>
            </div>
          </div>

          {/* Verification Footer Note */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-600 flex justify-between items-center">
            <span>Security Verification Token: {student.studentId}-{student.pin.slice(-4)}</span>
            <span>Generated: {new Date().toLocaleDateString()} • Official Academic Document</span>
          </div>
        </div>
      </div>
    </div>
  );
};
