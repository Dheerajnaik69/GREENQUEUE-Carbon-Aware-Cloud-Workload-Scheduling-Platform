import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { Job, JobPriority, JobStatus } from '../../types';
import { executeJob, cancelExecution, isJobExecuting } from '../../services/executionService';
import { deleteJobById, updateJobStatus } from '../../services/jobService';
import { rescheduleJob } from '../../services/schedulingService';
import { Badge } from '../../components/common/Badge';
import {
  Search,
  Filter,
  Play,
  RotateCcw,
  XCircle,
  Trash2,
  Clock,
  Eye,
  AlertCircle,
  Leaf,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';

export const WorkloadQueuePage: React.FC = () => {
  const { state, addToast, refreshData } = useApp();
  const { jobs, regions, simulation } = state;

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | JobPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filtered jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Handle Execution
  const handleExecute = (job: Job, override: boolean = false) => {
    if (isJobExecuting(job.id)) {
      addToast('warning', 'Already Running', `Job ${job.id} is already executing.`);
      return;
    }

    if (override) {
      if (!window.confirm(`Job ${job.id} is scheduled for a later clean window. Running it now will use current grid conditions and may reduce carbon savings. Proceed with override?`)) {
        return;
      }
    }

    addToast('info', 'Execution Started', `Executing "${job.name}" in ${job.recommendedRegion || 'india'}...`);

    executeJob(
      job,
      regions,
      simulation.currentTime,
      {
        onProgress: (_id, _progress) => {
          refreshData();
        },
        onComplete: (id, record) => {
          refreshData();
          addToast(
            'success',
            'Execution Complete',
            `Job ${id} finished successfully! Saved ${record.co2Avoided.toFixed(2)} kg CO₂.`
          );
        },
        onFail: (id, reason) => {
          refreshData();
          addToast('error', 'Execution Failed', `Job ${id} failed: ${reason}`);
        },
      },
      false, // normal run
      400 // tick speed
    );
  };

  // Handle Retry
  const handleRetry = (job: Job) => {
    updateJobStatus(job.id, 'ready', {
      executionProgress: 0,
      failureReason: null,
    });
    refreshData();
    addToast('info', 'Job Reset', `Job ${job.id} reset to Ready status.`);
  };

  // Handle Cancel
  const handleCancel = (job: Job) => {
    cancelExecution(job.id);
    refreshData();
    addToast('warning', 'Execution Cancelled', `Job ${job.id} cancelled.`);
  };

  // Handle Delete
  const handleDelete = (jobId: string) => {
    if (window.confirm(`Are you sure you want to delete job ${jobId}? This action cannot be undone.`)) {
      deleteJobById(jobId);
      refreshData();
      addToast('info', 'Job Deleted', `Job ${jobId} deleted from queue.`);
    }
  };

  // Reschedule single job with fresh forecasts
  const handleReschedule = (job: Job) => {
    const result = rescheduleJob(job, regions, simulation.currentTime, 'india');
    updateJobStatus(job.id, job.priority === 'urgent' ? 'ready' : 'scheduled', {
      recommendedRegion: result.recommendedRegion,
      recommendedStartTime: result.recommendedStartTime,
      averageCarbonIntensity: result.avgCarbonIntensity,
      baselineEmissions: result.baselineEmissions,
      optimizedEmissions: result.optimizedEmissions,
      estimatedSavings: result.estimatedSavings,
      carbonReductionPercent: result.carbonReductionPercent,
      schedulingExplanation: result.explanation,
      schedulingCandidates: result.candidates,
    });
    refreshData();
    addToast('info', 'Job Rescheduled', `Updated schedule for ${job.id} using latest forecasts.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
            Workload Scheduling & Execution Queue
          </h2>
          <p className="text-xs text-[#8DA29E] mt-1">
            Manage pending, scheduled, and active workloads. Urgent jobs execute immediately; flexible workloads run during optimal green windows.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8DA29E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs..."
              className="pl-8 pr-3 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] placeholder-[#8DA29E]/50 focus:outline-none focus:border-[#75E0A2] w-40 sm:w-52"
            />
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">⚡ Urgent Only</option>
            <option value="flexible">🌿 Flexible Only</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
          >
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="ready">Ready</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Queue Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#24343C] bg-[#14232B]/50 text-[11px] font-semibold text-[#8DA29E] uppercase tracking-wider">
                <th className="py-3.5 px-4">Job Details</th>
                <th className="py-3.5 px-4">Priority & Type</th>
                <th className="py-3.5 px-4">Region</th>
                <th className="py-3.5 px-4">Scheduled Slot</th>
                <th className="py-3.5 px-4">Intensity / CO₂</th>
                <th className="py-3.5 px-4">Status & Progress</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24343C]/60 text-xs">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8DA29E]">
                    <Clock className="w-8 h-8 text-[#24343C] mx-auto mb-2" />
                    <p className="font-medium text-[#E8F1EE]">No workloads match your filter</p>
                    <p className="text-xs text-[#8DA29E] mt-0.5">Try clearing your search query or submit a new workload</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const isReady = job.status === 'ready' || (job.status === 'scheduled' && job.recommendedStartTime && simulation.currentTime >= job.recommendedStartTime);
                  const isRunning = job.status === 'running';

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-[#14232B]/40 transition-colors group"
                    >
                      {/* Job ID & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#75E0A2] bg-[#75E0A2]/10 px-1.5 py-0.5 rounded border border-[#75E0A2]/20">
                            {job.id}
                          </span>
                          <div>
                            <span className="font-semibold text-[#E8F1EE] group-hover:text-[#75E0A2] transition-colors">
                              {job.name}
                            </span>
                            <p className="text-[10px] text-[#8DA29E]">
                              {job.energyKwh} kWh • {job.runtimeHours}h runtime
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Priority & Type */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={job.priority}>
                            {job.priority === 'urgent' ? '⚡ Urgent' : '🌿 Flexible'}
                          </Badge>
                          <span className="text-[10px] text-[#8DA29E] capitalize">
                            {job.type.replace('-', ' ')}
                          </span>
                        </div>
                      </td>

                      {/* Region */}
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-medium text-[#E8F1EE] capitalize">
                            {job.recommendedRegion || job.preferredRegion}
                          </span>
                          <p className="text-[10px] text-[#8DA29E]">
                            Pref: {job.preferredRegion === 'auto' ? 'Auto-Select' : job.preferredRegion}
                          </p>
                        </div>
                      </td>

                      {/* Scheduled Slot */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {job.recommendedStartTime ? (
                          <div>
                            <span className="text-[#E8F1EE]">
                              {new Date(job.recommendedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </span>
                            <p className="text-[10px] text-[#8DA29E]">
                              Deadline: {job.deadlineHours}h
                            </p>
                          </div>
                        ) : (
                          <span className="text-[#8DA29E]">Immediate</span>
                        )}
                      </td>

                      {/* Carbon Intensity & Emissions */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[#E8F1EE]">
                            {job.averageCarbonIntensity ? `${job.averageCarbonIntensity} g` : '—'}
                          </span>
                          {job.estimatedSavings && job.estimatedSavings > 0 ? (
                            <p className="text-[10px] text-[#C4F27B] font-semibold">
                              Saved: {job.estimatedSavings.toFixed(2)} kg ({job.carbonReductionPercent}%)
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#8DA29E]">
                              Emissions: {job.optimizedEmissions?.toFixed(2) || '—'} kg
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status & Progress Bar */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 min-w-[120px]">
                          <Badge variant={isReady && job.status === 'scheduled' ? 'ready' : job.status}>
                            {isReady && job.status === 'scheduled' ? 'Ready to Run' : job.status}
                          </Badge>

                          {isRunning && (
                            <div className="w-full bg-[#24343C] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#75E0A2] h-full transition-all duration-300 rounded-full"
                                style={{ width: `${job.executionProgress || 0}%` }}
                              />
                            </div>
                          )}
                          {job.failureReason && (
                            <p className="text-[10px] text-rose-400 truncate max-w-[140px]" title={job.failureReason}>
                              {job.failureReason}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Decision Details */}
                          <button
                            onClick={() => setSelectedJob(job)}
                            title="Inspect scheduling candidates and decision rationale"
                            className="p-1.5 rounded bg-[#14232B] hover:bg-[#1f333f] text-[#8DA29E] hover:text-[#75E0A2] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Execute Button */}
                          {['scheduled', 'ready', 'submitted'].includes(job.status) && (
                            <button
                              onClick={() => handleExecute(job, !isReady)}
                              title={isReady ? 'Execute workload now' : 'Override schedule & execute early'}
                              className={`p-1.5 rounded font-semibold text-xs flex items-center gap-1 transition-all ${
                                isReady
                                  ? 'bg-emerald-500/20 text-[#75E0A2] hover:bg-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}

                          {/* Retry (if failed) */}
                          {job.status === 'failed' && (
                            <button
                              onClick={() => handleRetry(job)}
                              title="Reset and retry workload"
                              className="p-1.5 rounded bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel (if running) */}
                          {job.status === 'running' && (
                            <button
                              onClick={() => handleCancel(job)}
                              title="Cancel execution"
                              className="p-1.5 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(job.id)}
                            title="Delete job from queue"
                            className="p-1.5 rounded bg-[#14232B] hover:bg-rose-500/20 text-[#8DA29E] hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Explanation Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#24343C] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#75E0A2] px-2 py-0.5 rounded bg-[#75E0A2]/10 border border-[#75E0A2]/20">
                    {selectedJob.id}
                  </span>
                  <h3 className="text-base font-bold text-[#E8F1EE]">{selectedJob.name}</h3>
                </div>
                <p className="text-xs text-[#8DA29E] mt-0.5">
                  Algorithm Decision Audit • {selectedJob.priority.toUpperCase()} Workload
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-[#8DA29E] hover:text-[#E8F1EE] p-1 rounded-lg hover:bg-[#14232B]"
              >
                ✕
              </button>
            </div>

            {/* Explanation text */}
            <div className="p-4 rounded-xl bg-[#14232B] border border-[#24343C] space-y-2">
              <h4 className="text-xs font-bold text-[#75E0A2] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Scheduling Engine Rationale
              </h4>
              <p className="text-xs text-[#E8F1EE] leading-relaxed">
                {selectedJob.schedulingExplanation || 'No detailed explanation recorded.'}
              </p>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Conventional</p>
                <p className="text-base font-bold text-rose-400 mt-1 font-mono">
                  {selectedJob.baselineEmissions?.toFixed(2) || '0.00'} kg
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Optimized</p>
                <p className="text-base font-bold text-emerald-400 mt-1 font-mono">
                  {selectedJob.optimizedEmissions?.toFixed(2) || '0.00'} kg
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#14232B] border border-[#24343C]">
                <p className="text-[10px] text-[#8DA29E] uppercase">Avoided CO₂</p>
                <p className="text-base font-bold text-[#C4F27B] mt-1 font-mono">
                  {selectedJob.estimatedSavings?.toFixed(2) || '0.00'} kg
                </p>
              </div>
            </div>

            {/* Candidates evaluated count */}
            {selectedJob.schedulingCandidates && (
              <div>
                <h4 className="text-xs font-semibold text-[#8DA29E] uppercase tracking-wider mb-2">
                  Candidates Evaluated ({selectedJob.schedulingCandidates.length} Windows)
                </h4>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[#24343C] divide-y divide-[#24343C] text-[11px]">
                  {selectedJob.schedulingCandidates.map((c, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 flex items-center justify-between ${
                        c.selected ? 'bg-emerald-500/10 text-emerald-300 font-semibold' : 'text-[#8DA29E]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{c.region}</span>
                        <span>•</span>
                        <span>{new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono">{c.avgCarbonIntensity} g/kWh</span>
                        <span className="font-mono">{c.estimatedEmissions.toFixed(2)} kg</span>
                        {c.selected && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                            SELECTED
                          </span>
                        )}
                        {!c.feasible && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-rose-500/20 text-rose-300 rounded">
                            REJECTED
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#E8F1EE] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

