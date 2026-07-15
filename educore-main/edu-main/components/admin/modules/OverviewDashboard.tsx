import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, Briefcase, CreditCard, TrendingUp, Calendar, Bell, AlertCircle, Loader2 } from 'lucide-react';
import { studentService } from '../../../services/studentService';
import { localizeTimeAgo, localizeAuditMessage, localizeNotificationTitle, localizeNotificationMessage } from '../../../utils/localizationHelpers';
import { schoolService } from '../../../services/schoolService';
import { teacherService } from '../../../services/teacherService';
import { financeService } from '../../../services/financeService';
import { supabase } from '../../../services/supabaseClient';

interface OverviewDashboardProps {
    onNavigate?: (tab: 'students' | 'finance' | 'analytics' | 'parents' | 'teachers') => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({ onNavigate }) => {
    const { t, i18n } = useTranslation();
    // Stats State
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        feesCollected: 0,
    });
    const [recentLogs, setRecentLogs] = useState<any[]>([]);
    const [overdueCount, setOverdueCount] = useState(0);
    const [rawAlertNotifications, setRawAlertNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
        loadRecentActivity();
        loadAlerts();
    }, []);

    const loadStats = async () => {
        setIsLoading(true);
        try {
            const [studentsRes, classesRes, teachersRes, feeRecordsRes] = await Promise.all([
                studentService.getStudents(),
                schoolService.getClasses(),
                teacherService.getTeachers(),
                financeService.getFeeRecords()
            ]);

            // Calculate fee stats from records
            const feeStats = feeRecordsRes.data?.length > 0
                ? financeService.getStats(feeRecordsRes.data)
                : { collectionRate: 0 };

            setStats({
                totalStudents: studentsRes.data?.length || 0,
                totalTeachers: teachersRes.data?.length || 0,
                totalClasses: classesRes.data?.length || 0,
                feesCollected: feeStats.collectionRate || 0,
            });
        } catch (e) {
            console.error("Failed to load dashboard stats", e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRecentActivity = async () => {
        try {
            if (!supabase) return;
            const { data, error } = await supabase
                .from('audit_logs')
                .select('id, action, entity, details, created_at, actor_role')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Failed to load activity:', error);
                return;
            }

            // Filter out non-admin logins and logouts, then take the top 5
            const filteredLogs = (data || []).filter(log => {
                const isLoginOrLogout = log.action === 'LOGIN' || log.action === 'LOGOUT';
                return !isLoginOrLogout || log.actor_role === 'admin';
            }).slice(0, 5);

            setRecentLogs(filteredLogs);
        } catch (e) {
            console.error('Failed to load recent activity:', e);
        }
    };

    const loadAlerts = async () => {
        try {
            if (!supabase) return;

            // Count overdue fees
            const { data: overdueData } = await supabase
                .from('fee_records')
                .select('id')
                .eq('status', 'overdue');

            setOverdueCount(overdueData?.length || 0);

            // Fetch latest urgent notifications
            try {
                const { data: notifications } = await supabase
                    .from('notifications')
                    .select('id, title, message, priority, type')
                    .or('priority.eq.urgent,priority.eq.high')
                    .eq('dismissed', false)
                    .order('created_at', { ascending: false })
                    .limit(3);

                setRawAlertNotifications(notifications || []);
            } catch {
                // Notifications table may not exist yet, ignore
            }
        } catch (e) {
            console.error('Failed to load alerts:', e);
        }
    };

    const getTimeAgo = (date: Date): string => {
        return localizeTimeAgo(date, t);
    };

    // Build active alerts list dynamically on each render so that t() translations update instantly
    const activeAlerts: { id: number; severity: string; message: string }[] = [];
    if (overdueCount > 0) {
        activeAlerts.push({
            id: 1,
            severity: 'warning',
            message: t('overviewDashboard.overdueFeesAlert', { count: overdueCount, defaultValue: `${overdueCount} students have fee overdue` })
        });
    }
    rawAlertNotifications.forEach((n, idx) => {
        const localTitle = localizeNotificationTitle(n.title, t);
        const localMsg = n.message ? localizeNotificationMessage(n.message, t) : '';
        activeAlerts.push({
            id: 100 + idx,
            severity: n.priority === 'urgent' ? 'error' : 'warning',
            message: localTitle + (localMsg ? `: ${localMsg.substring(0, 80)}...` : '')
        });
    });

    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <GraduationCap size={28} />
                        </div>
                        <TrendingUp size={20} className="text-green-300" />
                    </div>
                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="text-4xl font-bold">{stats.totalStudents}</span>}
                    <p className="text-blue-100 font-medium mt-1">{t('overviewDashboard.totalStudents')}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Briefcase size={28} />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">{t('overviewDashboard.active')}</span>
                    </div>
                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="text-4xl font-bold">{stats.totalTeachers}</span>}
                    <p className="text-purple-100 font-medium mt-1">{t('overviewDashboard.totalTeachers')}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Users size={28} />
                        </div>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">1-12</span>
                    </div>
                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="text-4xl font-bold">{stats.totalClasses}</span>}
                    <p className="text-emerald-100 font-medium mt-1">{t('overviewDashboard.activeClasses')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <CreditCard size={28} />
                        </div>
                        <TrendingUp size={20} className="text-green-300" />
                    </div>
                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="text-4xl font-bold">{stats.feesCollected}%</span>}
                    <p className="text-amber-100 font-medium mt-1">{t('overviewDashboard.feeCollection')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <Bell size={20} className="mr-2 text-indigo-600" />
                        {t('overviewDashboard.recentActivity')}
                    </h3>
                    <div className="space-y-4">
                        {recentLogs.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">{t('overviewDashboard.noActivity')}</p>
                        ) : (
                            recentLogs.map((log, idx) => {
                                const timeAgo = getTimeAgo(new Date(log.created_at));
                                let type = 'marks';
                                let targetTab: 'students' | 'finance' | 'teachers' = 'students';

                                if (log.entity === 'student' || log.action?.includes('ADMISSION')) {
                                    type = 'admission';
                                    targetTab = 'students';
                                } else if (log.entity === 'fee' || log.entity === 'payment') {
                                    type = 'fee';
                                    targetTab = 'finance';
                                } else if (log.entity === 'attendance') {
                                    type = 'attendance';
                                    targetTab = 'teachers';
                                } else {
                                    type = 'marks';
                                    targetTab = 'teachers';
                                }

                                const localizedMessage = localizeAuditMessage(log.details, log.action, log.entity, t);

                                return (
                                    <button
                                        key={log.id || idx}
                                        onClick={() => onNavigate?.(targetTab)}
                                        className="w-full flex items-start space-x-4 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer text-left"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === 'admission' ? 'bg-green-100 text-green-600' :
                                            type === 'fee' ? 'bg-amber-100 text-amber-600' :
                                                type === 'attendance' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-purple-100 text-purple-600'
                                            }`}>
                                            {type === 'admission' && <GraduationCap size={18} />}
                                            {type === 'fee' && <CreditCard size={18} />}
                                            {type === 'attendance' && <Calendar size={18} />}
                                            {type === 'marks' && <TrendingUp size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700">{localizedMessage}</p>
                                            <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Alerts & Notifications */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <AlertCircle size={20} className="mr-2 text-amber-600" />
                        {t('overviewDashboard.alertsNotifications')}
                    </h3>
                    <div className="space-y-4">
                        {activeAlerts.map(alert => (
                            <div key={alert.id} className={`p-4 rounded-xl border-l-4 ${alert.severity === 'warning' ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'
                                }`}>
                                <p className={`font-medium ${alert.severity === 'warning' ? 'text-amber-800' : 'text-blue-800'
                                    }`}>{alert.message}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <h4 className="text-sm font-bold text-slate-600 mb-3">{t('overviewDashboard.quickActions')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => onNavigate?.('students')}
                                className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                            >
                                📝 {t('overviewDashboard.newAdmission')}
                            </button>
                            <button
                                onClick={() => onNavigate?.('finance')}
                                className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                            >
                                💰 {t('overviewDashboard.recordFee')}
                            </button>
                            <button
                                onClick={() => onNavigate?.('analytics')}
                                className="bg-purple-50 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors"
                            >
                                📊 {t('overviewDashboard.generateReport')}
                            </button>
                            <button
                                onClick={() => onNavigate?.('parents')}
                                className="bg-amber-50 text-amber-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-amber-100 transition-colors"
                            >
                                📢 {t('overviewDashboard.sendNotice')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg">EDUCORE-OMEGA {t('overviewDashboard.systemStatus')}</h3>
                    <p className="text-slate-400 text-sm">{t('overviewDashboard.allSystemsOperational')} • {t('overviewDashboard.lastSync')} {new Date().toLocaleTimeString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-green-400 font-medium">{t('overviewDashboard.online')}</span>
                </div>
            </div>
        </div>
    );
};
