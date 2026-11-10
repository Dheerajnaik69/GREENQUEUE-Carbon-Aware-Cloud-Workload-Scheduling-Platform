import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  WORKLOAD_TYPES,
  REGIONS,
  WorkloadType,
  JobPriority,
  RegionId,
  Job
} from '../../types';
import { createJob, updateJobWithScheduling, validateJobInput } from '../../services/jobService';
import { scheduleJob } from '../../services/schedulingService';
import {
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Zap,
  Clock,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf
} from 'lucide-react';

export const JobSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { state, addToast, refreshData } = useApp();
  const { regions, simulation } = state;

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<WorkloadType>('ml-training');
  const [priority, setPriority] = useState<JobPriority>('flexible');
  const [preferredRegion, setPreferredRegion] = useState<RegionId | 'auto'>('auto');
  const [energyKwh, setEnergyKwh] = useState<number>(60);
  const [runtimeHours, setRuntimeHours] = useState<number>(2);
  const [deadlineHours, setDeadlineHours] = useState<number>(12);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Recommendation Preview
  const livePreview = useMemo(() => {
    if (!name.trim() || energyKwh <= 0 || runtimeHours <= 0 || deadlineHours < runtimeHours) {
      return null;
    }

    const dummyJob: Job = {
      id: 'PREVIEW',
      name,
      type,
      description: '',
      priority,
      energyKwh,
      runtimeHours,
      deadlineHours,
      preferredRegion,
      recommendedRegion: null,
      recommendedStartTime: null,
      averageCarbonIntensity: null,
      baselineEmissions: null,
      optimizedEmissions: null,
      estimatedSavings: null,
      actualSavings: null,
      carbonReductionPercent: null,
      status: 'submitted',
      schedulingExplanation: null,
      schedulingCandidates: null,
      createdAt: simulation.currentTime,
      scheduledAt: null,
      startedAt: null,
      completedAt: null,
      executionProgress: 0,
      failureReason: null,
      notes,
    };

    try {
      return scheduleJob(dummyJob, regions, simulation.currentTime, 'india');
    } catch {
      return null;
    }
  }, [name, type, priority, preferredRegion, energyKwh, runtimeHours, deadlineHours, notes, regions, simulation.currentTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateJobInput({
      name,
      energyKwh,
      runtimeHours,
      deadlineHours,
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      addToast('error', 'Validation Error', validationErrors[0]);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      // 1. Create Job
      const newJob = createJob({
        name: name.trim(),
        type,
        priority,
        energyKwh,
        runtimeHours,
        deadlineHours,
        preferredRegion,
        notes,
      }, simulation.currentTime);

      // 2. Invoke Scheduling Algorithm
      const schedulingResult = scheduleJob(newJob, regions, simulation.currentTime, 'india');

      // 3. Update Job with recommendation
      updateJobWithScheduling(newJob.id, {
        recommendedRegion: schedulingResult.recommendedRegion,
        recommendedStartTime: schedulingResult.recommendedStartTime,
        avgCarbonIntensity: schedulingResult.avgCarbonIntensity,
        baselineEmissions: schedulingResult.baselineEmissions,
        optimizedEmissions: schedulingResult.optimizedEmissions,
        estimatedSavings: schedulingResult.estimatedSavings,
        carbonReductionPercent: schedulingResult.carbonReductionPercent,
        explanation: schedulingResult.explanation,
        candidates: schedulingResult.candidates,
      }, simulation.currentTime);

      // 4. Refresh global state
      refreshData();

      addToast(
        'success',
        'Workload Scheduled Successfully',
        `Job ${newJob.id} scheduled in ${schedulingResult.recommendedRegion}. Avoided: ${schedulingResult.estimatedSavings.toFixed(2)} kg CO₂.`
      );

      navigate('/queue');
    } catch (err: any) {
      addToast('error', 'Submission Failed', err.message || 'Could not schedule job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
          Submit Workload for Carbon-Aware Scheduling
        </h2>
        <p className="text-xs text-[#8DA29E] mt-1">
          Specify execution requirements and deadlines. Flexible jobs are evaluated across 24-hour regional electricity forecasts to minimize carbon footprint.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 glass-card p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Banner */}
            {errors.length > 0 && (
              <div className="p-3.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Please resolve the following errors:</span>
                </div>
                <ul className="list-disc list-inside pl-1 text-[11px] text-rose-300/90">
                  {errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Job Name */}
            <div>
              <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                Workload Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ResNet Model Training, Daily Transaction Aggregation"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] placeholder-[#8DA29E]/50 focus:outline-none focus:border-[#75E0A2] transition-colors"
                required
              />
            </div>

            {/* Workload Type & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                  Workload Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as WorkloadType)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
                >
                  {WORKLOAD_TYPES.map((t) => (
                    <option key={t.value} value={t.value} className="bg-[#101A22] text-[#E8F1EE]">
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                  Priority Class *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('flexible')}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      priority === 'flexible'
                        ? 'bg-emerald-500/15 border-[#75E0A2] text-[#75E0A2]'
                        : 'bg-[#14232B] border-[#24343C] text-[#8DA29E] hover:text-[#E8F1EE]'
                    }`}
                  >
                    <Leaf className="w-3.5 h-3.5" />
                    Flexible
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('urgent')}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      priority === 'urgent'
                        ? 'bg-rose-500/15 border-rose-500 text-rose-300'
                        : 'bg-[#14232B] border-[#24343C] text-[#8DA29E] hover:text-[#E8F1EE]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Urgent
                  </button>
                </div>
                <p className="text-[10px] text-[#8DA29E] mt-1">
                  {priority === 'urgent'
                    ? '⚡ Executes immediately. No intentional delay for carbon optimization.'
                    : '🌿 Shifting allowed within deadline window to minimize CO₂.'}
                </p>
              </div>
            </div>

            {/* Region Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                Preferred Region Placement
              </label>
              <select
                value={preferredRegion}
                onChange={(e) => setPreferredRegion(e.target.value as RegionId | 'auto')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
              >
                <option value="auto" className="bg-[#101A22] text-[#E8F1EE]">
                  🌐 Automatic Selection (Evaluate all eligible regions)
                </option>
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#101A22] text-[#E8F1EE]">
                    {r.flag} {r.name} (Restricted to this region only)
                  </option>
                ))}
              </select>
            </div>

            {/* Energy & Runtime */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                  Energy (kWh) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={energyKwh}
                  onChange={(e) => setEnergyKwh(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                  Runtime (Hours) *
                </label>
                <select
                  value={runtimeHours}
                  onChange={(e) => {
                    const newRuntime = Number(e.target.value);
                    setRuntimeHours(newRuntime);
                    if (deadlineHours < newRuntime) {
                      setDeadlineHours(newRuntime);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
                >
                  {[1, 2, 4, 6, 8].map((h) => (
                    <option key={h} value={h} className="bg-[#101A22] text-[#E8F1EE]">
                      {h} {h === 1 ? 'hour' : 'hours'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                  Deadline (Hours) *
                </label>
                <select
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#14232B] border border-[#24343C] text-sm text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
                >
                  {[1, 2, 3, 6, 12, 24].filter(d => d >= runtimeHours).map((d) => (
                    <option key={d} value={d} className="bg-[#101A22] text-[#E8F1EE]">
                      Within {d} hours
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
                Notes / Workload Context (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Execution parameters, SLA details, dataset location..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] placeholder-[#8DA29E]/50 focus:outline-none focus:border-[#75E0A2]"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-sm font-bold hover:brightness-110 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Evaluating Candidates...' : 'Schedule Workload'}</span>
            </button>
          </form>
        </div>

        {/* Live Recommendation Preview Card */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#75E0A2]" />
              <h3 className="text-xs font-bold text-[#E8F1EE] uppercase tracking-wider">
                Live Scheduling Preview
              </h3>
            </div>

            {livePreview ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8DA29E]">Recommended Region:</span>
                    <span className="font-semibold text-[#E8F1EE] capitalize">
                      {livePreview.recommendedRegion}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#8DA29E]">Start Time:</span>
                    <span className="font-mono text-[#75E0A2]">
                      {new Date(livePreview.recommendedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#8DA29E]">Grid Intensity:</span>
                    <span className="font-mono text-[#E8F1EE]">
                      {livePreview.avgCarbonIntensity} gCO₂/kWh
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#8DA29E]">Conventional:</span>
                    <span className="font-mono text-rose-400">
                      {livePreview.baselineEmissions.toFixed(2)} kg CO₂
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[#8DA29E]">Optimized:</span>
                    <span className="font-mono text-emerald-400">
                      {livePreview.optimizedEmissions.toFixed(2)} kg CO₂
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#24343C] flex justify-between font-semibold">
                    <span className="text-[#C4F27B]">Estimated CO₂ Saved:</span>
                    <span className="font-mono text-[#C4F27B]">
                      {livePreview.estimatedSavings.toFixed(2)} kg ({livePreview.carbonReductionPercent}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#14232B]/60 border border-[#24343C] text-[11px] text-[#8DA29E] leading-relaxed">
                  <p className="font-medium text-[#E8F1EE] mb-1">Reasoning:</p>
                  {livePreview.explanation}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8DA29E] space-y-2">
                <Clock className="w-8 h-8 text-[#24343C] mx-auto" />
                <p>Complete the form fields above to preview the real-time scheduling decision.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#24343C] text-[11px] text-[#8DA29E] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#75E0A2] shrink-0" />
            <span>Deterministic ISO 14064 accounting. Zero random numbers.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

