/**
 * EDUCORE-OMEGA Role-Based Access Control (RBAC) Service
 * 
 * Enforces: IDENTITY DEFINES ACCESS. DATA IS TRACEABLE. ADMIN IS SUPREME.
 */

import { UserRole } from '../types';
import { auditService } from './auditService';

// Define permissions for each resource
export type Permission = 'read' | 'create' | 'update' | 'delete' | 'export' | 'admin' | 'publish';

export interface ResourcePermissions {
    [resource: string]: {
        [role in UserRole]?: Permission[];
    };
}

// RBAC Permission Matrix
export const PERMISSION_MATRIX: ResourcePermissions = {
    // Student Data
    'student:profile': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read', 'update'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },
    'student:marks': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read', 'create', 'update'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },
    'student:attendance': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read', 'create', 'update'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },
    'student:remarks': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read', 'create', 'update'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // Teacher Data
    'teacher:profile': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read'],
    },
    'teacher:assignments': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.TEACHER]: ['read', 'create', 'update', 'delete'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // School Structure
    'school:classes': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'admin'],
        [UserRole.TEACHER]: ['read'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },
    'school:subjects': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'admin'],
        [UserRole.TEACHER]: ['read'],
    },

    // Finance
    'finance:fees': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.PARENT]: ['read'],
    },
    'finance:payments': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'export', 'admin'],
        [UserRole.PARENT]: ['read'],
    },

    // System
    'system:users': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'admin'],
    },
    'system:audit': {
        [UserRole.ADMIN]: ['read', 'export', 'admin'],
    },
    'system:analytics': {
        [UserRole.ADMIN]: ['read', 'export', 'admin'],
        [UserRole.TEACHER]: ['read'],
    },
    'system:settings': {
        [UserRole.ADMIN]: ['read', 'update', 'admin'],
    },

    // AI Chat
    'ai:chat': {
        [UserRole.ADMIN]: ['read', 'create', 'admin'],
        [UserRole.TEACHER]: ['read', 'create'],
        [UserRole.STUDENT]: ['read', 'create'],
        [UserRole.PROFESSIONAL]: ['read', 'create'],
    },

    // File Upload
    'files:upload': {
        [UserRole.ADMIN]: ['create', 'delete', 'admin'],
        [UserRole.TEACHER]: ['create', 'delete'],
        // Students explicitly CANNOT upload (VIEW-ONLY)
    },
    'files:download': {
        [UserRole.ADMIN]: ['read', 'admin'],
        [UserRole.TEACHER]: ['read'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // TIMETABLE & PERIOD ATTENDANCE PERMISSIONS (NEW)
    // ═══════════════════════════════════════════════════════════════════

    // Timetable Management (Admin only for create/update/delete)
    'admin:timetable': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'admin'],
    },

    // Timetable Viewing (All authenticated roles)
    'timetable:view': {
        [UserRole.ADMIN]: ['read', 'admin'],
        [UserRole.TEACHER]: ['read'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // Period Attendance Marking (Teacher + Admin)
    'teacher:attendance': {
        [UserRole.ADMIN]: ['read', 'create', 'update', 'delete', 'admin'],
        [UserRole.TEACHER]: ['create', 'update'],
    },

    // Period Attendance Viewing
    'student:period_attendance': {
        [UserRole.ADMIN]: ['read', 'export', 'admin'],
        [UserRole.TEACHER]: ['read'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // Teacher Files (period-linked academic materials)
    'teacher:files': {
        [UserRole.ADMIN]: ['read', 'create', 'delete', 'admin'],
        [UserRole.TEACHER]: ['read', 'create', 'delete'],
    },

    // Student File Access (read-only for class materials)
    'student:files': {
        [UserRole.ADMIN]: ['read', 'admin'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // ═══════════════════════════════════════════════════════════════════
    // FEEDBACK SYSTEM PERMISSIONS
    // ═══════════════════════════════════════════════════════════════════

    // Feedback Submission (Students & Parents only)
    'feedback:submit': {
        [UserRole.ADMIN]: ['admin'],
        [UserRole.STUDENT]: ['create'],
        [UserRole.PARENT]: ['create'],
    },

    // Own Feedback Access
    'feedback:own': {
        [UserRole.ADMIN]: ['read', 'admin'],
        [UserRole.STUDENT]: ['read'],
        [UserRole.PARENT]: ['read'],
    },

    // Feedback Management (Admin only)
    'feedback:manage': {
        [UserRole.ADMIN]: ['read', 'update', 'admin'],
    },
};

// Current user context (set on login)
let currentUser: {
    id: string;
    name: string;
    role: UserRole;
} | null = null;

export const rbacService = {
    /**
     * Set the current authenticated user
     */
    setCurrentUser: (id: string, name: string, role: UserRole): void => {
        currentUser = { id, name, role };
    },

    /**
     * Clear current user (on logout)
     */
    clearCurrentUser: (): void => {
        currentUser = null;
    },

    /**
     * Get current user
     */
    getCurrentUser: () => currentUser,

    /**
     * Check if current user has permission for a resource
     */
    hasPermission: (resource: string, permission: Permission): boolean => {
        if (!currentUser) {
            return false;
        }

        // ADMIN IS SUPREME - always has all permissions
        if (currentUser.role === UserRole.ADMIN) {
            return true;
        }

        const resourcePermissions = PERMISSION_MATRIX[resource];
        if (!resourcePermissions) {
            // Unknown resource - deny by default
            return false;
        }

        const rolePermissions = resourcePermissions[currentUser.role];
        if (!rolePermissions) {
            return false;
        }

        return rolePermissions.includes(permission);
    },

    /**
     * Check permission and log access attempt
     */
    checkAndLog: (
        resource: string,
        permission: Permission,
        resourceId?: string
    ): boolean => {
        if (!currentUser) {
            auditService.log({
                actor_id: 'anonymous',
                actor_name: 'Anonymous',
                actor_role: 'NONE',
                action: 'ACCESS_DENIED',
                entity: resource,
                entity_id: resourceId,
                severity: 'error',
                details: 'No authenticated user',
            });
            return false;
        }

        const hasAccess = rbacService.hasPermission(resource, permission);

        if (!hasAccess) {
            auditService.logAccessDenied(
                currentUser.id,
                currentUser.name,
                currentUser.role,
                resource,
                'Higher privilege required'
            );
            return false;
        }

        // Log successful access
        const actionMap: { [key in Permission]: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'SYSTEM' } = {
            read: 'VIEW',
            create: 'CREATE',
            update: 'UPDATE',
            delete: 'DELETE',
            export: 'EXPORT',
            admin: 'SYSTEM',
            publish: 'UPDATE',
        };

        auditService.logAccess(
            currentUser.id,
            currentUser.name,
            currentUser.role,
            actionMap[permission],
            resource,
            resourceId
        );

        return true;
    },

    /**
     * Enforce permission - throws error if denied
     */
    enforce: (resource: string, permission: Permission): void => {
        if (!rbacService.hasPermission(resource, permission)) {
            throw new Error(`Access denied: ${permission} on ${resource}`);
        }
    },

    /**
     * Get all permissions for current user
     */
    getCurrentPermissions: (): { [resource: string]: Permission[] } => {
        if (!currentUser) return {};

        const permissions: { [resource: string]: Permission[] } = {};

        for (const [resource, rolePerms] of Object.entries(PERMISSION_MATRIX)) {
            // ADMIN IS SUPREME
            if (currentUser.role === UserRole.ADMIN) {
                permissions[resource] = ['read', 'create', 'update', 'delete', 'export', 'admin'];
            } else {
                const perms = rolePerms[currentUser.role];
                if (perms && perms.length > 0) {
                    permissions[resource] = perms;
                }
            }
        }

        return permissions;
    },

    /**
     * Check if user can access a specific portal
     */
    canAccessPortal: (portal: 'admin' | 'teacher' | 'student' | 'parent'): boolean => {
        if (!currentUser) return false;

        switch (portal) {
            case 'admin':
                return currentUser.role === UserRole.ADMIN;
            case 'teacher':
                return currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.ADMIN;
            case 'student':
                return currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.ADMIN;
            case 'parent':
                return currentUser.role === UserRole.PARENT || currentUser.role === UserRole.ADMIN;
            default:
                return false;
        }
    },
};

export default rbacService;
