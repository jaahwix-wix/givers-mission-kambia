import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SchoolDatabase,
  Semester,
  UserRole,
  TeacherSubmission,
  AttendanceRecord,
  Student,
  Teacher,
  Parent,
  BackupSnapshot,
  AuthSession,
  PrivilegeLevel,
} from '../types';
import { INITIAL_SCHOOL_DATA } from '../data/initialData';
import { generatePin, generateStudentId, generateSubmissionHash } from '../utils/grading';

const STORAGE_KEY = 'school_results_attendance_db_v1';
const AUTH_KEY = 'school_auth_session_v1';

interface SchoolContextType {
  data: SchoolDatabase;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedTeacherId: string;
  setSelectedTeacherId: (teacherId: string) => void;
  activeSemester: Semester;
  setActiveSemester: (sem: Semester) => void;

  // Authentication & Privileges
  currentSession: AuthSession;
  login: (role: UserRole, identifier: string, secret: string) => { success: boolean; error?: string };
  logout: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authTargetRole: UserRole;
  setAuthTargetRole: (role: UserRole) => void;
  hasPrivilege: (required: PrivilegeLevel) => boolean;
  
  // Student Actions
  generateNewPin: (studentId: string) => string;
  batchRegeneratePins: (classId?: string) => void;
  addStudent: (student: { fullName: string; gender: 'Male' | 'Female'; dateOfBirth: string; classId: string; parentPhone?: string; parentName?: string }) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  
  // Submission & Exam Office Actions
  saveSubmissionDraft: (submission: TeacherSubmission) => void;
  lockSubmission: (submissionId: string) => void;
  approveSubmission: (submissionId: string) => void;
  unlockSubmission: (submissionId: string, reason: string, officerName: string) => void;
  
  // Attendance Actions
  saveAttendance: (attendance: AttendanceRecord) => void;

  // Teacher Actions
  addTeacher: (teacher: Omit<Teacher, 'id' | 'staffId'>) => void;

  // Backup & Restore
  triggerBackup: (type?: 'automatic_cron' | 'manual') => BackupSnapshot;
  exportDatabaseToJson: () => string;
  importDatabaseFromJson: (jsonStr: string) => { success: boolean; error?: string };
  resetToDemoData: () => void;
}

const SchoolContext = createContext<SchoolContextType | null>(null);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SchoolDatabase>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_SCHOOL_DATA;
  });

  const DEFAULT_SESSION: AuthSession = {
    userId: 'usr-admin-01',
    name: 'Chief Exams Officer',
    identifier: 'EXAM-ADMIN-01',
    role: 'exams_office',
    privilegeLevel: 'admin',
    token: 'AUTH-SEC-EXAMS-ADMIN-9402',
    loginAt: new Date().toISOString(),
  };

  const [currentSession, setCurrentSession] = useState<AuthSession>(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        return JSON.parse(storedAuth);
      }
    } catch {
      // fallback to default
    }
    return DEFAULT_SESSION;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTargetRole, setAuthTargetRole] = useState<UserRole>('exams_office');

  useEffect(() => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(currentSession));
    } catch (e) {
      console.error('Failed to save auth session', e);
    }
  }, [currentSession]);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => currentSession.role || 'exams_office');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (currentSession.teacherId) return currentSession.teacherId;
    return INITIAL_SCHOOL_DATA.teachers[0]?.id || 'tch-01';
  });

  const hasPrivilege = useCallback(
    (required: PrivilegeLevel): boolean => {
      if (currentSession.privilegeLevel === 'admin') return true;
      if (required === 'teacher') return currentSession.privilegeLevel === 'teacher';
      if (required === 'student') return true;
      return false;
    },
    [currentSession.privilegeLevel],
  );

  const login = useCallback(
    (role: UserRole, identifier: string, secret: string): { success: boolean; error?: string } => {
      const cleanIdent = identifier.trim().toUpperCase();
      const cleanSecret = secret.trim();

      if (role === 'exams_office') {
        // Exams Office administrator login
        if (
          cleanIdent === 'EXAM-ADMIN-01' ||
          cleanIdent === 'ADMIN' ||
          cleanIdent.includes('EXAMS.OFFICE') ||
          cleanIdent.includes('EXAMS')
        ) {
          const newSession: AuthSession = {
            userId: 'usr-admin-01',
            name: 'Chief Exams Officer',
            identifier: 'EXAM-ADMIN-01',
            role: 'exams_office',
            privilegeLevel: 'admin',
            token: `AUTH-SEC-ADMIN-${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
          setCurrentSession(newSession);
          setCurrentRole('exams_office');
          setIsAuthModalOpen(false);
          return { success: true };
        } else {
          return { success: false, error: 'Invalid Staff ID for Exams Office. Try EXAM-ADMIN-01.' };
        }
      }

      if (role === 'teacher') {
        // Teacher login
        const teacher = data.teachers.find(
          (t) =>
            t.staffId.toUpperCase() === cleanIdent ||
            t.email.toUpperCase() === cleanIdent ||
            t.fullName.toUpperCase().includes(cleanIdent),
        );
        if (teacher) {
          const newSession: AuthSession = {
            userId: teacher.id,
            name: teacher.fullName,
            identifier: teacher.staffId,
            role: 'teacher',
            privilegeLevel: 'teacher',
            teacherId: teacher.id,
            token: `AUTH-SEC-TEACHER-${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
          setCurrentSession(newSession);
          setSelectedTeacherId(teacher.id);
          setCurrentRole('teacher');
          setIsAuthModalOpen(false);
          return { success: true };
        } else {
          return { success: false, error: 'Teacher credentials not found in faculty database.' };
        }
      }

      if (role === 'parent_student') {
        // Student / Parent verification
        const student = data.students.find(
          (s) =>
            s.studentId.toUpperCase() === cleanIdent &&
            s.pin.toUpperCase() === cleanSecret.toUpperCase(),
        );
        if (student) {
          const newSession: AuthSession = {
            userId: student.id,
            name: student.fullName,
            identifier: student.studentId,
            role: 'parent_student',
            privilegeLevel: 'student',
            studentId: student.id,
            token: `AUTH-SEC-STUDENT-${Date.now()}`,
            loginAt: new Date().toISOString(),
          };
          setCurrentSession(newSession);
          setCurrentRole('parent_student');
          setIsAuthModalOpen(false);
          return { success: true };
        } else {
          return { success: false, error: 'Invalid Student ID or Access PIN. Please verify credentials.' };
        }
      }

      return { success: false, error: 'Unknown role.' };
    },
    [data.teachers, data.students],
  );

  const logout = useCallback(() => {
    const guestSession: AuthSession = {
      userId: 'usr-guest',
      name: 'Guest / Parent Portal',
      identifier: 'PUBLIC-ACCESS',
      role: 'parent_student',
      privilegeLevel: 'student',
      token: 'GUEST-SESSION',
      loginAt: new Date().toISOString(),
    };
    setCurrentSession(guestSession);
    setCurrentRole('parent_student');
  }, []);

  // Save to LocalStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save school database to localStorage', e);
    }
  }, [data]);

  // Check and run automatic backup simulation if not backed up today
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastBackup = data.lastAutomaticBackupAt ? data.lastAutomaticBackupAt.slice(0, 10) : '';
    if (lastBackup !== todayStr) {
      // Simulate automatic daily backup trigger
      const newSnapshot: BackupSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: new Date().toISOString(),
        trigger: 'automatic_cron',
        sizeKb: Number((JSON.stringify(data).length / 1024).toFixed(1)),
        itemCounts: {
          students: data.students.length,
          teachers: data.teachers.length,
          submissions: data.submissions.length,
          attendance: data.attendance.length,
        },
      };
      setData((prev) => ({
        ...prev,
        backupSnapshots: [newSnapshot, ...prev.backupSnapshots.slice(0, 15)],
        lastAutomaticBackupAt: new Date().toISOString(),
      }));
    }
  }, [data.lastAutomaticBackupAt, data.students.length, data.teachers.length, data.submissions.length, data.attendance.length]);

  const setActiveSemester = useCallback((sem: Semester) => {
    setData((prev) => ({ ...prev, activeSemester: sem }));
  }, []);

  const generateNewPin = useCallback((studentId: string): string => {
    const newPin = generatePin();
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === studentId ? { ...s, pin: newPin } : s)),
    }));
    return newPin;
  }, []);

  const batchRegeneratePins = useCallback((classId?: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => {
        if (!classId || s.classId === classId) {
          return { ...s, pin: generatePin() };
        }
        return s;
      }),
    }));
  }, []);

  const addStudent = useCallback(
    (details: { fullName: string; gender: 'Male' | 'Female'; dateOfBirth: string; classId: string; parentPhone?: string; parentName?: string }) => {
      setData((prev) => {
        const nextCount = prev.students.length + 1;
        const newStuId = generateStudentId(nextCount);
        const newPin = generatePin();
        const id = `stu-${Date.now()}`;

        let parentId: string | undefined;
        let updatedParents = [...prev.parents];

        if (details.parentName || details.parentPhone) {
          parentId = `par-${Date.now()}`;
          const newParent: Parent = {
            id: parentId,
            fullName: details.parentName || 'Parent / Guardian',
            relationship: 'Guardian',
            phone: details.parentPhone || '+1 555-000-0000',
            email: '',
            studentIds: [id],
          };
          updatedParents.push(newParent);
        }

        const newStudent: Student = {
          id,
          studentId: newStuId,
          pin: newPin,
          fullName: details.fullName,
          gender: details.gender,
          dateOfBirth: details.dateOfBirth,
          classId: details.classId,
          parentId,
          enrollmentYear: '2025',
          status: 'Active',
        };

        return {
          ...prev,
          students: [newStudent, ...prev.students],
          parents: updatedParents,
        };
      });
    },
    [],
  );

  const updateStudent = useCallback((student: Student) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === student.id ? student : s)),
    }));
  }, []);

  const deleteStudent = useCallback((studentId: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== studentId),
      // Clean up records in submissions
      submissions: prev.submissions.map((sub) => ({
        ...sub,
        records: sub.records.filter((r) => r.studentId !== studentId),
      })),
      attendance: prev.attendance.map((att) => ({
        ...att,
        records: att.records.filter((r) => r.studentId !== studentId),
      })),
    }));
  }, []);

  const saveSubmissionDraft = useCallback((submission: TeacherSubmission) => {
    setData((prev) => {
      const idx = prev.submissions.findIndex(
        (s) =>
          s.classId === submission.classId &&
          s.subjectId === submission.subjectId &&
          s.semester === submission.semester &&
          s.academicYear === submission.academicYear,
      );
      if (idx >= 0) {
        // Only allow if not locked
        if (prev.submissions[idx].isLocked) {
          return prev; // immutable
        }
        const updated = [...prev.submissions];
        updated[idx] = submission;
        return { ...prev, submissions: updated };
      } else {
        return { ...prev, submissions: [submission, ...prev.submissions] };
      }
    });
  }, []);

  const lockSubmission = useCallback((submissionId: string) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      submissions: prev.submissions.map((sub) => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            isLocked: true,
            status: 'submitted_locked',
            submittedAt: now,
            submissionHash: generateSubmissionHash(sub.classId, sub.subjectId, now),
          };
        }
        return sub;
      }),
    }));
  }, []);

  const approveSubmission = useCallback((submissionId: string) => {
    setData((prev) => ({
      ...prev,
      submissions: prev.submissions.map((sub) => {
        if (sub.id === submissionId) {
          return {
            ...sub,
            status: 'approved',
          };
        }
        return sub;
      }),
    }));
  }, []);

  const unlockSubmission = useCallback((submissionId: string, reason: string, officerName: string) => {
    const now = new Date().toISOString();
    setData((prev) => ({
      ...prev,
      submissions: prev.submissions.map((sub) => {
        if (sub.id === submissionId) {
          const audit = sub.unlockAuditTrail || [];
          return {
            ...sub,
            isLocked: false,
            status: 'draft',
            unlockAuditTrail: [
              ...audit,
              {
                unlockedAt: now,
                unlockedBy: officerName || 'Exams Officer',
                reason,
              },
            ],
          };
        }
        return sub;
      }),
    }));
  }, []);

  const saveAttendance = useCallback((attendance: AttendanceRecord) => {
    setData((prev) => {
      const idx = prev.attendance.findIndex(
        (a) =>
          a.date === attendance.date &&
          a.classId === attendance.classId &&
          a.semester === attendance.semester,
      );
      if (idx >= 0) {
        const updated = [...prev.attendance];
        updated[idx] = attendance;
        return { ...prev, attendance: updated };
      } else {
        return { ...prev, attendance: [attendance, ...prev.attendance] };
      }
    });
  }, []);

  const addTeacher = useCallback((teacher: Omit<Teacher, 'id' | 'staffId'>) => {
    setData((prev) => {
      const id = `tch-${Date.now()}`;
      const staffId = `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;
      const newTeacher: Teacher = {
        ...teacher,
        id,
        staffId,
      };
      return { ...prev, teachers: [...prev.teachers, newTeacher] };
    });
  }, []);

  const triggerBackup = useCallback((type: 'automatic_cron' | 'manual' = 'manual'): BackupSnapshot => {
    const timestamp = new Date().toISOString();
    const sizeKb = Number((JSON.stringify(data).length / 1024).toFixed(1));
    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      timestamp,
      trigger: type,
      sizeKb,
      itemCounts: {
        students: data.students.length,
        teachers: data.teachers.length,
        submissions: data.submissions.length,
        attendance: data.attendance.length,
      },
    };
    setData((prev) => ({
      ...prev,
      backupSnapshots: [newSnapshot, ...prev.backupSnapshots.slice(0, 19)],
      lastAutomaticBackupAt: timestamp,
    }));
    return newSnapshot;
  }, [data]);

  const exportDatabaseToJson = useCallback((): string => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  const importDatabaseFromJson = useCallback((jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr) as SchoolDatabase;
      if (!parsed.students || !parsed.classes || !parsed.subjects) {
        return { success: false, error: 'Invalid school database format: Missing required collections.' };
      }
      setData(parsed);
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid JSON file';
      return { success: false, error: msg };
    }
  }, []);

  const resetToDemoData = useCallback(() => {
    setData(INITIAL_SCHOOL_DATA);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SchoolContext.Provider
      value={{
        data,
        currentRole,
        setCurrentRole,
        selectedTeacherId,
        setSelectedTeacherId,
        activeSemester: data.activeSemester,
        setActiveSemester,
        currentSession,
        login,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authTargetRole,
        setAuthTargetRole,
        hasPrivilege,
        generateNewPin,
        batchRegeneratePins,
        addStudent,
        updateStudent,
        deleteStudent,
        saveSubmissionDraft,
        lockSubmission,
        approveSubmission,
        unlockSubmission,
        saveAttendance,
        addTeacher,
        triggerBackup,
        exportDatabaseToJson,
        importDatabaseFromJson,
        resetToDemoData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
