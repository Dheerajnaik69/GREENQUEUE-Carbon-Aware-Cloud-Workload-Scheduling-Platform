import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { StatCard } from '../../components/common/StatCard';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { EmissionsComparisonChart } from '../../components/charts/EmissionsComparisonChart';
import { WorkloadDistributionChart } from '../../components/charts/WorkloadDistributionChart';
import { RegionalComparisonChart } from '../../components/charts/RegionalComparisonChart';
import { SavingsTrendChart } from '../../components/charts/SavingsTrendChart';
import {
  ListTodo,
  Sparkles,
  Leaf,
  Percent,
  Zap,
  CheckCircle2,
  PlusCircle,
  Presentation,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();
  const { jobs, regions, analytics } = state;

  const realizedSavings = analytics.realizedSavings || 0;
  const projectedSavings = analytics.projectedSavings || 0;
  const totalSavings = analytics.co2Avoided || (realizedSavings + projectedSavings);

  return (
    <div className="space-y-6">
      {/* Top Banner / Callout for Academic Project */}
      <div className="glass-card p-6 border-l-4 border-l-[#75E0A2] relative overflow-hidden bg-gradient-to-r from-[#101A22] via-[#14232B] to-[#101A22]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#75E0A2]/20 text-[#75E0A2] border border-[#75E0A2]/30 uppercase">
                Carbon-Aware Scheduling Engine
              </span>
              <span className="text-xs text-[#8DA29E]">NMIT Bangalore • Green IT Engineering</span>
            </div>
            <h2 className="text-xl font-bold text-[#E8F1EE] mt-2">
              Intelligent Workload Orchestration based on Grid Carbon Intensity
            </h2>
            <p className="text-xs text-[#8DA29E] mt-1 max-w-3xl leading-relaxed">
              GreenQueue shifts flexible cloud workloads to low-carbon electricity hours and cleaner regions while guaranteeing execution deadlines and executing critical urgent workloads immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('/jobs/new')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#E8F1EE] border border-[#24343C] text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#75E0A2]" />
              Submit Job
            </button>
            <button
              onClick={() => navigate('/presentation')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-lg shadow-emerald-500/10 transition-all"
            >
              <Presentation className="w-4 h-4 stroke-[2.5]" />
              Start Guided Demo
            </button>
          </div>
        </div>
      </div>

      {/* 6 Core KPI Cards (PART 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Jobs"
          value={analytics.totalJobs}
          subValue="managed"
          icon={<ListTodo className="w-4 h-4" />}
          badge={`${jobs.filter(j => j.priority === 'urgent').length} urgent`}
          badgeColor="amber"
          description="Total workloads registered"
        />

        <StatCard
          title="Jobs Optimized"
          value={analytics.jobsOptimized}
          subValue="flexible"
          icon={<Sparkles className="w-4 h-4" />}
          badge="Carbon-shifted"
          badgeColor="green"
          description="Delayed to cleaner hours"
        />

        <StatCard
          title="CO₂ Avoided"
          value={`${totalSavings.toFixed(1)} kg`}
          subValue="emissions"
          icon={<Leaf className="w-4 h-4" />}
          badge={`${realizedSavings.toFixed(1)}kg realized`}
          badgeColor="green"
          description={`Projected: ${projectedSavings.toFixed(1)}kg`}
        />

        <StatCard
          title="Avg Reduction"
          value={`${analytics.avgCarbonReduction}%`}
          subValue="per job"
          icon={<Percent className="w-4 h-4" />}
          badge="Optimized"
          badgeColor="green"
          description="vs. conventional baseline"
        />

        <StatCard
          title="Energy Consumed"
          value={`${analytics.totalEnergy} kWh`}
          subValue="total"
          icon={<Zap className="w-4 h-4" />}
          badge="Clean-shifted"
          badgeColor="blue"
          description="Active & completed"
        />

        <StatCard
          title="Executions"
          value={analytics.successfulExecutions}
          subValue="successful"
          icon={<CheckCircle2 className="w-4 h-4" />}
          badge={`${analytics.failedExecutions} failed`}
          badgeColor={analytics.failedExecutions > 0 ? 'amber' : 'green'}
          description="Recorded in audit trail"
        />
      </div>

      {/* Main Grid: Forecast & Emissions Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastChart regions={regions} />
        <EmissionsComparisonChart jobs={jobs} />
      </div>

      {/* Secondary Grid: Workload Distribution, Regional Comparison, Savings Trend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WorkloadDistributionChart jobs={jobs} />
        <RegionalComparisonChart regions={regions} />
        <SavingsTrendChart jobs={jobs} />
      </div>

      {/* Operational Highlights Banner */}
      <div className="glass-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#E8F1EE]">
              Deterministic Scheduling Active
            </h4>
            <p className="text-xs text-[#8DA29E] mt-0.5">
              Evaluating all hourly candidate windows across India, North Europe, and West US. Zero intentional delay applied to urgent workloads.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/scheduler')}
          className="flex items-center gap-2 text-xs font-semibold text-[#75E0A2] hover:text-[#C4F27B] transition-colors shrink-0"
        >
          <span>Inspect Decision Engine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

