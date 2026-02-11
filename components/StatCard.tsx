import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => {
  return (
    <div className="bg-nebula-900 border border-nebula-700 p-5 rounded-xl flex items-start justify-between shadow-lg hover:border-nebula-500 transition-colors">
      <div>
        <p className="text-nebula-100/60 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {trend && (
          <p className={`text-xs mt-2 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className="text-3xl bg-nebula-800 p-3 rounded-lg border border-nebula-700">
        {icon}
      </div>
    </div>
  );
};