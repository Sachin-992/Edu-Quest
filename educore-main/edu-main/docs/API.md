# EDUCORE-OMEGA API Documentation

## Overview

This document describes the internal service APIs used throughout the EDUCORE-OMEGA platform.

---

## Authentication

### Demo Credentials

```javascript
const DEMO_USERS = {
  'student': { password: 'demo', role: 'STUDENT' },
  'teacher': { password: 'demo', role: 'TEACHER' },
  'parent': { password: 'demo', role: 'PARENT' },
  'admin': { password: 'demo', role: 'ADMIN' },
  'professional': { password: 'demo', role: 'PROFESSIONAL' },
};
```

---

## Services

### AuditService

Location: `services/auditService.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `log` | `entry: AuditLogEntry` | `AuditLogEntry` | Log a generic audit entry |
| `logLogin` | `userId, userName, userRole, success` | `AuditLogEntry` | Log login attempt |
| `logLogout` | `userId, userName, userRole` | `AuditLogEntry` | Log logout event |
| `logAccess` | `userId, userName, userRole, action, resource, resourceId?, details?` | `AuditLogEntry` | Log data access |
| `logAccessDenied` | `userId, userName, userRole, resource, requiredRole` | `AuditLogEntry` | Log access denial |
| `getLogs` | `filters?: FilterOptions` | `AuditLogEntry[]` | Get filtered logs |
| `getStats` | none | `AuditStats` | Get audit statistics |
| `exportLogs` | none | `string` | Export logs as JSON |
| `clearLogs` | `adminId, adminName` | `void` | Clear all logs (admin only) |

#### Types

```typescript
type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'FAILED_LOGIN' | 'ACCESS_DENIED' | 'SYSTEM';
type AuditSeverity = 'info' | 'success' | 'warning' | 'error';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress: string;
  severity: AuditSeverity;
  sessionId: string;
}
```

---

### RBACService

Location: `services/rbacService.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `setCurrentUser` | `id, name, role` | `void` | Set authenticated user |
| `clearCurrentUser` | none | `void` | Clear user on logout |
| `getCurrentUser` | none | `User \| null` | Get current user |
| `hasPermission` | `resource, permission` | `boolean` | Check permission |
| `checkAndLog` | `resource, permission, resourceId?` | `boolean` | Check and audit log |
| `enforce` | `resource, permission` | `void` | Throw if denied |
| `getCurrentPermissions` | none | `PermissionMap` | Get all user permissions |
| `canAccessPortal` | `portal` | `boolean` | Check portal access |

#### Permission Matrix

```typescript
type Permission = 'read' | 'create' | 'update' | 'delete' | 'export' | 'admin';

// Resource permissions per role
const PERMISSION_MATRIX = {
  'student:marks': {
    ADMIN: ['read', 'create', 'update', 'delete', 'export', 'admin'],
    TEACHER: ['read', 'create', 'update'],
    STUDENT: ['read'],
    PARENT: ['read'],
  },
  // ... more resources
};
```

---

### NotificationService

Location: `services/notificationService.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `subscribe` | `callback` | `unsubscribe fn` | Subscribe to updates |
| `add` | `notification` | `Notification` | Add notification |
| `info` | `title, message` | `Notification` | Add info notification |
| `success` | `title, message` | `Notification` | Add success notification |
| `warning` | `title, message` | `Notification` | Add warning notification |
| `error` | `title, message` | `Notification` | Add error notification |
| `announce` | `title, message, sender` | `Notification` | Broadcast announcement |
| `markAsRead` | `id` | `void` | Mark as read |
| `markAllAsRead` | none | `void` | Mark all as read |
| `remove` | `id` | `void` | Remove notification |
| `clear` | none | `void` | Clear all |
| `getAll` | none | `Notification[]` | Get all notifications |
| `getUnreadCount` | none | `number` | Get unread count |

---

### ReportService

Location: `services/reportService.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `exportAsCSV` | `data, columns, filename` | `void` | Download CSV file |
| `exportAsJSON` | `data, filename` | `void` | Download JSON file |
| `generateStudentReport` | `students[]` | `void` | Export student report |
| `generateAttendanceReport` | `attendance[]` | `void` | Export attendance |
| `generateMarksReport` | `marks[]` | `void` | Export marks |
| `generateFeeReport` | `fees[]` | `void` | Export fee report |
| `generateAuditExport` | `logs[]` | `void` | Export audit logs |

---

### DatabaseService (Supabase)

Location: `services/databaseService.ts`

#### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `isAvailable` | none | `boolean` | Check Supabase connection |
| `getStudents` | `classFilter?` | `Promise<DBStudent[]>` | Fetch students |
| `getStudentById` | `id` | `Promise<DBStudent \| null>` | Fetch single student |
| `createStudent` | `student` | `Promise<DBStudent \| null>` | Create student |
| `updateStudent` | `id, updates` | `Promise<DBStudent \| null>` | Update student |
| `getAttendance` | `date, classFilter?` | `Promise<DBAttendance[]>` | Fetch attendance |
| `markAttendance` | `records[]` | `Promise<boolean>` | Mark attendance |
| `getMarks` | `studentId?, subject?` | `Promise<DBMarks[]>` | Fetch marks |
| `saveMarks` | `marks[]` | `Promise<boolean>` | Save marks |
| `subscribeToStudents` | `callback` | `unsubscribe fn` | Real-time students |
| `subscribeToAttendance` | `date, callback` | `unsubscribe fn` | Real-time attendance |

---

## Components

### NotificationCenter

Location: `components/NotificationCenter.tsx`

```tsx
<NotificationCenter className="ml-4" />
```

### ThemeToggle

Location: `components/ThemeToggle.tsx`

```tsx
<ThemeProvider>
  <ThemeToggle />
</ThemeProvider>
```

---

## Contexts

### ThemeContext

Location: `contexts/ThemeContext.tsx`

```tsx
import { ThemeProvider, useTheme } from './contexts/ThemeContext';

// In component
const { theme, toggleTheme, setTheme } = useTheme();
```

---

## User Roles

| Role | Value | Portal Access |
|------|-------|---------------|
| Student | `STUDENT` | Student Portal (VIEW-ONLY) |
| Teacher | `TEACHER` | Teacher Portal |
| Parent | `PARENT` | Parent Portal |
| Admin | `ADMIN` | Admin Portal (ALL ACCESS) |
| Professional | `PROFESSIONAL` | Chat Only |

---

## Error Handling

All services use try-catch blocks and return null/false on failure.
Errors are logged to console and optionally to audit log.

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return null;
}
```
