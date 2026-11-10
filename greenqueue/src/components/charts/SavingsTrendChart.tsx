import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Job } from '../../types';

interface SavingsTrendChartProps {
  jobs: Job[];
}

export const SavingsTrendChart: React.FC<SavingsTrendChartProps> = ({ jobs }) => {
  // Sort jobs by createdAt or scheduledAt and compute running cumulative savings
  const sortedJobs = [...jobs]
    .filter(j => j.estimatedSavings !== null)
    .sort((a, b) => a.createdAt - b.createdAt);

  let cumulative = 0;
  const chartData = sortedJobs.map((j) => {
    cumulative += j.estimatedSavings || 0;
    return {
      name: j.id,
      jobName: j.name,
      saved: Number(cumulative.toFixed(2)),
      jobSavings: Number((j.estimatedSavings || 0).toFixed(2)),
    };
  });

  // If no data, provide a baseline entry
  if (chartData.length === 0) {
    chartData.push({ name: 'Init', jobName: 'Baseline', saved: 0, jobSavings: 0 });
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Cumulative CO₂ Avoided
          </h3>
          <p className="text-xs text-[#8DA29E] mt-0.5">
            Carbon reduction impact across scheduled and executed workloads
          </p>
        </div>
        <div className="text-right">
          <span className="text-base font-bold text-[#75E0A2] font-mono">
            {cumulative.toFixed(1)} kg
          </span>
          <p className="text-[10px] text-[#8DA29E]">Total Projected + Realized</p>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C4F27B" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#C4F27B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#24343C" vertical={false} />
            <XAxis dataKey="name" stroke="#8DA29E" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8DA29E" fontSize={11} tickLine={false} axisLine={false} unit="kg" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg bg-[#101A22] border border-[#24343C] shadow-lg text-xs">
                      <p className="font-semibold text-[#E8F1EE]">{d.name}: {d.jobName}</p>
                      <p className="text-lime-300 font-bold mt-1">
                        Cumulative: {d.saved} kg CO₂
                      </p>
                      <p className="text-[#8DA29E] text-[10px]">
                        Job Contribution: +{d.jobSavings} kg CO₂
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="saved"
              stroke="#C4F27B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#savingsGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

