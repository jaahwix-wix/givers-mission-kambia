export type Semester = 'Semester 1' | 'Semester 2';

export type UserRole = 'exams_office' | 'teacher' | 'parent_student';

export type PrivilegeLevel = 'admin' | 'teacher' | 'student';

export interface AuthSession {
  userId: string;
  name: string;
  identifier: string; // Staff ID, email, or Student ID
  role: UserRole;
  privilegeLevel: PrivilegeLevel;
  teacherId?: string;
  studentId?: string;
  token: string;
  loginAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  gradeLevel: string; // e.g. "Grade 10", "Grade 11", "Grade 12"
  section: string; // "A", "B", etc.
  classTeacherId: string;
  roomNumber: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: 'Core' | 'Elective' | 'Science' | 'Arts' | 'Vocational';
  creditUnits: number;
}

export interface Teacher {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  assignedSubjects: {
    subjectId: string;
    classId: string;
  }[];
}

export interface Parent {
  id: string;
  fullName: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  phone: string;
  email: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  studentId: string; // e.g. STU-2026-0101
  pin: string; // e.g. PIN-984210
  fullName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  classId: string;
  parentId?: string;
  enrollmentYear: string;
  status: 'Active' | 'Transferred' | 'Graduated';
}

export interface GradeEntry {
  studentId: string;
  caScore: number; // 0 - 30 Continuous Assessment
  examScore: number; // 0 - 70 Final Examination
  total: number; // 0 - 100
  grade: string; // A1, B2, B3, C4, C5, C6, D7, E8, F9
  gradePoint: number; // 4.0 scale
  remarks: string;
}

export interface TeacherSubmission {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  semester: Semester;
  academicYear: string;
  records: GradeEntry[];
  isLocked: boolean; // True once submitted by teacher (immutable)
  submittedAt?: string;
  submissionHash?: string; // Cryptographic-style verification token
  status: 'draft' | 'submitted_locked' | 'approved';
  unlockAuditTrail?: {
    unlockedAt: string;
    unlockedBy: string;
    reason: string;
  }[];
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  semester: Semester;
  academicYear: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    note?: string;
  }[];
}

export interface BackupSnapshot {
  id: string;
  timestamp: string;
  trigger: 'automatic_cron' | 'manual';
  sizeKb: number;
  itemCounts: {
    students: number;
    teachers: number;
    submissions: number;
    attendance: number;
  };
}

export interface SchoolDatabase {
  schoolName: string;
  schoolMotto: string;
  schoolAddress: string;
  schoolContact: string;
  academicYear: string;
  activeSemester: Semester;
  classes: ClassRoom[];
  subjects: Subject[];
  teachers: Teacher[];
  parents: Parent[];
  students: Student[];
  submissions: TeacherSubmission[];
  attendance: AttendanceRecord[];
  backupSnapshots: BackupSnapshot[];
  lastAutomaticBackupAt?: string;
}
