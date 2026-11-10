// analyticsService.ts - Analytics and sustainability calculations

import { Job, ExecutionRecord, Analytics } from '../types';
import { getJobs, getExecutions } from './storageService';

export function calculateAnalytics(): Analytics {
  const jobs = getJobs();
  const executions = getExecutions();
  
  const completedExecs = executions.filter(e => e.status === 'completed');
  const failedExecs = executions.filter(e => e.status === 'failed');
  
  // Realized metrics (completed jobs only)
  const realizedSavings = completedExecs.reduce((sum, e) => sum + e.co2Avoided, 0);
  const totalActualEmissions = completedExecs.reduce((sum, e) => sum + e.actualEmissions, 0);
  const totalBaselineEmissions = completedExecs.reduce((sum, e) => sum + e.baselineEmissions, 0);
  const totalEnergy = completedExecs.reduce((sum, e) => sum + e.energyConsumed, 0);
  
  // Projected metrics (scheduled/pending jobs)
  const pendingJobs = jobs.filter(j => ['scheduled', 'ready', 'submitted', 'analyzing'].includes(j.status));
  const projectedSavings = pendingJobs.reduce((sum, j) => sum + (j.estimatedSavings || 0), 0);
  
  // Jobs that were optimized (flexible + had savings)
  const optimizedJobs = jobs.filter(j => 
    j.priority === 'flexible' && (j.estimatedSavings || 0) > 0
  );
  
  const avgCarbonReduction = completedExecs.length > 0
    ? completedExecs.reduce((sum, e) => {
        if (e.baselineEmissions > 0) {
          return sum + (e.co2Avoided / e.baselineEmissions) * 100;
        }
        return sum;
      }, 0) / completedExecs.length
    : (optimizedJobs.length > 0 
        ? optimizedJobs.reduce((sum, j) => sum + (j.carbonReductionPercent || 0), 0) / optimizedJobs.length
        : 0);
  
  return {
    totalJobs: jobs.length,
    jobsOptimized: optimizedJobs.length,
    totalEnergy: totalEnergy || jobs.reduce((sum, j) => sum + j.energyKwh, 0),
    baselineEmissions: totalBaselineEmissions || jobs.reduce((sum, j) => sum + (j.baselineEmissions || 0), 0),
    optimizedEmissions: totalActualEmissions || jobs.reduce((sum, j) => sum + (j.optimizedEmissions || 0), 0),
    co2Avoided: realizedSavings + projectedSavings,
    avgCarbonReduction: Math.round(avgCarbonReduction * 10) / 10,
    successfulExecutions: completedExecs.length,
    failedExecutions: failedExecs.length,
    projectedSavings,
    realizedSavings,
  };
}

export function getExecutionsByDateRange(startDate: number, endDate: number): ExecutionRecord[] {
  return getExecutions().filter(e => 
    e.actualStartTime >= startDate && e.actualStartTime <= endDate
  );
}

export function getExecutionsByRegion(region: string): ExecutionRecord[] {
  return getExecutions().filter(e => e.actualRegion === region);
}

export function getExecutionsByType(type: string): ExecutionRecord[] {
  return getExecutions().filter(e => e.jobType === type);
}

export function exportToCSV(records: ExecutionRecord[]): string {
  const headers = [
    'Job ID', 'Job Name', 'Type', 'Priority', 'Submission Time', 'Scheduled Time',
    'Start Time', 'End Time', 'Original Region', 'Actual Region',
    'Baseline Carbon Intensity (gCO2/kWh)', 'Actual Carbon Intensity (gCO2/kWh)',
    'Energy (kWh)', 'Baseline Emissions (kg CO2)', 'Actual Emissions (kg CO2)',
    'CO2 Avoided (kg)', 'Duration (hours)', 'Status'
  ].join(',');
  
  const rows = records.map(r => [
    r.jobId,
    `"${r.jobName}"`,
    r.jobType,
    r.priority,
    new Date(r.submissionTime).toISOString(),
    r.scheduledTime ? new Date(r.scheduledTime).toISOString() : '',
    new Date(r.actualStartTime).toISOString(),
    new Date(r.actualEndTime).toISOString(),
    r.originalRegion,
    r.actualRegion,
    r.baselineCarbonIntensity.toFixed(1),
    r.actualCarbonIntensity.toFixed(1),
    r.energyConsumed.toFixed(1),
    r.baselineEmissions.toFixed(3),
    r.actualEmissions.toFixed(3),
    r.co2Avoided.toFixed(3),
    r.executionDuration.toFixed(1),
    r.status,
  ].join(','));
  
  return [headers, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
