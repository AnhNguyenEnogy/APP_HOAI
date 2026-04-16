
import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ level }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';

  if (level === RiskLevel.LOW || level.includes('Thấp')) {
    bgColor = 'bg-green-100';
    textColor = 'text-green-700';
  } else if (level === RiskLevel.MEDIUM || level.includes('Trung bình')) {
    bgColor = 'bg-yellow-100';
    textColor = 'text-yellow-700';
  } else if (level === RiskLevel.HIGH || level.includes('Cao')) {
    bgColor = 'bg-red-100';
    textColor = 'text-red-700';
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${bgColor} ${textColor}`}>
      {level}
    </span>
  );
};

export default RiskBadge;
