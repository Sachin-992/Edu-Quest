import React from 'react';
import { UserRole } from '../types';
import { ROLE_DESCRIPTIONS } from '../constants';
import { GraduationCap, BookOpen, Building2, Briefcase } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ currentRole, onRoleSelect }) => {

  const getIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.STUDENT: return <GraduationCap className="w-5 h-5" />;
      case UserRole.TEACHER: return <BookOpen className="w-5 h-5" />;
      case UserRole.ADMIN: return <Building2 className="w-5 h-5" />;
      case UserRole.PROFESSIONAL: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white border-b border-slate-200">
      {Object.values(UserRole).map((role) => (
        <button
          key={role}
          onClick={() => onRoleSelect(role)}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 ${currentRole === role
              ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
              : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:bg-slate-50'
            }`}
        >
          <div className="mb-2">{getIcon(role)}</div>
          <span className="font-semibold text-sm">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
          <span className="text-[10px] text-center mt-1 hidden sm:block opacity-80">
            {ROLE_DESCRIPTIONS[role]}
          </span>
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;