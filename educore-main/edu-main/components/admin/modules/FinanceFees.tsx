import React, { useState, useEffect } from 'react';
import {
    CreditCard, Search, Download, Eye, CheckCircle, AlertCircle, Clock,
    XCircle, Loader2, RefreshCw, TrendingUp, IndianRupee, BarChart2,
    Wifi, WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { financeService, FeeRecord } from '../../../services/financeService';

const PIE_COLORS = ['#4f46e5', '#10b981'];

export const FinanceFees: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Analytics
    const [onlineMetrics, setOnlineMetrics] = useState<{
        totalOnline: number;
        totalOffline: number;
        monthlyTrends: any[];
    }>({ totalOnline: 0, totalOffline: 0, monthlyTrends: [] });
    const [metricsLoading, setMetricsLoading] = useState(true);

    // Payment modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadData();
        loadMetrics();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        const result = await financeService.getFeeRecords();
        setFeeRecords(result.data);
        setIsLoading(false);
    };

    const loadMetrics = async () => {
        setMetricsLoading(true);
        const result = await financeService.getOnlineCollectionMetrics();
        setOnlineMetrics({
            totalOnline: result.totalOnline,
            totalOffline: result.totalOffline,
            monthlyTrends: result.monthlyTrends || [],
        });
        setMetricsLoading(false);
    };

    const handleRecordPayment = async () => {
        if (!selectedRecord || paymentAmount <= 0) return;

        setIsSubmitting(true);
        setError(null);

        const result = await financeService.recordPayment(
            selectedRecord.id,
            paymentAmount,
            'cash',
            'admin',
            'Admin User',
            'Administrator'
        );

        if (result.success) {
            setSuccessMsg(`Payment of ₹${paymentAmount.toLocaleString()} recorded successfully`);
            setShowPaymentModal(false);
            setSelectedRecord(null);
            setPaymentAmount(0);
            await loadData();
            await loadMetrics();
            setTimeout(() => setSuccessMsg(null), 3000);
        } else {
            setError(result.error || 'Failed to record payment');
        }

        setIsSubmitting(false);
    };

    const openPaymentModal = (record: FeeRecord) => {
        setSelectedRecord(record);
        setPaymentAmount(record.due);
        setShowPaymentModal(true);
    };

    const filteredRecords = feeRecords.filter(r =>
        r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterStatus === 'All' || r.status === filterStatus.toLowerCase())
    );

    const stats = financeService.getStats(feeRecords);

    // Pie data for payment method split
    const totalCollection = onlineMetrics.totalOnline + onlineMetrics.totalOffline;
    const pieData = [
        { name: t('financeFees.onlinePayments'), value: onlineMetrics.totalOnline },
        { name: t('financeFees.cashPayments'), value: onlineMetrics.totalOffline },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <XCircle className="text-red-600" size={20} />
                        <span className="text-red-800">{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="text-red-600">×</button>
                </div>
            )}

            {successMsg && (
                <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center space-x-3">
                    <CheckCircle className="text-green-600" size={20} />
                    <span className="text-green-800">{successMsg}</span>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <CheckCircle size={32} className="opacity-80" />
                        <span className="text-2xl font-bold">₹{(stats.totalCollected / 100000).toFixed(1)}L</span>
                    </div>
                    <p className="text-green-100 font-medium">{t('financeFees.totalCollected')}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Clock size={32} className="opacity-80" />
                        <span className="text-2xl font-bold">₹{(stats.totalPending / 100000).toFixed(1)}L</span>
                    </div>
                    <p className="text-amber-100 font-medium">{t('financeFees.pendingDues')}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <AlertCircle size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{stats.overdueCount}</span>
                    </div>
                    <p className="text-red-100 font-medium">{t('financeFees.overdueAccounts')}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <CreditCard size={32} className="opacity-80" />
                        <span className="text-3xl font-bold">{stats.collectionRate}%</span>
                    </div>
                    <p className="text-blue-100 font-medium">{t('financeFees.collectionRate')}</p>
                </div>
            </div>

            {/* Online Collection Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Online vs Offline cards */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <Wifi className="text-indigo-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t('financeFees.onlinePayments')}</p>
                            {metricsLoading
                                ? <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1" />
                                : <p className="text-2xl font-bold text-indigo-700">₹{onlineMetrics.totalOnline.toLocaleString()}</p>
                            }
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
                        <div className="p-3 bg-slate-50 rounded-xl">
                            <WifiOff className="text-slate-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold tracking-wide">{t('financeFees.cashPayments')}</p>
                            {metricsLoading
                                ? <div className="h-6 w-24 bg-slate-100 rounded animate-pulse mt-1" />
                                : <p className="text-2xl font-bold text-slate-700">₹{onlineMetrics.totalOffline.toLocaleString()}</p>
                            }
                        </div>
                    </div>
                    {/* Online collection rate */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-wide mb-2">{t('financeFees.onlineCollectionRate')}</p>
                        {metricsLoading ? (
                            <div className="h-4 bg-slate-100 rounded animate-pulse" />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-sm font-semibold text-indigo-700">
                                        {totalCollection > 0 ? Math.round((onlineMetrics.totalOnline / totalCollection) * 100) : 0}%
                                    </span>
                                    <span className="text-xs text-slate-400">of total volume</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div
                                        className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${totalCollection > 0 ? (onlineMetrics.totalOnline / totalCollection) * 100 : 0}%` }}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Monthly Trend Chart */}
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <BarChart2 size={18} className="mr-2 text-indigo-600" />
                        {t('financeFees.monthlyTrends')}
                    </h3>
                    {metricsLoading ? (
                        <div className="h-48 flex items-center justify-center">
                            <Loader2 className="text-indigo-500 animate-spin" size={28} />
                        </div>
                    ) : onlineMetrics.monthlyTrends.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                            No payment data available yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={onlineMetrics.monthlyTrends} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                                />
                                <Bar dataKey="online" name={t('financeFees.onlinePayments')} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="offline" name={t('financeFees.cashPayments')} fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Payment Method Split Donut */}
            {!metricsLoading && pieData.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <TrendingUp size={18} className="mr-2 text-indigo-600" />
                        {t('financeFees.methodSplit')}
                    </h3>
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {pieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                            {pieData.map((item, i) => (
                                <div key={i} className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <div>
                                        <p className="text-xs text-slate-500">{item.name}</p>
                                        <p className="text-sm font-bold text-slate-800">₹{item.value.toLocaleString()}</p>
                                        <p className="text-xs text-slate-400">
                                            {totalCollection > 0 ? Math.round((item.value / totalCollection) * 100) : 0}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('financeFees.searchStudent')}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="All">{t('financeFees.allStatuses')}</option>
                        <option value="Paid">{t('financeFees.paid')}</option>
                        <option value="Partial">{t('financeFees.partial')}</option>
                        <option value="Pending">{t('financeFees.pending')}</option>
                        <option value="Overdue">{t('financeFees.overdue')}</option>
                    </select>
                </div>
                <div className="flex space-x-3">
                    <button onClick={() => { loadData(); loadMetrics(); }} className="flex items-center space-x-2 bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-slate-200" disabled={isLoading}>
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">{t('common.refresh')}</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200">
                        <Download size={18} />
                        <span className="hidden sm:inline">{t('financeFees.exportReport')}</span>
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border p-12 flex items-center justify-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin" />
                    <span className="ml-3 text-slate-600">{t('financeFees.loadingFees')}</span>
                </div>
            )}

            {/* Fee Records Table */}
            {!isLoading && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('financeFees.student')}</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">{t('financeFees.class')}</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">{t('financeFees.amount')}</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">{t('financeFees.paidLabel')}</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">{t('financeFees.due')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('financeFees.status')}</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">{t('financeFees.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{record.student_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{record.class}</td>
                                        <td className="px-6 py-4 text-right font-medium">₹{record.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-medium">₹{record.paid.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-red-600 font-medium">₹{record.due.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${record.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                record.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                                                    record.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {record.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button className="p-2 hover:bg-slate-100 rounded-lg" title="View Details">
                                                    <Eye size={18} className="text-slate-500" />
                                                </button>
                                                {record.due > 0 && (
                                                    <button
                                                        onClick={() => openPaymentModal(record)}
                                                        className="p-2 hover:bg-green-100 rounded-lg"
                                                        title={t('financeFees.recordPayment')}
                                                    >
                                                        <CreditCard size={18} className="text-green-600" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">{t('financeFees.noFeeRecords')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedRecord && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">{t('financeFees.recordPayment')}</h3>
                        <div className="bg-slate-50 rounded-lg p-4 mb-4">
                            <p className="font-medium text-slate-800">{selectedRecord.student_name}</p>
                            <p className="text-sm text-slate-500">{selectedRecord.class}</p>
                            <p className="text-sm text-red-600 mt-1">{t('financeFees.outstanding')} ₹{selectedRecord.due.toLocaleString()}</p>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('financeFees.paymentAmount')}</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={selectedRecord.due}
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg" disabled={isSubmitting}>{t('common.cancel')}</button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={isSubmitting || paymentAmount <= 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50"
                            >
                                {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                                <span>{isSubmitting ? t('financeFees.recording') : t('financeFees.recordPayment')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceFees;
