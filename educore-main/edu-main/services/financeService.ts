/**
 * EDUCORE-OMEGA Finance Service
 * 
 * PRODUCTION VERSION: Full Supabase persistence
 * Manages Fee Records and Payments
 */

import { supabase, isAnalyticsEnabled } from './supabaseClient';
import { auditService } from './auditService';
import { rbacService } from './rbacService';

// ============================================
// TYPES
// ============================================

export interface FeeRecord {
    id: string;
    student_id: string;
    student_name: string;
    class: string;
    fee_type: 'tuition' | 'transport' | 'exam' | 'misc';
    amount: number;
    paid: number;
    due: number;
    status: 'paid' | 'partial' | 'pending' | 'overdue';
    due_date: string;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: string;
    fee_record_id: string;
    amount: number;
    payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer';
    transaction_id?: string;
    received_by: string;
    created_at: string;
}

// ============================================
// SERVICE
// ============================================

const isPersistenceAvailable = (): boolean => {
    return isAnalyticsEnabled && supabase !== null;
};

export const financeService = {
    async getFeeRecords(): Promise<{ data: FeeRecord[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { data: [], error: 'Database connection unavailable' };
        }

        try {
            const { data, error } = await supabase!
                .from('fee_records')
                .select('*')
                .order('due_date', { ascending: true });

            if (error) {
                console.error('[FINANCE] Failed to fetch:', error);
                return { data: [], error: error.message };
            }

            return { data: data as FeeRecord[] };
        } catch (err: any) {
            console.error('[FINANCE] Exception:', err);
            return { data: [], error: err.message };
        }
    },

    async recordPayment(
        feeRecordId: string,
        amount: number,
        paymentMethod: Payment['payment_method'],
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('finance:payments', 'create');

            // Get current fee record
            const { data: feeRecord, error: fetchError } = await supabase!
                .from('fee_records')
                .select('*')
                .eq('id', feeRecordId)
                .single();

            if (fetchError || !feeRecord) {
                return { success: false, error: 'Fee record not found' };
            }

            const newPaid = feeRecord.paid + amount;
            const newDue = feeRecord.amount - newPaid;
            const newStatus = newDue <= 0 ? 'paid' : newDue < feeRecord.amount ? 'partial' : 'pending';

            // Update fee record
            const { error: updateError } = await supabase!
                .from('fee_records')
                .update({
                    paid: newPaid,
                    due: newDue,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', feeRecordId);

            if (updateError) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'UPDATE',
                    entity: 'finance:payment',
                    entity_id: feeRecordId,
                    severity: 'error',
                    details: `Payment failed: ${updateError.message}`,
                });
                return { success: false, error: updateError.message };
            }

            // Record payment transaction
            const { error: paymentError } = await supabase!
                .from('payments')
                .insert([{
                    fee_record_id: feeRecordId,
                    amount,
                    payment_method: paymentMethod,
                    received_by: actorId,
                }]);

            // Audit success
            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'finance:payment',
                entity_id: feeRecordId,
                severity: 'success',
                details: `Payment of ₹${amount} recorded. New status: ${newStatus}`,
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error recording payment' };
        }
    },

    async createFeeRecord(
        data: Omit<FeeRecord, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
        actorName: string,
        actorRole: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { success: false, error: 'Database connection unavailable' };
        }

        try {
            // ENFORCE RBAC
            rbacService.enforce('finance:fees', 'create');

            const { error } = await supabase!
                .from('fee_records')
                .insert([data]);

            if (error) {
                await auditService.log({
                    actor_id: actorId,
                    actor_name: actorName,
                    actor_role: actorRole,
                    action: 'CREATE',
                    entity: 'finance:fee_record',
                    severity: 'error',
                    details: `Failed: ${error.message}`,
                });
                return { success: false, error: error.message };
            }

            await auditService.log({
                actor_id: actorId,
                actor_name: actorName,
                actor_role: actorRole,
                action: 'CREATE',
                entity: 'finance:fee_record',
                severity: 'success',
                details: `Fee record created for ${data.student_name}: ₹${data.amount}`,
            });

            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message || 'Unexpected error' };
        }
    },

    getStats(records: FeeRecord[]): { totalCollected: number; totalPending: number; overdueCount: number; collectionRate: number } {
        const totalCollected = records.reduce((acc, r) => acc + r.paid, 0);
        const totalAmount = records.reduce((acc, r) => acc + r.amount, 0);
        const totalPending = records.reduce((acc, r) => acc + r.due, 0);
        const overdueCount = records.filter(r => r.status === 'overdue').length;
        const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;
        return { totalCollected, totalPending, overdueCount, collectionRate };
    },

    async getChildInvoices(studentIds: string[]): Promise<{ data: any[]; error?: string }> {
        if (!isPersistenceAvailable() || studentIds.length === 0) {
            return { data: [], error: 'Database connection unavailable or no students linked' };
        }
        try {
            const { data, error } = await supabase!
                .from('fee_invoices')
                .select('*')
                .in('student_id', studentIds)
                .order('due_date', { ascending: true });

            if (error) return { data: [], error: error.message };
            return { data: data || [] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    async getPaymentHistory(studentIds: string[]): Promise<{ data: any[]; error?: string }> {
        if (!isPersistenceAvailable() || studentIds.length === 0) {
            return { data: [], error: 'Database connection unavailable' };
        }
        try {
            const { data, error } = await supabase!
                .from('payments')
                .select('*, payment_receipts(*)')
                .in('student_id', studentIds)
                .order('paid_at', { ascending: false });

            if (error) return { data: [], error: error.message };
            return { data: data || [] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    async getPaymentReceipts(paymentIds: string[]): Promise<{ data: any[]; error?: string }> {
        if (!isPersistenceAvailable() || paymentIds.length === 0) {
            return { data: [], error: 'Database connection unavailable' };
        }
        try {
            const { data, error } = await supabase!
                .from('payment_receipts')
                .select('*')
                .in('payment_id', paymentIds);

            if (error) return { data: [], error: error.message };
            return { data: data || [] };
        } catch (err: any) {
            return { data: [], error: err.message };
        }
    },

    async getOnlineCollectionMetrics(): Promise<{ totalOnline: number; totalOffline: number; monthlyTrends: any[]; error?: string }> {
        if (!isPersistenceAvailable()) {
            return { totalOnline: 0, totalOffline: 0, monthlyTrends: [], error: 'Database connection unavailable' };
        }
        try {
            const { data: payments, error } = await supabase!
                .from('payments')
                .select('amount, payment_method, paid_at, transaction_status');

            if (error) return { totalOnline: 0, totalOffline: 0, monthlyTrends: [], error: error.message };

            let totalOnline = 0;
            let totalOffline = 0;
            const monthlyData: Record<string, { month: string; online: number; offline: number }> = {};

            (payments || []).forEach((p) => {
                const isOnline = p.payment_method !== 'cash';
                const amt = Number(p.amount);
                if (isOnline) {
                    totalOnline += amt;
                } else {
                    totalOffline += amt;
                }

                // Parse month
                const date = new Date(p.paid_at || p.created_at || new Date());
                const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!monthlyData[monthName]) {
                    monthlyData[monthName] = { month: monthName, online: 0, offline: 0 };
                }
                if (isOnline) {
                    monthlyData[monthName].online += amt;
                } else {
                    monthlyData[monthName].offline += amt;
                }
            });

            const monthlyTrends = Object.values(monthlyData).reverse().slice(0, 6);

            return { totalOnline, totalOffline, monthlyTrends };
        } catch (err: any) {
            return { totalOnline: 0, totalOffline: 0, monthlyTrends: [], error: err.message };
        }
    },

    isPersistent(): boolean {
        return isPersistenceAvailable();
    },
};

export default financeService;
