// jobService.ts - Job lifecycle management

import { v4 as uuidv4 } from 'uuid';
import { Job, WorkloadType, JobPriority, RegionId, JobStatus } from '../types';
import { getJobs, saveJob, saveJobs, deleteJob as removeJob } from './storageService';

let jobCounter = 0;

function generateJobId(): string {
  const jobs = getJobs();
  const maxNum = jobs.reduce((max, j) => {
    const match = j.id.match(/GQ-(\d+)/);
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  jobCounter = maxNum + 1;
  return `GQ-${String(jobCounter).padStart(3, '0')}`;
}

export function createJob(params: {
  name: string;
  type: WorkloadType;
  description?: string;
  priority: JobPriority;
  energyKwh: number;
  runtimeHours: number;
  deadlineHours: number;
  preferredRegion: RegionId | 'auto';
  notes?: string;
}, simulationTime: number): Job {
  const job: Job = {
    id: generateJobId(),
    name: params.name,
    type: params.type,
    description: params.description || '',
    priority: params.priority,
    energyKwh: params.energyKwh,
    runtimeHours: params.runtimeHours,
    deadlineHours: params.deadlineHours,
    preferredRegion: params.preferredRegion,
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
    createdAt: simulationTime,
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    executionProgress: 0,
    failureReason: null,
    notes: params.notes || '',
  };
  
  saveJob(job);
  return job;
}

export function updateJobWithScheduling(
  jobId: string,
  scheduling: {
    recommendedRegion: RegionId;
    recommendedStartTime: number;
    avgCarbonIntensity: number;
    baselineEmissions: number;
    optimizedEmissions: number;
    estimatedSavings: number;
    carbonReductionPercent: number;
    explanation: string;
    candidates: any[];
  },
  simulationTime: number
): Job | null {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) return null;
  
  job.recommendedRegion = scheduling.recommendedRegion;
  job.recommendedStartTime = scheduling.recommendedStartTime;
  job.averageCarbonIntensity = scheduling.avgCarbonIntensity;
  job.baselineEmissions = scheduling.baselineEmissions;
  job.optimizedEmissions = scheduling.optimizedEmissions;
  job.estimatedSavings = scheduling.estimatedSavings;
  job.carbonReductionPercent = scheduling.carbonReductionPercent;
  job.schedulingExplanation = scheduling.explanation;
  job.schedulingCandidates = scheduling.candidates;
  job.status = job.priority === 'urgent' ? 'ready' : 'scheduled';
  job.scheduledAt = simulationTime;
  
  saveJob(job);
  return job;
}

export function updateJobStatus(jobId: string, status: JobStatus, extras?: Partial<Job>): Job | null {
  const jobs = getJobs();
  const job = jobs.find(j => j.id === jobId);
  if (!job) return null;
  
  job.status = status;
  if (extras) {
    Object.assign(job, extras);
  }
  
  saveJob(job);
  return job;
}

export function deleteJobById(jobId: string): void {
  removeJob(jobId);
}

export function getAllJobs(): Job[] {
  return getJobs();
}

export function getJobById(id: string): Job | undefined {
  return getJobs().find(j => j.id === id);
}

export function validateJobInput(params: {
  name: string;
  energyKwh: number;
  runtimeHours: number;
  deadlineHours: number;
}): string[] {
  const errors: string[] = [];
  if (!params.name || params.name.trim().length === 0) {
    errors.push('Job name is required');
  }
  if (!params.energyKwh || params.energyKwh <= 0) {
    errors.push('Energy consumption must be a positive number');
  }
  if (!params.runtimeHours || params.runtimeHours <= 0) {
    errors.push('Runtime must be a positive number');
  }
  if (params.deadlineHours < params.runtimeHours) {
    errors.push('Deadline must be greater than or equal to runtime');
  }
  return errors;
}

// Create the initial demo dataset
export function createSampleJobs(simulationTime: number): Job[] {
  const samples = [
    { id: 'GQ-001', name: 'Customer Payment API', type: 'web-service' as WorkloadType, priority: 'urgent' as JobPriority, energyKwh: 20, runtimeHours: 1, deadlineHours: 2, preferredRegion: 'auto' as const },
    { id: 'GQ-002', name: 'AI Model Training', type: 'ml-training' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 120, runtimeHours: 4, deadlineHours: 24, preferredRegion: 'auto' as const },
    { id: 'GQ-003', name: 'Nightly Database Backup', type: 'backup' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 60, runtimeHours: 2, deadlineHours: 12, preferredRegion: 'auto' as const },
    { id: 'GQ-004', name: 'Financial Report', type: 'analytics' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 35, runtimeHours: 1, deadlineHours: 6, preferredRegion: 'auto' as const },
    { id: 'GQ-005', name: 'Security Patch', type: 'batch' as WorkloadType, priority: 'urgent' as JobPriority, energyKwh: 15, runtimeHours: 1, deadlineHours: 1, preferredRegion: 'auto' as const },
    { id: 'GQ-006', name: 'Video Rendering', type: 'batch' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 200, runtimeHours: 6, deadlineHours: 24, preferredRegion: 'auto' as const },
    { id: 'GQ-007', name: 'Customer Data Sync', type: 'db-processing' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 45, runtimeHours: 2, deadlineHours: 3, preferredRegion: 'auto' as const },
    { id: 'GQ-008', name: 'Monthly Archive', type: 'backup' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 80, runtimeHours: 4, deadlineHours: 24, preferredRegion: 'auto' as const },
    { id: 'GQ-009', name: 'Inventory Analytics', type: 'analytics' as WorkloadType, priority: 'flexible' as JobPriority, energyKwh: 50, runtimeHours: 2, deadlineHours: 12, preferredRegion: 'auto' as const },
    { id: 'GQ-010', name: 'Banking Transaction', type: 'web-service' as WorkloadType, priority: 'urgent' as JobPriority, energyKwh: 10, runtimeHours: 1, deadlineHours: 1, preferredRegion: 'auto' as const },
  ];

  const jobs: Job[] = samples.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    description: '',
    priority: s.priority,
    energyKwh: s.energyKwh,
    runtimeHours: s.runtimeHours,
    deadlineHours: s.deadlineHours,
    preferredRegion: s.preferredRegion,
    recommendedRegion: null,
    recommendedStartTime: null,
    averageCarbonIntensity: null,
    baselineEmissions: null,
    optimizedEmissions: null,
    estimatedSavings: null,
    actualSavings: null,
    carbonReductionPercent: null,
    status: 'submitted' as JobStatus,
    schedulingExplanation: null,
    schedulingCandidates: null,
    createdAt: simulationTime,
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    executionProgress: 0,
    failureReason: null,
    notes: '',
  }));

  saveJobs(jobs);
  return jobs;
}
