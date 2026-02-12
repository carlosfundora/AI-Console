
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, className = "", size = 'md' }) => {
  const isSmall = size === 'sm';

  return (
    <div className={`bg-nebula-900 border border-nebula-700 rounded-xl flex ${isSmall ? 'items-center' : 'items-start'} justify-between shadow-lg hover:border-nebula-500 transition-colors ${isSmall ? 'px-4 py-3' : 'p-5'} ${className}`}>
      <div className="flex flex-col">
        <p className={`text-nebula-100/60 font-medium ${isSmall ? 'text-[10px] uppercase tracking-wider mb-0.5' : 'text-sm mb-1'}`}>{title}</p>
        <div className={`flex items-baseline ${isSmall ? 'gap-2' : ''}`}>
            <h3 className={`font-bold text-white ${isSmall ? 'text-lg leading-none' : 'text-2xl'}`}>{value}</h3>
            {isSmall && trend && (
                <span className={`text-[10px] font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
                    {trend}
                </span>
            )}
        </div>
        {!isSmall && trend && (
          <p className={`text-xs mt-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </p>
        )}
      </div>
      <div className={`rounded-lg border border-nebula-700 flex items-center justify-center shrink-0 ml-3 ${isSmall ? 'text-lg p-2 bg-nebula-800/50' : 'text-3xl bg-nebula-800 p-3'}`}>
        {icon}
      </div>
    </div>
  );
};
