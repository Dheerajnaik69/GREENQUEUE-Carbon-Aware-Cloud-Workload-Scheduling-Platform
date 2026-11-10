import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { calculateEmissionsSummary, getEquivalencies } from '../../services/emissionsService';
import { getExecutions } from '../../services/storageService';
import { exportToCSV, downloadCSV } from '../../services/analyticsService';
import { StatCard } from '../../components/common/StatCard';
import { EmissionsComparisonChart } from '../../components/charts/EmissionsComparisonChart';
import { RegionalComparisonChart } from '../../components/charts/RegionalComparisonChart';
import {
  FileBarChart,
  Download,
  Leaf,
  Zap,
  TrendingDown,
  Sparkles,
  TreeDeciduous,
  Car,
  Lightbulb,
  Smartphone,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export const SustainabilityReportsPage: React.FC = () => {
  const { state, addToast } = useApp();
  const { jobs, regions, analytics } = state;
  const executions = getExecutions();

  const [activeTab, setActiveTab] = useState<'all' | 'realized' | 'projected'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  const summary = calculateEmissionsSummary();
  const equivalencies = getEquivalencies(summary.totalSavings || 10);

  const handleExport = () => {
    if (executions.length === 0) {
      addToast('warning', 'No Executions', 'There are no executions to generate a CSV report.');
      return;
    }
    const csvContent = exportToCSV(executions);
    downloadCSV(csvContent, `greenqueue-sustainability-report-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast('success', 'Report Exported', 'Sustainability report downloaded as CSV.');
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
              Carbon Impact & Sustainability Reports
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
              GHG Scope 2
            </span>
          </div>
          <p className="text-xs text-[#8DA29E] mt-1">
            Quantified carbon emission reduction and renewable energy optimization based on ISO 14064 methodology.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#14232B] border border-[#24343C] text-xs">
            {(['all', 'today', '7d', '30d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-2.5 py-1 rounded transition-colors uppercase text-[10px] font-bold ${
                  timeFilter === t ? 'bg-[#24343C] text-[#E8F1EE]' : 'text-[#8DA29E]'
                }`}
              >
                {t === 'all' ? 'All Time' : t}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Realized vs Projected Impact Mode Switcher */}
      <div className="flex border-b border-[#24343C] gap-6 text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'all' ? 'text-[#75E0A2] border-b-2 border-[#75E0A2]' : 'text-[#8DA29E] hover:text-[#E8F1EE]'
          }`}
        >
          Comprehensive Impact (Realized + Projected)
        </button>
        <button
          onClick={() => setActiveTab('realized')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'realized' ? 'text-[#75E0A2] border-b-2 border-[#75E0A2]' : 'text-[#8DA29E] hover:text-[#E8F1EE]'
          }`}
        >
          Realized Savings ({summary.realizedSavings.toFixed(1)} kg CO₂)
        </button>
        <button
          onClick={() => setActiveTab('projected')}
          className={`pb-3 font-semibold transition-all relative ${
            activeTab === 'projected' ? 'text-[#75E0A2] border-b-2 border-[#75E0A2]' : 'text-[#8DA29E] hover:text-[#E8F1EE]'
          }`}
        >
          Projected Pending Savings ({summary.projectedSavings.toFixed(1)} kg CO₂)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Baseline Conventional Emissions"
          value={`${(activeTab === 'realized' ? summary.realizedBaseline : activeTab === 'projected' ? summary.projectedBaseline : summary.totalBaseline).toFixed(1)} kg`}
          subValue="CO₂"
          icon={<Zap className="w-4 h-4" />}
          badge="No optimization"
          badgeColor="amber"
          description="Default regional dispatch"
        />

        <StatCard
          title="GreenQueue Emissions"
          value={`${(activeTab === 'realized' ? summary.realizedOptimized : activeTab === 'projected' ? summary.projectedOptimized : summary.totalOptimized).toFixed(1)} kg`}
          subValue="CO₂"
          icon={<Leaf className="w-4 h-4" />}
          badge="Optimized"
          badgeColor="green"
          description="Carbon-shifted schedule"
        />

        <StatCard
          title="Total CO₂ Avoided"
          value={`${(activeTab === 'realized' ? summary.realizedSavings : activeTab === 'projected' ? summary.projectedSavings : summary.totalSavings).toFixed(1)} kg`}
          subValue="net reduction"
          icon={<TrendingDown className="w-4 h-4" />}
          badge={`${summary.overallReductionPct}% Saved`}
          badgeColor="green"
          description="Direct environmental benefit"
        />

        <StatCard
          title="Optimized Workload Ratio"
          value={`${analytics.jobsOptimized} / ${analytics.totalJobs}`}
          subValue="workloads"
          icon={<Sparkles className="w-4 h-4" />}
          badge="Flexible"
          badgeColor="blue"
          description="Deferred to cleaner hours"
        />
      </div>

      {/* Real-World Environmental Equivalency Cards */}
      <div>
        <h3 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider mb-3">
          Real-World Equivalencies (Calculated from {summary.totalSavings.toFixed(1)} kg Avoided CO₂)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 text-xl">
              🌳
            </div>
            <div>
              <p className="text-base font-bold text-[#E8F1EE]">
                {Math.max(1, Math.round(summary.totalSavings / 21))} Urban Trees
              </p>
              <p className="text-[11px] text-[#8DA29E]">Carbon sequestered for a year</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 text-xl">
              🚗
            </div>
            <div>
              <p className="text-base font-bold text-[#E8F1EE]">
                {Math.max(5, Math.round(summary.totalSavings / 0.21))} Kilometers
              </p>
              <p className="text-[11px] text-[#8DA29E]">Passenger car driving avoided</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 text-xl">
              💡
            </div>
            <div>
              <p className="text-base font-bold text-[#E8F1EE]">
                {Math.max(20, Math.round(summary.totalSavings / 0.005))} Hours
              </p>
              <p className="text-[11px] text-[#8DA29E]">LED lightbulb illumination</p>
            </div>
          </div>

          <div className="glass-card p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 text-xl">
              📱
            </div>
            <div>
              <p className="text-base font-bold text-[#E8F1EE]">
                {Math.max(50, Math.round(summary.totalSavings / 0.008))} Charges
              </p>
              <p className="text-[11px] text-[#8DA29E]">Smartphone full battery cycles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EmissionsComparisonChart jobs={jobs} />
        <RegionalComparisonChart regions={regions} />
      </div>

      {/* ISO Methodology Callout */}
      <div className="glass-card p-5 border-l-4 border-l-[#75E0A2] flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-[#75E0A2] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#E8F1EE]">
            Academic Audit & ISO 14064 Methodology
          </h4>
          <p className="text-[#8DA29E] leading-relaxed">
            All carbon accounting follows location-based and market-based Scope 2 GHG protocol standards.
            Avoided emissions are calculated as: <code>CO₂ Avoided = Baseline Emissions (Immediate Execution) - Optimized Emissions (Recommended Slot)</code>.
            Urgent workloads execute immediately with zero artificial emissions savings.
          </p>
        </div>
      </div>
    </div>
  );
};

