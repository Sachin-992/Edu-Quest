import React from 'react';
import { Book } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateCurriculum } from '../utils/translateSubject';

export const CURRICULA = [
  "General / Unspecified",
  "CBSE (India)",
  "ICSE (India)",
  "IB (International)",
  "IGCSE (Cambridge)",
  "Common Core (US)",
  "State Board",
  "University / Higher Ed",
  "Professional Certification"
];

interface CurriculumSelectorProps {
  currentCurriculum: string;
  onCurriculumSelect: (c: string) => void;
}

const CurriculumSelector: React.FC<CurriculumSelectorProps> = ({ currentCurriculum, onCurriculumSelect }) => {
  const { i18n } = useTranslation();
  return (
    <div className="flex items-center space-x-2 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:border-indigo-400 transition-colors shadow-sm">
        <Book size={16} className="text-indigo-600 flex-shrink-0" />
        <select 
            value={currentCurriculum}
            onChange={(e) => onCurriculumSelect(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer w-full focus:ring-0 py-0 pr-2 pl-0 text-sm"
        >
            {CURRICULA.map((c) => (
                <option key={c} value={c}>{translateCurriculum(c, i18n.language)}</option>
            ))}
        </select>
    </div>
  );
};

export default CurriculumSelector;