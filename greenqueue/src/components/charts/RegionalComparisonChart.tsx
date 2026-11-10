import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { RegionData } from '../../types';

interface RegionalComparisonChartProps {
  regions: RegionData[];
}

export const RegionalComparisonChart: React.FC<RegionalComparisonChartProps> = ({ regions }) => {
  const data = regions.map((r) => ({
    name: r.name,
    intensity: r.currentCarbonIntensity,
    renewables: r.renewablePercentage,
    condition: r.gridCondition,
  }));

  const getColor = (condition: string) => {
    switch (condition) {
      case 'clean': return '#75E0A2';
      case 'moderate': return '#F4BD67';
      case 'dirty': return '#FF7C78';
      default: return '#75E0A2';
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Current Regional Carbon Intensity
          </h3>
          <p className="text-xs text-[#8DA29E] mt-0.5">
            Real-time simulated electricity grid intensity
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#8DA29E]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#75E0A2]" /> Clean
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F4BD67]" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#FF7C78]" /> Dirty
          </span>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#24343C" horizontal={false} />
            <XAxis type="number" stroke="#8DA29E" fontSize={11} tickLine={false} axisLine={false} unit="g" />
            <YAxis type="category" dataKey="name" stroke="#8DA29E" fontSize={11} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="p-2.5 rounded-lg bg-[#101A22] border border-[#24343C] shadow-lg text-xs">
                      <p className="font-semibold text-[#E8F1EE]">{d.name}</p>
                      <p className="text-[#75E0A2] mt-1">
                        Intensity: <strong className="font-mono">{d.intensity}</strong> gCO₂/kWh
                      </p>
                      <p className="text-sky-400">
                        Renewable: <strong className="font-mono">{d.renewables}%</strong>
                      </p>
                      <p className="text-[#8DA29E] capitalize text-[10px] mt-0.5">
                        Status: {d.condition}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="intensity" radius={[0, 4, 4, 0]} barSize={18}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.condition)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

