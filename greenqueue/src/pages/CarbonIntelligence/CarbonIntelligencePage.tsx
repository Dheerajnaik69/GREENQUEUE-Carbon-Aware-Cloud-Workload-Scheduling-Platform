import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { RegionId } from '../../types';
import { generateAllForecasts } from '../../services/carbonForecastService';
import { saveRegionData } from '../../services/storageService';
import { rescheduleFlexibleJobs } from '../../services/schedulingService';
import { updateJobWithScheduling } from '../../services/jobService';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { Badge } from '../../components/common/Badge';
import {
  Leaf,
  Globe,
  Sun,
  Wind,
  Zap,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  FastForward,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export const CarbonIntelligencePage: React.FC = () => {
  const { state, dispatch, addToast, advanceTime, refreshForecasts, refreshData } = useApp();
  const { regions, simulation, jobs } = state;

  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>('india');

  // Trigger dynamic grid shift to test scheduler reactivity
  const handleSimulateGridChange = () => {
    // Generate new forecasts with random variability seed
    const newRegions = generateAllForecasts(simulation.currentTime, Date.now() + 9999);
    saveRegionData(newRegions);
    dispatch({ type: 'SET_REGIONS', payload: newRegions });

    // Re-evaluate pending flexible workloads automatically
    const rescheduled = rescheduleFlexibleJobs(jobs, newRegions, simulation.currentTime, 'india');
    let count = 0;
    rescheduled.forEach((res, jobId) => {
      updateJobWithScheduling(jobId, {
        recommendedRegion: res.recommendedRegion,
        recommendedStartTime: res.recommendedStartTime,
        avgCarbonIntensity: res.avgCarbonIntensity,
        baselineEmissions: res.baselineEmissions,
        optimizedEmissions: res.optimizedEmissions,
        estimatedSavings: res.estimatedSavings,
        carbonReductionPercent: res.carbonReductionPercent,
        explanation: res.explanation,
        candidates: res.candidates,
      }, simulation.currentTime);
      count++;
    });

    refreshData();
    addToast(
      'info',
      'Grid Conditions Shifted',
      `Simulated weather & demand fluctuations applied. Re-evaluated ${count} pending flexible workloads!`
    );
  };

  const selectedRegion = regions.find(r => r.id === selectedRegionId) || regions[0];

  // Find cleanest and highest periods for selected region
  const forecast = selectedRegion.hourlyForecast || [];
  const minPoint = forecast.length > 0
    ? [...forecast].sort((a, b) => a.carbonIntensity - b.carbonIntensity)[0]
    : null;
  const maxPoint = forecast.length > 0
    ? [...forecast].sort((a, b) => b.carbonIntensity - a.carbonIntensity)[0]
    : null;

  return (
    <div className="space-y-6">
      {/* Header & Simulation Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
              Regional Carbon Intelligence & Grid Forecasting
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold uppercase">
              Simulated Data
            </span>
          </div>
          <p className="text-xs text-[#8DA29E] mt-1">
            24-hour predictive marginal carbon intensity models for multi-region cloud workloads.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateGridChange}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#75E0A2]/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Grid Fluctuation</span>
          </button>

          <button
            onClick={refreshForecasts}
            className="p-1.5 rounded-lg bg-[#14232B] hover:bg-[#101A22] text-[#8DA29E] border border-[#24343C]"
            title="Refresh Forecast Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Regional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {regions.map((region) => {
          const isSelected = region.id === selectedRegionId;
          const conditionColor = {
            clean: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
            moderate: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
            dirty: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
          }[region.gridCondition];

          return (
            <div
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={`glass-card p-5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#75E0A2] ring-1 ring-[#75E0A2]/50 shadow-xl'
                  : 'hover:border-[#24343C] hover:bg-[#14232B]/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {region.id === 'india' ? '🇮🇳' : region.id === 'north-europe' ? '🇪🇺' : '🇺🇸'}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#E8F1EE]">{region.name}</h3>
                    <p className="text-[10px] text-[#8DA29E] capitalize">{region.id} region</p>
                  </div>
                </div>
                <Badge variant={region.gridCondition}>
                  {region.gridCondition}
                </Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#8DA29E] font-semibold">
                    Current Carbon Intensity
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-[#E8F1EE]">
                      {region.currentCarbonIntensity}
                    </span>
                    <span className="text-xs text-[#8DA29E]">gCO₂/kWh</span>
                  </div>
                </div>

                {/* Renewable Percentage Bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-[#8DA29E] mb-1">
                    <span>Renewable Mix</span>
                    <span className="font-mono text-[#75E0A2] font-semibold">{region.renewablePercentage}%</span>
                  </div>
                  <div className="w-full bg-[#101A22] h-1.5 rounded-full overflow-hidden border border-[#24343C]">
                    <div
                      className="bg-gradient-to-r from-[#27B56E] to-[#75E0A2] h-full rounded-full"
                      style={{ width: `${region.renewablePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#24343C] flex items-center justify-between text-[10px] text-[#8DA29E]">
                  <span>24h Forecast Range:</span>
                  <span className="font-mono text-[#E8F1EE]">
                    {Math.min(...region.hourlyForecast.map(f => f.carbonIntensity))} - {Math.max(...region.hourlyForecast.map(f => f.carbonIntensity))} g
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Forecast Visualization */}
      <ForecastChart regions={regions} />

      {/* Regional Analytics Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Cleanest Window Card */}
        <div className="glass-card p-5 border-l-4 border-l-[#75E0A2]">
          <div className="flex items-center gap-2 mb-2 text-[#75E0A2]">
            <TrendingDown className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Cleanest Execution Window</h4>
          </div>
          {minPoint ? (
            <div>
              <p className="text-lg font-bold text-[#E8F1EE] font-mono">
                {new Date(minPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-[#8DA29E] mt-1">
                Intensity drops to <strong className="text-[#75E0A2]">{minPoint.carbonIntensity} gCO₂/kWh</strong> ({minPoint.renewablePercentage}% renewables)
              </p>
              <p className="text-[10px] text-[#8DA29E] mt-2">
                Optimal time to execute long-running batch processing or ML workloads in {selectedRegion.name}.
              </p>
            </div>
          ) : null}
        </div>

        {/* Highest Carbon Window Card */}
        <div className="glass-card p-5 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <TrendingUp className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Peak Carbon Window</h4>
          </div>
          {maxPoint ? (
            <div>
              <p className="text-lg font-bold text-[#E8F1EE] font-mono">
                {new Date(maxPoint.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-[#8DA29E] mt-1">
                Peaks at <strong className="text-rose-400">{maxPoint.carbonIntensity} gCO₂/kWh</strong> ({maxPoint.renewablePercentage}% renewables)
              </p>
              <p className="text-[10px] text-[#8DA29E] mt-2">
                Scheduler automatically avoids dispatching flexible workloads during this peak emission window.
              </p>
            </div>
          ) : null}
        </div>

        {/* Academic Methodology Callout */}
        <div className="glass-card p-5 border-l-4 border-l-[#7EBDFF]">
          <div className="flex items-center gap-2 mb-2 text-sky-400">
            <Info className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Simulation Methodology</h4>
          </div>
          <p className="text-xs text-[#8DA29E] leading-relaxed">
            Illustrative diurnal solar and wind profiles combined with realistic thermal baseload characteristics.
          </p>
          <div className="mt-3 pt-2 border-t border-[#24343C] text-[10px] text-[#8DA29E] space-y-0.5">
            <p>• India: 400–800 gCO₂/kWh (Coal baseline + mid-day solar)</p>
            <p>• North Europe: 50–250 gCO₂/kWh (High wind penetration)</p>
            <p>• West US: 150–400 gCO₂/kWh (Solar duck-curve profile)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

