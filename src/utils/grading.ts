export interface GradeDetails {
  grade: string;
  gradePoint: number;
  remarks: string;
  badgeClass: string;
}

export function computeGrade(total: number): GradeDetails {
  const score = Math.min(100, Math.max(0, Math.round(total)));

  if (score >= 80) {
    return { grade: 'A1', gradePoint: 4.0, remarks: 'Excellent', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (score >= 70) {
    return { grade: 'B2', gradePoint: 3.5, remarks: 'Very Good', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' };
  }
  if (score >= 65) {
    return { grade: 'B3', gradePoint: 3.0, remarks: 'Good', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
  }
  if (score >= 60) {
    return { grade: 'C4', gradePoint: 2.5, remarks: 'Credit', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (score >= 55) {
    return { grade: 'C5', gradePoint: 2.0, remarks: 'Credit', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  if (score >= 50) {
    return { grade: 'C6', gradePoint: 1.5, remarks: 'Pass', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (score >= 45) {
    return { grade: 'D7', gradePoint: 1.0, remarks: 'Pass', badgeClass: 'bg-orange-50 text-orange-700 border-orange-200' };
  }
  if (score >= 40) {
    return { grade: 'E8', gradePoint: 0.5, remarks: 'Weak Pass', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  return { grade: 'F9', gradePoint: 0.0, remarks: 'Fail', badgeClass: 'bg-red-50 text-red-700 border-red-200' };
}

export function generateStudentId(index: number, year: string = '2026'): string {
  const pad = String(index).padStart(4, '0');
  return `STU-${year}-${pad}`;
}

export function generatePin(): string {
  // Generates secure 6-digit numeric PIN with prefix
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `PIN-${digits}`;
}

export function generateSubmissionHash(classId: string, subjectId: string, timestamp: string): string {
  const seed = `${classId}:${subjectId}:${timestamp}:${Math.random().toString(36).substring(2, 9)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const chr = seed.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SEC-HASH-${hex.toUpperCase()}-${timestamp.slice(0, 10).replace(/-/g, '')}`;
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
