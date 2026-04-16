
import React from 'react';

interface ReportSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const ReportSection: React.FC<ReportSectionProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        {icon && <div className="text-blue-600">{icon}</div>}
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
      </div>
      <div className="text-slate-600 space-y-3">
        {children}
      </div>
    </div>
  );
};

export default ReportSection;
