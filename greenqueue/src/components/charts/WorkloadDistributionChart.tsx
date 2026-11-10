import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Job } from '../../types';

interface WorkloadDistributionChartProps {
  jobs: Job[];
}

export const WorkloadDistributionChart: React.FC<WorkloadDistributionChartProps> = ({ jobs }) => {
  const urgentCount = jobs.filter(j => j.priority === 'urgent').length;
  const flexibleCount = jobs.filter(j => j.priority === 'flexible').length;

  const statusCounts = {
    scheduled: jobs.filter(j => j.status === 'scheduled').length,
    ready: jobs.filter(j => j.status === 'ready').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  };

  const priorityData = [
    { name: 'Flexible (Optimizable)', value: flexibleCount, color: '#75E0A2' },
    { name: 'Urgent (Zero Delay)', value: urgentCount, color: '#FF7C78' },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Workload Distribution
          </h3>
          <p className="text-xs text-[#8DA29E] mt-0.5">
            By priority & execution readiness
          </p>
        </div>
        <div className="text-xs font-mono text-[#8DA29E]">
          Total: <span className="text-[#E8F1EE] font-bold">{jobs.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* Donut Chart */}
        <div className="h-44 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityData}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2 rounded-lg bg-[#101A22] border border-[#24343C] text-xs">
                        <span className="font-semibold text-[#E8F1EE]">{data.name}: </span>
                        <span className="font-bold text-[#75E0A2]">{data.value} jobs</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-[#E8F1EE] leading-none">{jobs.length}</span>
            <span className="text-[10px] text-[#8DA29E]">Workloads</span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded bg-[#14232B] border border-[#24343C]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#75E0A2]" />
              <span className="text-[#E8F1EE]">Flexible Workloads</span>
            </div>
            <span className="font-mono font-bold text-[#75E0A2]">{flexibleCount}</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded bg-[#14232B] border border-[#24343C]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF7C78]" />
              <span className="text-[#E8F1EE]">Urgent (Immediate)</span>
            </div>
            <span className="font-mono font-bold text-rose-400">{urgentCount}</span>
          </div>

          <div className="pt-2 border-t border-[#24343C] flex items-center justify-between text-[11px] text-[#8DA29E]">
            <span>Scheduled: <strong className="text-[#E8F1EE]">{statusCounts.scheduled}</strong></span>
            <span>Ready: <strong className="text-lime-400">{statusCounts.ready}</strong></span>
            <span>Running: <strong className="text-amber-400">{statusCounts.running}</strong></span>
            <span>Completed: <strong className="text-emerald-400">{statusCounts.completed}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

