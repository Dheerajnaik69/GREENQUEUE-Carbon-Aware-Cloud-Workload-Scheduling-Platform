import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { PRESENTATION_STAGES } from '../../services/demoScenarioService';
import { createJob, updateJobWithScheduling } from '../../services/jobService';
import { scheduleJob } from '../../services/schedulingService';
import { executeJob } from '../../services/executionService';
import { generateAllForecasts } from '../../services/carbonForecastService';
import { saveRegionData } from '../../services/storageService';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { EmissionsComparisonChart } from '../../components/charts/EmissionsComparisonChart';
import { RegionalComparisonChart } from '../../components/charts/RegionalComparisonChart';
import {
  Presentation,
  Play,
  FastForward,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Zap,
  Leaf,
  Globe,
  TrendingDown,
  Info
} from 'lucide-react';

export const PresentationModePage: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch, addToast, advanceTime, refreshData, resetApp } = useApp();
  const { jobs, regions, simulation, analytics } = state;

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const currentStage = PRESENTATION_STAGES[currentStageIdx];

  // Stage 2 helper: Submit Urgent Job
  const handleStage2SubmitUrgent = () => {
    const urgentJob = createJob({
      name: 'Customer Payment API (Live Demo)',
      type: 'web-service',
      priority: 'urgent',
      energyKwh: 20,
      runtimeHours: 1,
      deadlineHours: 2,
      preferredRegion: 'auto',
      notes: 'Demo Stage 2 Urgent Workload',
    }, simulation.currentTime);

    const result = scheduleJob(urgentJob, regions, simulation.currentTime, 'india');
    updateJobWithScheduling(urgentJob.id, {
      recommendedRegion: result.recommendedRegion,
      recommendedStartTime: result.recommendedStartTime,
      avgCarbonIntensity: result.avgCarbonIntensity,
      baselineEmissions: result.baselineEmissions,
      optimizedEmissions: result.optimizedEmissions,
      estimatedSavings: result.estimatedSavings,
      carbonReductionPercent: result.carbonReductionPercent,
      explanation: result.explanation,
      candidates: result.candidates,
    }, simulation.currentTime);

    refreshData();
    addToast('success', 'Urgent Job Created', 'Customer Payment API scheduled for immediate execution with 0h delay!');
  };

  // Stage 3 helper: Submit Flexible ML Workload
  const handleStage3SubmitFlexible = () => {
    const flexJob = createJob({
      name: 'ResNet-50 Distributed Training (Live Demo)',
      type: 'ml-training',
      priority: 'flexible',
      energyKwh: 140,
      runtimeHours: 4,
      deadlineHours: 24,
      preferredRegion: 'auto',
      notes: 'Demo Stage 3 Flexible Workload',
    }, simulation.currentTime);

    const result = scheduleJob(flexJob, regions, simulation.currentTime, 'india');
    updateJobWithScheduling(flexJob.id, {
      recommendedRegion: result.recommendedRegion,
      recommendedStartTime: result.recommendedStartTime,
      avgCarbonIntensity: result.avgCarbonIntensity,
      baselineEmissions: result.baselineEmissions,
      optimizedEmissions: result.optimizedEmissions,
      estimatedSavings: result.estimatedSavings,
      carbonReductionPercent: result.carbonReductionPercent,
      explanation: result.explanation,
      candidates: result.candidates,
    }, simulation.currentTime);

    refreshData();
    addToast('success', 'Flexible Job Scheduled', `Carbon-aware scheduler selected ${result.recommendedRegion}. Saved: ${result.estimatedSavings.toFixed(2)} kg CO₂!`);
  };

  // Stage 4 helper: Simulate Grid Weather Shift
  const handleStage4ShiftGrid = () => {
    const shifted = generateAllForecasts(simulation.currentTime, 7777);
    saveRegionData(shifted);
    dispatch({ type: 'SET_REGIONS', payload: shifted });
    refreshData();
    addToast('info', 'Grid Shifted', 'Dynamic weather/demand changes applied. Flexible workloads re-evaluated!');
  };

  // Stage 5 helper: Execute All Ready Workloads
  const handleStage5ExecuteReady = () => {
    const readyJobs = jobs.filter(j => ['ready', 'scheduled'].includes(j.status));
    if (readyJobs.length === 0) {
      addToast('info', 'No Ready Jobs', 'Advance time or submit workloads first.');
      return;
    }

    readyJobs.forEach((j) => {
      executeJob(
        j,
        regions,
        simulation.currentTime,
        {
          onProgress: () => refreshData(),
          onComplete: () => refreshData(),
          onFail: () => refreshData(),
        },
        false,
        200 // fast progress for demo
      );
    });

    addToast('success', 'Executing Workloads', `Started simulated execution of ${readyJobs.length} workloads!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Presentation Top Control Bar (Projector optimized) */}
      <div className="glass-card p-4 border-2 border-[#75E0A2]/50 bg-gradient-to-r from-[#101A22] via-[#14232B] to-[#101A22] shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Stage Progress */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#75E0A2] to-[#27B56E] text-[#080D12] flex items-center justify-center font-bold text-base shadow-lg">
              {currentStage.stage}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#75E0A2]">
                  Guided Presentation • Stage {currentStage.stage} of 6
                </span>
                <span className="text-[10px] text-[#8DA29E]">NMIT Bangalore Academic Demo</span>
              </div>
              <h2 className="text-lg font-bold text-[#E8F1EE] tracking-tight">
                {currentStage.name}
              </h2>
            </div>
          </div>

          {/* Interactive Presentation Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setCurrentStageIdx(Math.max(0, currentStageIdx - 1))}
              disabled={currentStageIdx === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#E8F1EE] border border-[#24343C] text-xs font-semibold disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentStageIdx(Math.min(PRESENTATION_STAGES.length - 1, currentStageIdx + 1))}
              disabled={currentStageIdx === PRESENTATION_STAGES.length - 1}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-md shadow-emerald-500/20 disabled:opacity-40"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <div className="w-[1px] h-6 bg-[#24343C] mx-1 hidden sm:block" />

            <button
              onClick={() => advanceTime(4)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-semibold"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Advance +4h</span>
            </button>

            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg bg-[#14232B] hover:bg-[#101A22] text-[#8DA29E] hover:text-[#E8F1EE] border border-[#24343C]"
              title="Exit Presentation Mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Presenter Instructions Bar */}
        <div className="mt-4 pt-3 border-t border-[#24343C] flex items-start gap-2.5 text-xs text-[#8DA29E]">
          <Info className="w-4 h-4 text-[#75E0A2] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-[#E8F1EE]">Presenter Guide: </strong>
            {currentStage.instructions}
          </p>
        </div>
      </div>

      {/* Stage Specific Presentation Views */}
      <div className="space-y-6">
        {/* STAGE 1: Environmental Problem */}
        {currentStageIdx === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card p-6 border-l-4 border-l-rose-500 space-y-2">
                <span className="text-2xl">🇮🇳</span>
                <h3 className="text-base font-bold text-[#E8F1EE]">India Grid (Coal Dominant)</h3>
                <p className="text-xs text-[#8DA29E]">
                  Base intensity: <strong>400–800 gCO₂/kWh</strong>. Running workloads at peak hours causes severe thermal coal emissions.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-[#75E0A2] space-y-2">
                <span className="text-2xl">🇪🇺</span>
                <h3 className="text-base font-bold text-[#E8F1EE]">North Europe Grid (High Wind)</h3>
                <p className="text-xs text-[#8DA29E]">
                  Base intensity: <strong>50–250 gCO₂/kWh</strong>. Exceptional renewable penetration. Cleanest region for flexible batch jobs.
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-l-amber-500 space-y-2">
                <span className="text-2xl">🇺🇸</span>
                <h3 className="text-base font-bold text-[#E8F1EE]">West US Grid (Solar Duck Curve)</h3>
                <p className="text-xs text-[#8DA29E]">
                  Base intensity: <strong>150–400 gCO₂/kWh</strong>. Highly variable. Mid-day solar creates deep green windows.
                </p>
              </div>
            </div>

            <ForecastChart regions={regions} />
          </div>
        )}

        {/* STAGE 2: Urgent Workload */}
        {currentStageIdx === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-rose-500">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 uppercase">
                  Zero Delay Guarantee
                </span>
                <h3 className="text-lg font-bold text-[#E8F1EE] mt-2">
                  Urgent Workloads: Instant Execution
                </h3>
                <p className="text-xs text-[#8DA29E] mt-1 max-w-2xl leading-relaxed">
                  Critical customer-facing workloads (e.g. payment gateways, real-time APIs) must execute immediately. GreenQueue does NOT delay urgent workloads for carbon savings, ensuring SLA compliance.
                </p>
              </div>

              <button
                onClick={handleStage2SubmitUrgent}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-rose-500/20 shrink-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Submit Live Payment API Job</span>
              </button>
            </div>

            <RegionalComparisonChart regions={regions} />
          </div>
        )}

        {/* STAGE 3: Flexible Workload */}
        {currentStageIdx === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-[#75E0A2]">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-[#75E0A2] uppercase">
                  Carbon-Aware Shifting
                </span>
                <h3 className="text-lg font-bold text-[#E8F1EE] mt-2">
                  Flexible Workloads: Lowest Emission Execution Slot
                </h3>
                <p className="text-xs text-[#8DA29E] mt-1 max-w-2xl leading-relaxed">
                  Machine learning model training and batch ETL pipelines can tolerate scheduling delays within their SLA deadlines. The scheduler evaluates all candidate windows across 3 regions to minimize CO₂ emissions.
                </p>
              </div>

              <button
                onClick={handleStage3SubmitFlexible}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Leaf className="w-4 h-4 stroke-[2.5]" />
                <span>Submit Live ML Training Job</span>
              </button>
            </div>

            <EmissionsComparisonChart jobs={jobs} />
          </div>
        )}

        {/* STAGE 4: Dynamic Grid Changes */}
        {currentStageIdx === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-amber-500">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 uppercase">
                  Adaptive Resilience
                </span>
                <h3 className="text-lg font-bold text-[#E8F1EE] mt-2">
                  Dynamic Grid Fluctuations & Re-Scheduling
                </h3>
                <p className="text-xs text-[#8DA29E] mt-1 max-w-2xl leading-relaxed">
                  Renewable energy output changes with wind gusts and solar cloud coverage. Watch how GreenQueue detects forecast shifts and immediately re-optimizes pending flexible workloads.
                </p>
              </div>

              <button
                onClick={handleStage4ShiftGrid}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-sky-500 text-[#080D12] text-xs font-bold hover:brightness-110 shadow-lg shadow-amber-500/20 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Wind Drop & Solar Ramp</span>
              </button>
            </div>

            <ForecastChart regions={regions} />
          </div>
        )}

        {/* STAGE 5: Workload Execution */}
        {currentStageIdx === 4 && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-sky-500">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 uppercase">
                  Execution Simulator
                </span>
                <h3 className="text-lg font-bold text-[#E8F1EE] mt-2">
                  Advance Clock & Execute Ready Workloads
                </h3>
                <p className="text-xs text-[#8DA29E] mt-1 max-w-2xl leading-relaxed">
                  As simulated time reaches optimal dispatch windows, scheduled jobs transition to 'Ready' and execute. Real-time progress is tracked and emissions are audited.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => advanceTime(4)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-bold"
                >
                  <FastForward className="w-4 h-4" />
                  <span>Advance +4h</span>
                </button>
                <button
                  onClick={handleStage5ExecuteReady}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Ready Workloads</span>
                </button>
              </div>
            </div>

            {/* Live Queue Preview */}
            <div className="glass-card p-5">
              <h4 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider mb-3">
                Active Queue Status ({jobs.length} Workloads)
              </h4>
              <div className="space-y-2 text-xs">
                {jobs.slice(0, 5).map((j) => (
                  <div key={j.id} className="p-3 rounded-lg bg-[#14232B] border border-[#24343C] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#75E0A2]">{j.id}</span>
                      <span className="font-semibold text-[#E8F1EE]">{j.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#8DA29E] capitalize">{j.recommendedRegion || j.preferredRegion}</span>
                      <span className="font-mono text-[#C4F27B] font-semibold">{j.estimatedSavings ? `-${j.estimatedSavings.toFixed(1)}kg` : '—'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 uppercase">
                        {j.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 6: Environmental Impact */}
        {currentStageIdx === 5 && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 border-l-4 border-l-[#C4F27B] bg-gradient-to-r from-[#101A22] to-emerald-950/20">
              <div className="flex items-center gap-2 text-[#C4F27B]">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="text-lg font-bold text-[#E8F1EE]">
                  Academic Demonstration Complete: Quantified Carbon Savings
                </h3>
              </div>
              <p className="text-xs text-[#8DA29E] mt-1 max-w-3xl leading-relaxed">
                By shifting flexible workloads to low-carbon regions and hours while executing urgent jobs immediately, GreenQueue achieved an average of <strong>{analytics.avgCarbonReduction}%</strong> carbon emission reduction across simulated cloud workloads.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="glass-card p-5 text-center">
                <p className="text-xs text-[#8DA29E] uppercase font-semibold">Total Baseline Emissions</p>
                <p className="text-2xl font-bold font-mono text-rose-400 mt-2">
                  {analytics.baselineEmissions.toFixed(1)} kg CO₂
                </p>
                <p className="text-[10px] text-[#8DA29E] mt-1">Default immediate India dispatch</p>
              </div>

              <div className="glass-card p-5 text-center">
                <p className="text-xs text-[#8DA29E] uppercase font-semibold">GreenQueue Emissions</p>
                <p className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                  {analytics.optimizedEmissions.toFixed(1)} kg CO₂
                </p>
                <p className="text-[10px] text-[#8DA29E] mt-1">Carbon-aware optimized schedule</p>
              </div>

              <div className="glass-card p-5 text-center">
                <p className="text-xs text-[#8DA29E] uppercase font-semibold">Net CO₂ Avoided</p>
                <p className="text-2xl font-bold font-mono text-[#C4F27B] mt-2">
                  {analytics.co2Avoided.toFixed(1)} kg CO₂
                </p>
                <p className="text-[10px] text-[#75E0A2] mt-1 font-semibold">{analytics.avgCarbonReduction}% Overall Reduction</p>
              </div>
            </div>

            <EmissionsComparisonChart jobs={jobs} />
          </div>
        )}
      </div>
    </div>
  );
};

