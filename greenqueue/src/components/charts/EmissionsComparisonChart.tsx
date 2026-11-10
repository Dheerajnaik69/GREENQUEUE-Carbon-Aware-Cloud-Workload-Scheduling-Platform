import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Job } from '../../types';

interface EmissionsComparisonChartProps {
  jobs: Job[];
}

export const EmissionsComparisonChart: React.FC<EmissionsComparisonChartProps> = ({ jobs }) => {
  // Aggregate emissions by workload type
  const typeMap: Record<string, { name: string; baseline: number; optimized: number; count: number }> = {};

  const typeLabels: Record<string, string> = {
    'batch': 'Batch',
    'ml-training': 'ML Training',
    'backup': 'Backup',
    'analytics': 'Analytics',
    'web-service': 'Web Service',
    'db-processing': 'DB Processing',
  };

  jobs.forEach((job) => {
    const key = job.type;
    if (!typeMap[key]) {
      typeMap[key] = {
        name: typeLabels[key] || key,
        baseline: 0,
        optimized: 0,
        count: 0,
      };
    }
    typeMap[key].baseline += job.baselineEmissions || 0;
    typeMap[key].optimized += job.optimizedEmissions || 0;
    typeMap[key].count += 1;
  });

  const chartData = Object.values(typeMap).map((item) => ({
    name: item.name,
    baseline: Number(item.baseline.toFixed(1)),
    optimized: Number(item.optimized.toFixed(1)),
    saved: Number(Math.max(0, item.baseline - item.optimized).toFixed(1)),
  }));

  const totalBaseline = chartData.reduce((acc, c) => acc + c.baseline, 0);
  const totalOptimized = chartData.reduce((acc, c) => acc + c.optimized, 0);
  const totalAvoided = Math.max(0, totalBaseline - totalOptimized);
  const percentSaved = totalBaseline > 0 ? Math.round((totalAvoided / totalBaseline) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Emissions Comparison (Conventional vs. GreenQueue)
          </h3>
          <p className="text-xs text-[#8DA29E] mt-0.5">
            Avoided: <span className="text-[#75E0A2] font-semibold">{totalAvoided.toFixed(1)} kg CO₂</span> ({percentSaved}% reduction)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#FF7C78]" />
            <span className="text-[#8DA29E]">Conventional</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#75E0A2]" />
            <span className="text-[#8DA29E]">GreenQueue</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#24343C" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#8DA29E"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8DA29E"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit="kg"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-[#101A22] border border-[#24343C] shadow-xl text-xs">
                      <p className="font-semibold text-[#E8F1EE] mb-1.5">{data.name}</p>
                      <p className="text-rose-400">
                        Conventional: <span className="font-mono font-bold">{data.baseline}</span> kg CO₂
                      </p>
                      <p className="text-emerald-400 mt-0.5">
                        GreenQueue: <span className="font-mono font-bold">{data.optimized}</span> kg CO₂
                      </p>
                      <p className="text-lime-300 font-semibold mt-1 pt-1 border-t border-[#24343C]">
                        CO₂ Avoided: {data.saved} kg ({data.baseline > 0 ? Math.round((data.saved / data.baseline) * 100) : 0}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="baseline" name="Conventional" fill="#FF7C78" radius={[4, 4, 0, 0]} />
            <Bar dataKey="optimized" name="GreenQueue" fill="#75E0A2" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

