import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: 'green' | 'amber' | 'blue' | 'purple';
  description?: string;
  isSimulated?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subValue,
  icon,
  badge,
  badgeColor = 'green',
  description,
  isSimulated = true,
}) => {
  const badgeStyles = {
    green: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    blue: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };

  return (
    <div className="glass-card glass-card-hover p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-[#8DA29E] tracking-wider uppercase">
          {title}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-[#14232B] text-[#75E0A2] group-hover:scale-110 transition-transform duration-200">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#E8F1EE]">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-[#8DA29E]">
            {subValue}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {badge && (
          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${badgeStyles[badgeColor]}`}>
            {badge}
          </span>
        )}
        {description && (
          <span className="text-[#8DA29E] truncate text-[11px]">
            {description}
          </span>
        )}
      </div>

      {isSimulated && (
        <span className="absolute bottom-1 right-2 text-[9px] text-[#24343C] group-hover:text-[#8DA29E]/50 transition-colors pointer-events-none">
          Simulated
        </span>
      )}
    </div>
  );
};

