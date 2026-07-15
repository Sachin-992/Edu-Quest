import React, { useState } from 'react';
import { User } from '../../types/schema';
import { UserRole } from '../../types';
import {
    Search,
    Filter,
    UserPlus,
    MoreVertical,
    ShieldAlert,
    CheckCircle,
    XCircle,
    Edit2,
    Trash2
} from 'lucide-react';

export const UserManagement: React.FC = () => {
    // MOCK DATA for Prototype (Engine 14 should fetch this from Supabase)
    const [users, setUsers] = useState<any[]>([ // Using any temporarily to avoid strict schema conflicts during dev
        { id: 'usr_001', name: 'Demo Admin', email: 'admin@educore.edu', role: 'ADMIN', status: 'Active', lastLogin: '2025-10-24 09:30' },
        { id: 'usr_002', name: 'Rahul Sharma', email: 'rahul.s@educore.edu', role: 'TEACHER', status: 'Active', lastLogin: '2025-10-24 08:15' },
        { id: 'usr_003', name: 'Priya Patel', email: 'priya.p@educore.edu', role: 'STUDENT', status: 'Active', lastLogin: '2025-10-23 14:20' },
        { id: 'usr_004', name: 'Amit Verma', email: 'amit.v@parent.edu', role: 'PARENT', status: 'Active', lastLogin: '2025-10-22 18:45' },
        { id: 'usr_005', name: 'Sita Gupta', email: 'sita.g@educore.edu', role: 'TEACHER', status: 'Inactive', lastLogin: '2025-09-15 11:00' },
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'ALL' ? true : user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search users by name or ID..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="relative">
                        <select
                            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">Admins</option>
                            <option value="TEACHER">Teachers</option>
                            <option value="STUDENT">Students</option>
                            <option value="PARENT">Parents</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    </div>

                    <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                        <UserPlus size={18} />
                        <span className="font-medium whitespace-nowrap">Add User</span>
                    </button>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User Identity</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Login</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{user.name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800 border-red-200' :
                                            user.role === 'TEACHER' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                user.role === 'STUDENT' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    'bg-green-100 text-green-800 border-green-200'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {user.status === 'Active' ? (
                                                <CheckCircle size={16} className="text-emerald-500 mr-1.5" />
                                            ) : (
                                                <XCircle size={16} className="text-slate-400 mr-1.5" />
                                            )}
                                            <span className={`text-sm ${user.status === 'Active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {user.lastLogin}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination / Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-sm text-slate-500 flex justify-between items-center">
                    <span>Showing {filteredUsers.length} of {users.length} users</span>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Previous</button>
                        <button className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
