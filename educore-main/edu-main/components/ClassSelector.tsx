import React from 'react';
import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateClassSelector } from '../utils/translateSubject';

export const CLASSES = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11 - Science",
    "Class 11 - Commerce",
    "Class 11 - Humanities",
    "Class 12 - Science",
    "Class 12 - Commerce",
    "Class 12 - Humanities",
];

export const SECTIONS = ["A", "B", "C", "D"];

interface ClassSelectorProps {
    currentClass: string;
    currentSection: string;
    onClassSelect: (cls: string) => void;
    onSectionSelect: (section: string) => void;
    availableClasses?: string[]; // Optional: restrict to specific classes
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
    currentClass,
    currentSection,
    onClassSelect,
    onSectionSelect,
    availableClasses = CLASSES, // Default to all if not provided
}) => {
    const { i18n } = useTranslation();
    return (
        <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:border-indigo-400 transition-colors shadow-sm">
            <GraduationCap size={16} className="text-indigo-600 flex-shrink-0" />
            <select
                value={currentClass}
                onChange={(e) => onClassSelect(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer focus:ring-0 py-0 pr-1 pl-0 text-sm"
            >
                {availableClasses.map((c) => (
                    <option key={c} value={c}>{translateClassSelector(c, i18n.language)}</option>
                ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
                value={currentSection}
                onChange={(e) => onSectionSelect(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer focus:ring-0 py-0 pr-1 pl-0 text-sm w-12"
            >
                {SECTIONS.map((s) => (
                    <option key={s} value={s}>{i18n.language?.startsWith('ta') ? `பிரிவு ${s}` : `Sec ${s}`}</option>
                ))}
            </select>
        </div>
    );
};

export default ClassSelector;
