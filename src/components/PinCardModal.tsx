import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { Student } from '../types';
import { Printer, X, Shield, KeyRound, QrCode, RefreshCw } from 'lucide-react';

interface PinCardModalProps {
  initialStudent?: Student;
  onClose: () => void;
}

export const PinCardModal: React.FC<PinCardModalProps> = ({ initialStudent, onClose }) => {
  const { data, generateNewPin, batchRegeneratePins } = useSchool();
  const [selectedClassId, setSelectedClassId] = useState<string>(initialStudent?.classId || 'all');
  const [singleStudentId, setSingleStudentId] = useState<string | null>(initialStudent?.id || null);

  const studentsToDisplay = singleStudentId
    ? data.students.filter((s) => s.id === singleStudentId)
    : selectedClassId === 'all'
    ? data.students
    : data.students.filter((s) => s.classId === selectedClassId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:shadow-none print:border-none print:m-0 print:p-0">
        {/* Modal Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Student ID & Result Access PIN Cards</h3>
              <p className="text-xs text-slate-500">Official credentials issued by Exams Office for Result Slip lookup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter class or single */}
            {!singleStudentId && (
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-xl text-slate-700 focus:outline-none"
              >
                <option value="all">All Classes ({data.students.length} Students)</option>
                {data.classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({data.students.filter((s) => s.classId === cls.id).length})
                  </option>
                ))}
              </select>
            )}

            {singleStudentId && (
              <button
                onClick={() => setSingleStudentId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl"
              >
                Show All Students
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print Cards ({studentsToDisplay.length})
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Cards Grid */}
        <div className="p-6 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-4">
            {studentsToDisplay.map((student) => {
              const studentClass = data.classes.find((c) => c.id === student.classId);
              return (
                <div
                  key={student.id}
                  className="relative p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-xs flex flex-col justify-between overflow-hidden print:border-slate-400 print:shadow-none break-inside-avoid"
                >
                  {/* Decorative background watermark */}
                  <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                    <Shield className="w-40 h-40 text-slate-900" />
                  </div>

                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
                        {data.schoolName}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">Student Portal Access Card</h4>
                      <p className="text-[10px] text-slate-500">Academic Year {data.academicYear}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-100 text-slate-700 rounded-md border border-slate-300">
                        {studentClass?.name || 'Class'}
                      </span>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="my-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Student Full Name
                      </span>
                      <span className="text-base font-bold text-slate-900 leading-tight block">
                        {student.fullName}
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        Gender: {student.gender} • Section: {studentClass?.section}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center print:border-slate-300">
                      <QrCode className="w-10 h-10 text-slate-800 mx-auto" />
                      <span className="text-[8px] font-mono text-slate-500 block mt-0.5">PORTAL-AUTH</span>
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs">
                    <div>
                      <span className="text-[9px] font-sans font-medium text-slate-500 uppercase tracking-wider block">
                        Student ID
                      </span>
                      <span className="font-black text-slate-900 text-sm tracking-wide">
                        {student.studentId}
                      </span>
                    </div>
                    <div className="relative group">
                      <span className="text-[9px] font-sans font-medium text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Secret Access PIN</span>
                        <button
                          onClick={() => generateNewPin(student.id)}
                          title="Regenerate PIN"
                          className="print:hidden text-slate-400 hover:text-indigo-600 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      </span>
                      <span className="font-black text-indigo-700 text-sm tracking-widest">
                        {student.pin}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-600">
                    <span>Keep PIN confidential • Valid for Semesters 1 & 2</span>
                    <span className="font-semibold text-slate-700">Exams Office Validated</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
