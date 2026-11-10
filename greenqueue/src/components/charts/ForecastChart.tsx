import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { RegionData, RegionId } from '../../types';

interface ForecastChartProps {
  regions: RegionData[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ regions }) => {
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('india');

  const currentRegionData = regions.find(r => r.id === selectedRegion) || regions[0];

  const chartData = currentRegionData?.hourlyForecast.map((point) => {
    const d = new Date(point.timestamp);
    const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    return {
      time: timeLabel,
      intensity: point.carbonIntensity,
      renewables: point.renewablePercentage,
    };
  }) || [];

  const avgIntensity = chartData.length > 0
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.intensity, 0) / chartData.length)
    : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
              24-Hour Carbon Intensity Forecast
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
              Simulated Forecast
            </span>
          </div>
          <p className="text-xs text-[#8DA29E] mt-0.5">
            Average: <span className="text-[#E8F1EE] font-semibold">{avgIntensity} gCO₂/kWh</span> • Dynamic grid forecasting
          </p>
        </div>

        {/* Region Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#14232B] border border-[#24343C]">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                selectedRegion === r.id
                  ? 'bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] shadow-sm'
                  : 'text-[#8DA29E] hover:text-[#E8F1EE] hover:bg-[#101A22]'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#75E0A2" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#75E0A2" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#24343C" vertical={false} />
            <XAxis
              dataKey="time"
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
              unit="g"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 rounded-lg bg-[#101A22] border border-[#24343C] shadow-xl text-xs">
                      <p className="font-semibold text-[#E8F1EE] mb-1">{data.time}</p>
                      <p className="text-emerald-400">
                        Carbon Intensity: <span className="font-mono font-bold">{data.intensity}</span> gCO₂/kWh
                      </p>
                      <p className="text-sky-400 mt-0.5">
                        Renewable Share: <span className="font-mono font-bold">{data.renewables}%</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={avgIntensity}
              stroke="#F4BD67"
              strokeDasharray="4 4"
              label={{
                value: `Avg ${avgIntensity}g`,
                fill: '#F4BD67',
                fontSize: 10,
                position: 'right'
              }}
            />
            <Area
              type="monotone"
              dataKey="intensity"
              stroke="#75E0A2"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#carbonGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

