import React, { useState, useEffect } from 'react';
import { X, BarChart3, Users, BookOpen, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAnalyticsData, AnalyticsData } from '../services/analyticsService';
import { isAnalyticsEnabled } from '../services/supabaseClient';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    LineChart, Line, Legend
} from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface AnalyticsDashboardProps {
    onClose: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!isAnalyticsEnabled) {
                setError(t('institutionalAnalytics.notConfigured'));
                setLoading(false);
                return;
            }

            const result = await getAnalyticsData();
            if (result) {
                setData(result);
            } else {
                setError(t('institutionalAnalytics.failedFetch'));
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{t('institutionalAnalytics.title')}</h2>
                            <p className="text-sm text-slate-500">{t('institutionalAnalytics.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                            {error}
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-indigo-100 text-sm">{t('institutionalAnalytics.totalSessions')}</p>
                                            <p className="text-3xl font-bold mt-1">{data.totalSessions}</p>
                                        </div>
                                        <Users className="w-10 h-10 opacity-50" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-emerald-100 text-sm">{t('institutionalAnalytics.activeCurricula')}</p>
                                            <p className="text-3xl font-bold mt-1">{data.sessionsByCurriculum.length}</p>
                                        </div>
                                        <BookOpen className="w-10 h-10 opacity-50" />
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-amber-100 text-sm">{t('institutionalAnalytics.todaySessions')}</p>
                                            <p className="text-3xl font-bold mt-1">
                                                {data.dailyActivity.length > 0 ? data.dailyActivity[data.dailyActivity.length - 1].sessions : 0}
                                            </p>
                                        </div>
                                        <TrendingUp className="w-10 h-10 opacity-50" />
                                    </div>
                                </div>
                            </div>

                            {data.totalSessions === 0 ? (
                                <div className="text-center py-10 text-slate-500">
                                    <p className="text-lg">{t('institutionalAnalytics.noSessionData')}</p>
                                    <p className="text-sm mt-1">{t('institutionalAnalytics.sessionDataHint')}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Sessions by Role */}
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                        <h3 className="font-semibold text-slate-700 mb-4">{t('institutionalAnalytics.sessionsByRole')}</h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie
                                                    data={data.sessionsByRole}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${t('dashboard.' + name.toLowerCase(), { defaultValue: name })} (${(percent * 100).toFixed(0)}%)`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {data.sessionsByRole.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Sessions by Curriculum */}
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                        <h3 className="font-semibold text-slate-700 mb-4">{t('institutionalAnalytics.sessionsByCurriculum')}</h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={data.sessionsByCurriculum}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Daily Activity */}
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 lg:col-span-2">
                                        <h3 className="font-semibold text-slate-700 mb-4">{t('institutionalAnalytics.dailyActivity')}</h3>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={data.dailyActivity}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
