// executionService.ts - Simulated workload execution engine

import { Job, ExecutionRecord, RegionData, RegionId } from '../types';
import { getAverageCarbonIntensity } from './carbonForecastService';
import { updateJobStatus } from './jobService';
import { addExecution } from './storageService';
import { v4 as uuidv4 } from 'uuid';

export interface ExecutionCallbacks {
  onProgress: (jobId: string, progress: number) => void;
  onComplete: (jobId: string, record: ExecutionRecord) => void;
  onFail: (jobId: string, reason: string) => void;
}

// Track active executions
const activeExecutions = new Map<string, { intervalId: number; startTime: number }>();

/**
 * Start simulated execution of a job
 */
export function executeJob(
  job: Job,
  regions: RegionData[],
  simulationTime: number,
  callbacks: ExecutionCallbacks,
  simulateFail: boolean = false,
  simulationSpeedMs: number = 3000 // time per progress tick in ms
): void {
  // Prevent duplicate execution
  if (activeExecutions.has(job.id)) {
    callbacks.onFail(job.id, 'Job is already running');
    return;
  }
  
  if (!['scheduled', 'ready', 'submitted'].includes(job.status)) {
    callbacks.onFail(job.id, `Cannot execute job in status: ${job.status}`);
    return;
  }
  
  const executionRegion = job.recommendedRegion || (job.preferredRegion !== 'auto' ? job.preferredRegion : 'india');
  
  // Mark as running
  updateJobStatus(job.id, 'running', {
    startedAt: simulationTime,
    executionProgress: 0,
  });
  
  let progress = 0;
  const totalTicks = 20; // 20 progress updates
  const tickInterval = simulationSpeedMs;
  
  const intervalId = window.setInterval(() => {
    progress += 100 / totalTicks;
    
    if (simulateFail && progress >= 40) {
      // Simulate failure at 40%
      clearInterval(intervalId);
      activeExecutions.delete(job.id);
      
      updateJobStatus(job.id, 'failed', {
        executionProgress: Math.round(progress),
        failureReason: 'Simulated execution failure: Resource allocation timeout',
        completedAt: simulationTime + (job.runtimeHours * 3600000 * (progress / 100)),
      });
      
      const failRecord = createExecutionRecord(
        job, executionRegion, regions, simulationTime,
        simulationTime + (job.runtimeHours * 3600000 * (progress / 100)),
        'failed', 'Simulated execution failure: Resource allocation timeout'
      );
      addExecution(failRecord);
      
      callbacks.onFail(job.id, 'Simulated execution failure: Resource allocation timeout');
      return;
    }
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(intervalId);
      activeExecutions.delete(job.id);
      
      const endTime = simulationTime + job.runtimeHours * 3600000;
      
      updateJobStatus(job.id, 'completed', {
        executionProgress: 100,
        completedAt: endTime,
      });
      
      const record = createExecutionRecord(
        job, executionRegion, regions, simulationTime, endTime, 'completed', null
      );
      
      // Calculate actual savings for completed jobs
      const actualSavings = Math.max(0, record.baselineEmissions - record.actualEmissions);
      updateJobStatus(job.id, 'completed', {
        executionProgress: 100,
        completedAt: endTime,
        actualSavings: actualSavings,
      });
      
      addExecution(record);
      callbacks.onComplete(job.id, record);
      return;
    }
    
    updateJobStatus(job.id, 'running', { executionProgress: Math.round(progress) });
    callbacks.onProgress(job.id, Math.round(progress));
  }, tickInterval);
  
  activeExecutions.set(job.id, { intervalId, startTime: simulationTime });
}

function createExecutionRecord(
  job: Job,
  executionRegion: RegionId,
  regions: RegionData[],
  startTime: number,
  endTime: number,
  status: 'completed' | 'failed',
  failureReason: string | null
): ExecutionRecord {
  const regionData = regions.find(r => r.id === executionRegion);
  const actualIntensity = regionData
    ? getAverageCarbonIntensity(regionData, startTime, job.runtimeHours)
    : job.averageCarbonIntensity || 500;
  
  const actualEmissions = (job.energyKwh * actualIntensity) / 1000;
  const baselineEmissions = job.baselineEmissions || actualEmissions;
  const co2Avoided = status === 'completed' ? Math.max(0, baselineEmissions - actualEmissions) : 0;
  
  return {
    id: uuidv4(),
    jobId: job.id,
    jobName: job.name,
    jobType: job.type,
    submissionTime: job.createdAt,
    scheduledTime: job.scheduledAt,
    actualStartTime: startTime,
    actualEndTime: endTime,
    originalRegion: job.preferredRegion,
    actualRegion: executionRegion,
    baselineCarbonIntensity: job.baselineEmissions
      ? (job.baselineEmissions * 1000) / job.energyKwh
      : actualIntensity,
    actualCarbonIntensity: actualIntensity,
    energyConsumed: job.energyKwh,
    baselineEmissions,
    actualEmissions,
    co2Avoided,
    executionDuration: job.runtimeHours,
    status,
    failureReason,
    priority: job.priority,
  };
}

/**
 * Cancel an active execution
 */
export function cancelExecution(jobId: string): void {
  const active = activeExecutions.get(jobId);
  if (active) {
    clearInterval(active.intervalId);
    activeExecutions.delete(jobId);
  }
  updateJobStatus(jobId, 'cancelled');
}

/**
 * Check if a job is currently executing
 */
export function isJobExecuting(jobId: string): boolean {
  return activeExecutions.has(jobId);
}

/**
 * Get count of active executions
 */
export function getActiveExecutionCount(): number {
  return activeExecutions.size;
}
