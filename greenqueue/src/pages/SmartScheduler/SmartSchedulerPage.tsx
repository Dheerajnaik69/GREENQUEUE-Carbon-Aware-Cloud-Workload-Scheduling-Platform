import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Job, SchedulingCandidate } from '../../types';
import { scheduleJob } from '../../services/schedulingService';
import { Badge } from '../../components/common/Badge';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  ShieldCheck,
  Zap,
  Leaf,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SmartSchedulerPage: React.FC = () => {
  const { state } = useApp();
  const { jobs, regions, simulation } = state;

  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[1]?.id || jobs[0]?.id || '');
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'feasible' | 'rejected'>('all');

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // If selected job has candidates, use them; otherwise run scheduler on it live
  const candidates: SchedulingCandidate[] = selectedJob?.schedulingCandidates || (selectedJob ? scheduleJob(selectedJob, regions, simulation.currentTime, 'india').candidates : []);

  const filteredCandidates = candidates.filter((c) => {
    if (candidateFilter === 'feasible') return c.feasible;
    if (candidateFilter === 'rejected') return !c.feasible;
    return true;
  });

  const selectedCandidate = candidates.find(c => c.selected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
            Deterministic Scheduling Engine & Explainability
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase">
            ISO 14064 Compliant
          </span>
        </div>
        <p className="text-xs text-[#8DA29E] mt-1">
          Inspect candidate window generation, deadline constraint evaluations, and deterministic optimization decisions.
        </p>
      </div>

      {/* Workload Selector Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-[#75E0A2]" />
          <div>
            <h4 className="text-xs font-semibold text-[#8DA29E] uppercase tracking-wider">
              Select Workload for Decision Audit
            </h4>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="mt-1 px-3 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs font-bold text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id} className="bg-[#101A22] text-[#E8F1EE]">
                  {j.id} — {j.name} ({j.priority.toUpperCase()}, {j.energyKwh} kWh, {j.runtimeHours}h)
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedJob && (
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[#8DA29E]">Priority:</span>
              <Badge variant={selectedJob.priority} className="ml-1.5">
                {selectedJob.priority}
              </Badge>
            </div>
            <div>
              <span className="text-[#8DA29E]">Status:</span>
              <Badge variant={selectedJob.status} className="ml-1.5">
                {selectedJob.status}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Selected Job Summary & Algorithmic Rationale */}
      {selectedJob && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Natural Language Decision Audit */}
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#75E0A2]" />
              <h3 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider">
                Algorithmic Decision Audit & Natural Language Rationale
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] leading-relaxed">
              <p className="font-semibold text-[#75E0A2] mb-1.5">Executive Summary:</p>
              {selectedJob.schedulingExplanation || 'Evaluating workload parameters...'}
            </div>

            {/* Decision Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Recommended Region</p>
                <p className="text-sm font-bold text-[#E8F1EE] mt-0.5 capitalize">
                  {selectedJob.recommendedRegion || 'Immediate'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Dispatch Slot</p>
                <p className="text-sm font-bold font-mono text-[#75E0A2] mt-0.5">
                  {selectedJob.recommendedStartTime
                    ? new Date(selectedJob.recommendedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Immediate'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Mean Carbon Intensity</p>
                <p className="text-sm font-bold font-mono text-[#E8F1EE] mt-0.5">
                  {selectedJob.averageCarbonIntensity ? `${selectedJob.averageCarbonIntensity} g/kWh` : '—'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Avoided CO₂</p>
                <p className="text-sm font-bold font-mono text-[#C4F27B] mt-0.5">
                  {selectedJob.estimatedSavings?.toFixed(2) || '0.00'} kg
                </p>
              </div>
            </div>
          </div>

          {/* Mathematical Objective & Constraints */}
          <div className="glass-card p-6 flex flex-col justify-between text-xs space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-[#75E0A2]" />
                <h3 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider">
                  Scheduling Mathematical Formulation
                </h3>
              </div>

              <div className="space-y-3 text-[11px] text-[#8DA29E]">
                <div className="p-2.5 rounded-lg bg-[#14232B] border border-[#24343C]">
                  <p className="font-semibold text-[#E8F1EE]">Objective:</p>
                  <p className="font-mono text-[#75E0A2] mt-0.5">
                    min E = (kWh × ∫CI(t)dt / T) / 1000
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#14232B] border border-[#24343C]">
                  <p className="font-semibold text-[#E8F1EE]">Constraints:</p>
                  <p className="mt-0.5">1. t_start + Runtime ≤ Deadline</p>
                  <p>2. Priority == 'urgent' ⇒ t_start = t_now</p>
                  <p>3. Region ∈ EligibleRegions(Job)</p>
                  <p>4. Tie-break rule: min(t_start)</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#24343C] text-[10px] text-[#8DA29E]">
              Evaluated: <strong className="text-[#E8F1EE]">{candidates.length}</strong> possible start windows across all regions.
            </div>
          </div>
        </div>
      )}

      {/* Candidate Window Explorer Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-[#24343C] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider">
              Candidate Execution Windows Evaluated
            </h3>
            <p className="text-[11px] text-[#8DA29E] mt-0.5">
              Each window represents a valid runtime interval evaluated by the GreenQueue scheduling engine
            </p>
          </div>

          {/* Candidate Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#14232B] border border-[#24343C] text-xs">
            <button
              onClick={() => setCandidateFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                candidateFilter === 'all' ? 'bg-[#24343C] text-[#E8F1EE] font-bold' : 'text-[#8DA29E]'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setCandidateFilter('feasible')}
              className={`px-2.5 py-1 rounded transition-colors ${
                candidateFilter === 'feasible' ? 'bg-emerald-500/20 text-[#75E0A2] font-bold' : 'text-[#8DA29E]'
              }`}
            >
              Feasible ({candidates.filter(c => c.feasible).length})
            </button>
            <button
              onClick={() => setCandidateFilter('rejected')}
              className={`px-2.5 py-1 rounded transition-colors ${
                candidateFilter === 'rejected' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-[#8DA29E]'
              }`}
            >
              Rejected ({candidates.filter(c => !c.feasible).length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-[#14232B] border-b border-[#24343C] text-[10px] font-semibold text-[#8DA29E] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Selection</th>
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4">Start Time</th>
                <th className="py-2.5 px-4">End Time</th>
                <th className="py-2.5 px-4">Mean Intensity</th>
                <th className="py-2.5 px-4">Estimated Emissions</th>
                <th className="py-2.5 px-4">Feasibility</th>
                <th className="py-2.5 px-4">Audit Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24343C]/50">
              {filteredCandidates.map((c, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#14232B]/30 transition-colors ${
                    c.selected ? 'bg-emerald-500/10 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-4">
                    {c.selected ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#75E0A2]">
                        <CheckCircle2 className="w-4 h-4" />
                        OPTIMAL
                      </span>
                    ) : (
                      <span className="text-[#8DA29E] font-mono text-[11px]">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 capitalize text-[#E8F1EE]">
                    {c.region}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#E8F1EE]">
                    {new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#8DA29E]">
                    {new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    {c.feasible ? (
                      <span className="text-[#E8F1EE]">{c.avgCarbonIntensity} gCO₂/kWh</span>
                    ) : (
                      <span className="text-[#8DA29E]">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    {c.feasible ? (
                      <span className={c.selected ? 'text-[#75E0A2] font-bold' : 'text-[#8DA29E]'}>
                        {c.estimatedEmissions.toFixed(2)} kg
                      </span>
                    ) : (
                      <span className="text-[#8DA29E]">N/A</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4">
                    {c.feasible ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        FEASIBLE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        DEADLINE VIOLATION
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-[#8DA29E]">
                    {c.selected
                      ? 'Lowest carbon window within deadline constraints.'
                      : c.rejectionReason || 'Feasible alternative; higher emission footprint.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

