import { UserRole } from '../types';

// Engine 14: Database RBAC Schema Entities

export type UserId = string;
export type ClassId = string; // e.g., "STD-6-A"
export type SubjectId = string; // e.g., "MATH-6"

// STRICT IDENTITY: User Entity
export interface User {
    id: UserId;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string;
    // Linked profiles (optional based on role)
    studentProfileId?: string;
    teacherProfileId?: string;
    parentId?: string;
}

// Academic Entities
export interface Class {
    id: ClassId;
    name: string; // "Class 6"
    section: string; // "A"
    gradeLevel: number; // 6
    academicYear: string; // "2025-2026"
    classTeacherId: UserId;
}

export interface Subject {
    id: SubjectId;
    name: string; // "Mathematics"
    code: string; // "MAT601"
    classId: ClassId;
    teacherId: UserId; // Subject owner
    syllabus: string[]; // List of topics/units
}

// Student Data (Engine 12)
export interface StudentProfile {
    userId: UserId;
    admissionNumber: string;
    classId: ClassId;
    rollNumber: number;
    parentIds: UserId[];
    attendanceRate: number; // 0-100
    overallGrade: string; // "A", "B", etc.
    behavioralNote?: string;
}

export interface AttendanceRecord {
    id: string;
    studentId: UserId;
    date: string; // ISO Date
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    markedBy: UserId; // Teacher ID
}

export interface Assignment {
    id: string;
    title: string;
    subjectId: SubjectId;
    teacherId: UserId;
    dueDate: string;
    description: string;
    maxMarks: number;
    type: 'Homework' | 'Project' | 'Exam';
}

export interface Submission {
    id: string;
    assignmentId: string;
    studentId: UserId;
    submittedAt: string;
    fileUrl?: string; // Engine 0/14 secure file
    content?: string;
    marks?: number;
    feedback?: string;
    status: 'Pending' | 'Graded' | 'Late' | 'Missing';
}

// Admin Audit Log (Engine 15)
export interface AuditLog {
    id: string;
    actorId: UserId;
    action: string;
    targetId?: string;
    details?: string;
    timestamp: string;
    ipAddress?: string;
}
