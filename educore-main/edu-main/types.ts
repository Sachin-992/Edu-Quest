export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  PARENT = 'parent',
  PROFESSIONAL = 'professional',
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}




export interface SessionRecord {
  role: UserRole;
  curriculum: string;
  message_count: number;
  topics?: string[];
}