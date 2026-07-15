/**
 * EDUCORE-OMEGA Reports Export Service
 * 
 * Generates and exports reports in various formats (CSV, JSON).
 * Note: For PDF export, consider using a library like jsPDF in production.
 */

import { rbacService } from './rbacService';
import { auditService } from './auditService';

export interface ReportData {
    title: string;
    generatedAt: string;
    generatedBy: string;
    data: Record<string, unknown>[];
    columns: { key: string; label: string }[];
}

export const reportService = {
    /**
     * Export data as CSV and trigger download
     */
    exportAsCSV: (data: Record<string, unknown>[], columns: { key: string; label: string }[], filename: string): void => {
        // Build CSV header
        const header = columns.map(c => c.label).join(',');

        // Build CSV rows
        const rows = data.map(row =>
            columns.map(col => {
                const value = row[col.key];
                // Escape commas and quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        ).join('\n');

        const csv = `${header}\n${rows}`;
        reportService.downloadFile(csv, `${filename}.csv`, 'text/csv');
    },

    /**
     * Export data as JSON and trigger download
     */
    exportAsJSON: (data: Record<string, unknown>[], filename: string): void => {
        const json = JSON.stringify(data, null, 2);
        reportService.downloadFile(json, `${filename}.json`, 'application/json');
    },

    /**
     * Download file helper
     */
    downloadFile: (content: string, filename: string, mimeType: string): void => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Generate student report
     */
    generateStudentReport: (students: Record<string, unknown>[]): void => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('student:profile', 'export');

        const columns = [
            { key: 'id', label: 'Student ID' },
            { key: 'name', label: 'Name' },
            { key: 'class', label: 'Class' },
            { key: 'rollNo', label: 'Roll No' },
            { key: 'feeStatus', label: 'Fee Status' },
            { key: 'status', label: 'Status' },
        ];
        const filename = `student_report_${new Date().toISOString().split('T')[0]}`;
        reportService.exportAsCSV(students, columns, filename);
    },

    /**
     * Generate attendance report
     */
    generateAttendanceReport: (attendance: Record<string, unknown>[]): void => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('student:attendance', 'export');

        const columns = [
            { key: 'date', label: 'Date' },
            { key: 'studentId', label: 'Student ID' },
            { key: 'studentName', label: 'Student Name' },
            { key: 'class', label: 'Class' },
            { key: 'status', label: 'Status' },
        ];
        const filename = `attendance_report_${new Date().toISOString().split('T')[0]}`;
        reportService.exportAsCSV(attendance, columns, filename);
    },

    /**
     * Generate marks report
     */
    generateMarksReport: (marks: Record<string, unknown>[]): void => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('student:marks', 'export');

        const columns = [
            { key: 'studentId', label: 'Student ID' },
            { key: 'studentName', label: 'Student Name' },
            { key: 'class', label: 'Class' },
            { key: 'subject', label: 'Subject' },
            { key: 'examType', label: 'Exam Type' },
            { key: 'marks', label: 'Marks' },
            { key: 'grade', label: 'Grade' },
        ];
        const filename = `marks_report_${new Date().toISOString().split('T')[0]}`;
        reportService.exportAsCSV(marks, columns, filename);
    },

    /**
     * Generate fee collection report
     */
    generateFeeReport: (fees: Record<string, unknown>[]): void => {
        // RBAC ENFORCEMENT (CRITICAL)
        rbacService.enforce('finance:fees', 'export');

        const columns = [
            { key: 'receiptId', label: 'Receipt ID' },
            { key: 'studentName', label: 'Student Name' },
            { key: 'class', label: 'Class' },
            { key: 'totalFee', label: 'Total Fee' },
            { key: 'paid', label: 'Paid' },
            { key: 'due', label: 'Due' },
            { key: 'status', label: 'Status' },
        ];
        const filename = `fee_report_${new Date().toISOString().split('T')[0]}`;
        reportService.exportAsCSV(fees, columns, filename);
    },

    /**
     * Generate audit log export
     */
    generateAuditExport: (logs: Record<string, unknown>[]): void => {
        // RBAC ENFORCEMENT (CRITICAL) - Admin only
        rbacService.enforce('system:audit', 'export');

        const columns = [
            { key: 'timestamp', label: 'Timestamp' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'resource', label: 'Resource' },
            { key: 'ipAddress', label: 'IP Address' },
            { key: 'severity', label: 'Severity' },
        ];
        const filename = `audit_log_${new Date().toISOString().split('T')[0]}`;
        reportService.exportAsCSV(logs, columns, filename);
    },
};

export default reportService;
