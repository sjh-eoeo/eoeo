import React from 'react';

interface DashboardSummaryCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const DashboardSummaryCard: React.FC<DashboardSummaryCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 flex items-center space-x-4">
      {icon && (
        <div className="flex-shrink-0 bg-gray-700/50 rounded-full p-3">
          {icon}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default DashboardSummaryCard;