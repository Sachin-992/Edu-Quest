/**
 * EDUCORE-OMEGA Service Tests
 * 
 * Unit tests for core services.
 * Run with: npm test (requires vitest setup)
 * 
 * NOTE: auditService functions are now async, tests updated accordingly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { auditService } from '../services/auditService';
import { rbacService, PERMISSION_MATRIX } from '../services/rbacService';
import { notificationService } from '../services/notificationService';
import { UserRole } from '../types';

// ============================================
// AUDIT SERVICE TESTS
// ============================================

describe('AuditService', () => {
    it('should log a login event', async () => {
        const log = await auditService.logLogin('user1', 'Test User', 'STUDENT', true);

        expect(log).toBeDefined();
        expect(log?.action).toBe('LOGIN');
        expect(log?.actor_name).toBe('Test User');
        expect(log?.severity).toBe('success');
    });

    it('should log a failed login', async () => {
        const log = await auditService.logLogin('unknown', 'Unknown', 'NONE', false);

        expect(log?.action).toBe('FAILED_LOGIN');
        expect(log?.severity).toBe('warning');
    });

    it('should log access events', async () => {
        const log = await auditService.logAccess(
            'user1', 'Test User', 'TEACHER',
            'UPDATE', 'student:marks', 'mark-123'
        );

        expect(log?.action).toBe('UPDATE');
        expect(log?.entity).toBe('student:marks');
        expect(log?.entity_id).toBe('mark-123');
    });

    it('should filter logs by action', async () => {
        await auditService.logLogin('user1', 'Test', 'ADMIN', true);
        await auditService.logLogin('user2', 'Test2', 'ADMIN', false);

        const failedLogins = await auditService.getLogs({ action: 'FAILED_LOGIN' });

        expect(failedLogins.every(l => l.action === 'FAILED_LOGIN')).toBe(true);
    });

    it('should return audit statistics', async () => {
        const stats = await auditService.getStats();

        expect(stats).toHaveProperty('totalLogs');
        expect(stats).toHaveProperty('todayLogs');
        expect(stats).toHaveProperty('failedLogins');
    });
});

// ============================================
// RBAC SERVICE TESTS
// ============================================

describe('RBACService', () => {
    beforeEach(() => {
        rbacService.clearCurrentUser();
    });

    it('should deny access when no user is set', () => {
        const hasAccess = rbacService.hasPermission('student:marks', 'read');
        expect(hasAccess).toBe(false);
    });

    it('should grant admin all permissions (ADMIN IS SUPREME)', () => {
        rbacService.setCurrentUser('admin1', 'Admin User', UserRole.ADMIN);

        expect(rbacService.hasPermission('student:marks', 'read')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'delete')).toBe(true);
        expect(rbacService.hasPermission('system:audit', 'admin')).toBe(true);
    });

    it('should enforce student VIEW-ONLY restrictions', () => {
        rbacService.setCurrentUser('student1', 'Student', UserRole.STUDENT);

        expect(rbacService.hasPermission('student:marks', 'read')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'create')).toBe(false);
        expect(rbacService.hasPermission('student:marks', 'update')).toBe(false);
        expect(rbacService.hasPermission('files:upload', 'create')).toBe(false);
    });

    it('should allow teachers to update marks', () => {
        rbacService.setCurrentUser('teacher1', 'Teacher', UserRole.TEACHER);

        expect(rbacService.hasPermission('student:marks', 'read')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'create')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'update')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'delete')).toBe(false);
    });

    it('should allow parents to view but not edit', () => {
        rbacService.setCurrentUser('parent1', 'Parent', UserRole.PARENT);

        expect(rbacService.hasPermission('student:marks', 'read')).toBe(true);
        expect(rbacService.hasPermission('student:marks', 'update')).toBe(false);
        expect(rbacService.hasPermission('finance:fees', 'read')).toBe(true);
    });

    it('should correctly identify portal access', () => {
        rbacService.setCurrentUser('student1', 'Student', UserRole.STUDENT);

        expect(rbacService.canAccessPortal('student')).toBe(true);
        expect(rbacService.canAccessPortal('admin')).toBe(false);
        expect(rbacService.canAccessPortal('teacher')).toBe(false);
    });
});

// ============================================
// NOTIFICATION SERVICE TESTS
// ============================================

describe('NotificationService', () => {
    beforeEach(async () => {
        await notificationService.clear();
    });

    it('should add notifications', async () => {
        const notif = await notificationService.info('Test', 'Test message');

        expect(notif).toBeDefined();
        expect(notif?.type).toBe('info');
        expect(notif?.read).toBe(false);
    });

    it('should mark notifications as read', async () => {
        const notif = await notificationService.info('Test', 'Message');
        if (notif) {
            await notificationService.markAsRead(notif.id);
        }

        const all = notificationService.getAll();
        const found = all.find(n => n.id === notif?.id);

        expect(found?.read).toBe(true);
    });

    it('should track unread count', async () => {
        await notificationService.info('Test 1', 'Message 1');
        await notificationService.warning('Test 2', 'Message 2');

        expect(notificationService.getUnreadCount()).toBe(2);

        await notificationService.markAllAsRead();

        expect(notificationService.getUnreadCount()).toBe(0);
    });

    it('should filter by type', async () => {
        await notificationService.info('Info', 'Info message');
        await notificationService.warning('Warning', 'Warning message');
        await notificationService.error('Error', 'Error message');

        const warnings = notificationService.getByType('warning');

        expect(warnings.length).toBe(1);
        expect(warnings[0].type).toBe('warning');
    });

    it('should remove notifications', async () => {
        const notif = await notificationService.info('Test', 'Message');
        const initialCount = notificationService.getAll().length;

        if (notif) {
            await notificationService.remove(notif.id);
        }

        expect(notificationService.getAll().length).toBe(initialCount - 1);
    });
});

// ============================================
// PERMISSION MATRIX TESTS
// ============================================

describe('Permission Matrix', () => {
    it('should have student:marks permissions defined', () => {
        expect(PERMISSION_MATRIX['student:marks']).toBeDefined();
        expect(PERMISSION_MATRIX['student:marks'][UserRole.ADMIN]).toContain('read');
        expect(PERMISSION_MATRIX['student:marks'][UserRole.TEACHER]).toContain('update');
        expect(PERMISSION_MATRIX['student:marks'][UserRole.STUDENT]).toContain('read');
    });

    it('should not allow students to upload files', () => {
        const studentUploadPerms = PERMISSION_MATRIX['files:upload']?.[UserRole.STUDENT];
        expect(studentUploadPerms).toBeUndefined();
    });

    it('should restrict system:audit to admin only', () => {
        expect(PERMISSION_MATRIX['system:audit'][UserRole.ADMIN]).toBeDefined();
        expect(PERMISSION_MATRIX['system:audit'][UserRole.TEACHER]).toBeUndefined();
        expect(PERMISSION_MATRIX['system:audit'][UserRole.STUDENT]).toBeUndefined();
    });

    // NEW: Timetable Permission Tests
    it('should restrict timetable creation to admin only', () => {
        expect(PERMISSION_MATRIX['admin:timetable']).toBeDefined();
        expect(PERMISSION_MATRIX['admin:timetable'][UserRole.ADMIN]).toContain('create');
        expect(PERMISSION_MATRIX['admin:timetable'][UserRole.TEACHER]).toBeUndefined();
        expect(PERMISSION_MATRIX['admin:timetable'][UserRole.STUDENT]).toBeUndefined();
    });

    it('should allow all roles to view timetables', () => {
        expect(PERMISSION_MATRIX['timetable:view']).toBeDefined();
        expect(PERMISSION_MATRIX['timetable:view'][UserRole.ADMIN]).toContain('read');
        expect(PERMISSION_MATRIX['timetable:view'][UserRole.TEACHER]).toContain('read');
        expect(PERMISSION_MATRIX['timetable:view'][UserRole.STUDENT]).toContain('read');
        expect(PERMISSION_MATRIX['timetable:view'][UserRole.PARENT]).toContain('read');
    });

    // NEW: Attendance Permission Tests
    it('should allow teachers to mark attendance', () => {
        expect(PERMISSION_MATRIX['teacher:attendance']).toBeDefined();
        expect(PERMISSION_MATRIX['teacher:attendance'][UserRole.ADMIN]).toContain('create');
        expect(PERMISSION_MATRIX['teacher:attendance'][UserRole.TEACHER]).toContain('create');
        expect(PERMISSION_MATRIX['teacher:attendance'][UserRole.TEACHER]).toContain('update');
    });

    it('should restrict attendance marking from students', () => {
        const studentAttendancePerms = PERMISSION_MATRIX['teacher:attendance']?.[UserRole.STUDENT];
        expect(studentAttendancePerms).toBeUndefined();
    });

    it('should allow viewing period attendance by all relevant roles', () => {
        expect(PERMISSION_MATRIX['student:period_attendance']).toBeDefined();
        expect(PERMISSION_MATRIX['student:period_attendance'][UserRole.ADMIN]).toContain('read');
        expect(PERMISSION_MATRIX['student:period_attendance'][UserRole.TEACHER]).toContain('read');
        expect(PERMISSION_MATRIX['student:period_attendance'][UserRole.STUDENT]).toContain('read');
        expect(PERMISSION_MATRIX['student:period_attendance'][UserRole.PARENT]).toContain('read');
    });
});

// ============================================
// TIMETABLE RBAC ENFORCEMENT TESTS
// ============================================

describe('Timetable RBAC Enforcement', () => {
    beforeEach(() => {
        rbacService.clearCurrentUser();
    });

    it('should deny timetable creation for non-admin users', () => {
        rbacService.setCurrentUser('teacher1', 'Teacher', UserRole.TEACHER);
        expect(rbacService.hasPermission('admin:timetable', 'create')).toBe(false);
    });

    it('should allow timetable creation for admin', () => {
        rbacService.setCurrentUser('admin1', 'Admin', UserRole.ADMIN);
        expect(rbacService.hasPermission('admin:timetable', 'create')).toBe(true);
    });

    it('should allow teachers to view timetables', () => {
        rbacService.setCurrentUser('teacher1', 'Teacher', UserRole.TEACHER);
        expect(rbacService.hasPermission('timetable:view', 'read')).toBe(true);
    });

    it('should allow students to view timetables', () => {
        rbacService.setCurrentUser('student1', 'Student', UserRole.STUDENT);
        expect(rbacService.hasPermission('timetable:view', 'read')).toBe(true);
    });
});

// ============================================
// ATTENDANCE RBAC ENFORCEMENT TESTS
// ============================================

describe('Attendance RBAC Enforcement', () => {
    beforeEach(() => {
        rbacService.clearCurrentUser();
    });

    it('should allow teachers to mark attendance', () => {
        rbacService.setCurrentUser('teacher1', 'Teacher', UserRole.TEACHER);
        expect(rbacService.hasPermission('teacher:attendance', 'create')).toBe(true);
        expect(rbacService.hasPermission('teacher:attendance', 'update')).toBe(true);
    });

    it('should deny attendance marking for students', () => {
        rbacService.setCurrentUser('student1', 'Student', UserRole.STUDENT);
        expect(rbacService.hasPermission('teacher:attendance', 'create')).toBe(false);
    });

    it('should deny attendance marking for parents', () => {
        rbacService.setCurrentUser('parent1', 'Parent', UserRole.PARENT);
        expect(rbacService.hasPermission('teacher:attendance', 'create')).toBe(false);
    });

    it('should allow students to view their period attendance', () => {
        rbacService.setCurrentUser('student1', 'Student', UserRole.STUDENT);
        expect(rbacService.hasPermission('student:period_attendance', 'read')).toBe(true);
    });

    it('should allow parents to view period attendance', () => {
        rbacService.setCurrentUser('parent1', 'Parent', UserRole.PARENT);
        expect(rbacService.hasPermission('student:period_attendance', 'read')).toBe(true);
    });
});

