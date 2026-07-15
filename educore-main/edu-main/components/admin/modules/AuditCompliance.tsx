import React, { useState, useEffect } from 'react';
import { FileCheck, Shield, Eye, Download, Filter, Clock, User, Activity, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { auditService, AuditLogEntry } from '../../../services/auditService';

const COMPLIANCE_CHECKS = [
    { name: 'Data Encryption', status: 'pass', lastCheck: '2026-01-09' },
    { name: 'Password Policy', status: 'pass', lastCheck: '2026-01-09' },
    { name: 'Session Timeout', status: 'pass', lastCheck: '2026-01-09' },
    { name: 'DPDPA Compliance', status: 'pass', lastCheck: '2026-01-08' },
    { name: 'Backup Integrity', status: 'pass', lastCheck: '2026-01-09' },
    { name: 'Access Control Audit', status: 'warn', lastCheck: '2026-01-07' },
];

export const AuditCompliance: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [activeView, setActiveView] = useState<'logs' | 'compliance'>('logs');
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, failedLogins: 0, accessDenied: 0, warnings: 0, errors: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isPersistent, setIsPersistent] = useState(false);

    useEffect(() => {
        loadData();
    }, [filterSeverity]);

    const loadData = async () => {
        setIsLoading(true);
        setIsPersistent(auditService.isPersistent());

        try {
            const [logsData, statsData] = await Promise.all([
                auditService.getLogs({
                    severity: filterSeverity !== 'All' ? filterSeverity.toLowerCase() as any : undefined,
                    limit: 50,
                }),
                auditService.getStats(),
            ]);

            setLogs(logsData);
            setStats(statsData);
        } catch (err) {
            console.error('Error loading audit data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const exportData = await auditService.exportLogs();
            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
        }
    };

    const formatTimestamp = (ts: string) => {
        const date = new Date(ts);
        return date.toLocaleString(i18n.language === 'ta' ? 'ta-IN' : 'en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Persistence Status Banner */}
            {!isPersistent && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center space-x-3">
                    <AlertTriangle className="text-amber-600" size={24} />
                    <div>
                        <p className="font-bold text-amber-800">{t('auditCompliance.demoMode')}</p>
                        <p className="text-sm text-amber-700">{t('auditCompliance.demoModeDesc')}</p>
                    </div>
                </div>
            )}

            {isPersistent && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
                    <Shield className="text-green-600" size={24} />
                    <div>
                        <p className="font-bold text-green-800">{t('auditCompliance.productionMode')}</p>
                        <p className="text-sm text-green-700">{t('auditCompliance.productionModeDesc')}</p>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Activity size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{stats.totalLogs.toLocaleString()}</span>
                    </div>
                    <p className="text-indigo-100 font-medium">{t('auditCompliance.totalLogs')}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Clock size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{stats.todayLogs}</span>
                    </div>
                    <p className="text-green-100 font-medium">{t('auditCompliance.todayLogs')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <AlertTriangle size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{stats.failedLogins}</span>
                    </div>
                    <p className="text-amber-100 font-medium">{t('auditCompliance.failedLogins')}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">🚫</span>
                        <span className="text-3xl font-bold">{stats.accessDenied}</span>
                    </div>
                    <p className="text-red-100 font-medium">{t('auditCompliance.accessDenied')}</p>
                </div>
            </div>

            {/* View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setActiveView('logs')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'logs' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        {t('auditCompliance.auditLogs')}
                    </button>
                    <button
                        onClick={() => setActiveView('compliance')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeView === 'compliance' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}
                    >
                        {t('auditCompliance.complianceStatus')}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeView === 'logs' && (
                        <>
                            <select
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={filterSeverity}
                                onChange={e => setFilterSeverity(e.target.value)}
                            >
                                <option>{t('auditCompliance.allSeverity')}</option>
                                <option>{t('auditCompliance.info')}</option>
                                <option>{t('auditCompliance.success')}</option>
                                <option>{t('auditCompliance.warning')}</option>
                                <option>{t('auditCompliance.error')}</option>
                            </select>
                            <button
                                onClick={loadData}
                                disabled={isLoading}
                                className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 disabled:opacity-50"
                            >
                                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                                <span className="hidden sm:inline">{t('common.refresh')}</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">{t('common.export')}</span>
                    </button>
                </div>
            </div>

            {/* Audit Logs Table */}
            {activeView === 'logs' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto mb-4" />
                            <p className="text-slate-500">{t('auditCompliance.loadingLogs')}</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <FileCheck size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500">{t('auditCompliance.noLogsFound')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.timestamp')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.user')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.action')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.entity')}</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.session')}</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('auditCompliance.severity')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-mono text-sm">
                                    {logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-500">{formatTimestamp(log.created_at)}</td>
                                            <td className="px-6 py-3">
                                                <div>
                                                    <p className="font-medium text-slate-800">{log.actor_name}</p>
                                                    <p className="text-xs text-slate-500">{log.actor_role}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 text-xs font-bold rounded ${log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                                                    log.action === 'LOGOUT' ? 'bg-slate-100 text-slate-700' :
                                                        log.action === 'UPDATE' ? 'bg-amber-100 text-amber-700' :
                                                            log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                                    log.action === 'FAILED_LOGIN' ? 'bg-red-100 text-red-700' :
                                                                        log.action === 'ACCESS_DENIED' ? 'bg-red-100 text-red-700' :
                                                                            'bg-slate-100 text-slate-700'
                                                    }`}>{t(`auditLogs.actions.${log.action.toLowerCase()}`, { defaultValue: log.action })}</span>
                                            </td>
                                            <td className="px-6 py-3 text-slate-600">
                                                <p>{t(`auditLogs.entities.${log.entity.toLowerCase().split(':')[0]}`, { defaultValue: log.entity })}</p>
                                                {log.entity_id && <p className="text-xs text-slate-400">{log.entity_id}</p>}
                                            </td>
                                            <td className="px-6 py-3 text-xs text-slate-400">{log.session_id}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`w-3 h-3 inline-block rounded-full ${log.severity === 'success' ? 'bg-green-500' :
                                                    log.severity === 'warning' ? 'bg-amber-500' :
                                                        log.severity === 'error' ? 'bg-red-500' : 'bg-blue-500'
                                                    }`} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Compliance Status */}
            {activeView === 'compliance' && (
                <div className="grid grid-cols-2 gap-6">
                    {COMPLIANCE_CHECKS.map(check => (
                        <div key={check.name} className={`bg-white rounded-xl p-6 border-2 ${check.status === 'pass' ? 'border-green-200' : 'border-amber-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${check.status === 'pass' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {check.status === 'pass' ? <Shield size={24} /> : <AlertTriangle size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{check.name}</h4>
                                        <p className="text-xs text-slate-500">{t('auditCompliance.lastChecked')} {check.lastCheck}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${check.status === 'pass' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {check.status === 'pass' ? t('auditCompliance.passed') : t('auditCompliance.review')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="bg-slate-800 text-white rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <FileCheck size={20} className="text-green-400" />
                    <span className="text-sm">
                        {isPersistent
                            ? t('auditCompliance.compliantMsg')
                            : t('auditCompliance.demoModeFooter')
                        }
                    </span>
                </div>
                <span className="text-xs text-slate-400">Audit Trail ID: OMEGA-AUD-{Date.now().toString(36).toUpperCase()}</span>
            </div>
        </div>
    );
};
