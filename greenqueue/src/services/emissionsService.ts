// emissionsService.ts - Emissions calculation and sustainability tracking

import { Job, ExecutionRecord } from '../types';
import { getJobs, getExecutions } from './storageService';

export interface EmissionsSummary {
  projectedBaseline: number;
  projectedOptimized: number;
  projectedSavings: number;
  realizedBaseline: number;
  realizedOptimized: number;
  realizedSavings: number;
  totalBaseline: number;
  totalOptimized: number;
  totalSavings: number;
  overallReductionPct: number;
}

/**
 * Calculate comprehensive emissions summary
 * Separates projected (pending) from realized (completed) impact
 */
export function calculateEmissionsSummary(): EmissionsSummary {
  const jobs = getJobs();
  const executions = getExecutions();
  
  // Realized: completed executions only
  const completedExecs = executions.filter(e => e.status === 'completed');
  const realizedBaseline = completedExecs.reduce((sum, e) => sum + e.baselineEmissions, 0);
  const realizedOptimized = completedExecs.reduce((sum, e) => sum + e.actualEmissions, 0);
  const realizedSavings = completedExecs.reduce((sum, e) => sum + e.co2Avoided, 0);
  
  // Projected: scheduled/ready jobs that haven't executed yet
  // Exclude jobs that already have execution records to prevent double counting
  const executedJobIds = new Set(executions.map(e => e.jobId));
  const pendingJobs = jobs.filter(j => 
    ['scheduled', 'ready'].includes(j.status) && !executedJobIds.has(j.id)
  );
  
  const projectedBaseline = pendingJobs.reduce((sum, j) => sum + (j.baselineEmissions || 0), 0);
  const projectedOptimized = pendingJobs.reduce((sum, j) => sum + (j.optimizedEmissions || 0), 0);
  const projectedSavings = pendingJobs.reduce((sum, j) => sum + Math.max(0, (j.estimatedSavings || 0)), 0);
  
  const totalBaseline = realizedBaseline + projectedBaseline;
  const totalOptimized = realizedOptimized + projectedOptimized;
  const totalSavings = realizedSavings + projectedSavings;
  
  const overallReductionPct = totalBaseline > 0 
    ? (totalSavings / totalBaseline) * 100 
    : 0;
  
  return {
    projectedBaseline,
    projectedOptimized,
    projectedSavings,
    realizedBaseline,
    realizedOptimized,
    realizedSavings,
    totalBaseline,
    totalOptimized,
    totalSavings,
    overallReductionPct: Math.round(overallReductionPct * 10) / 10,
  };
}

/**
 * Calculate emissions for a single job execution
 */
export function calculateJobEmissions(
  energyKwh: number,
  carbonIntensity: number
): number {
  return (energyKwh * carbonIntensity) / 1000; // kg CO2
}

/**
 * Format emissions value for display
 */
export function formatEmissions(kgCO2: number): string {
  if (kgCO2 >= 1000) {
    return `${(kgCO2 / 1000).toFixed(2)} t CO₂`;
  }
  return `${kgCO2.toFixed(2)} kg CO₂`;
}

/**
 * Get equivalency comparisons for CO2 savings
 */
export function getEquivalencies(kgCO2Saved: number): { icon: string; text: string }[] {
  return [
    { icon: '🌳', text: `${Math.round(kgCO2Saved / 21)} trees growing for a year` },
    { icon: '🚗', text: `${Math.round(kgCO2Saved / 0.21)} km of car driving avoided` },
    { icon: '💡', text: `${Math.round(kgCO2Saved / 0.005)} hours of LED bulb usage` },
    { icon: '📱', text: `${Math.round(kgCO2Saved / 0.008)} smartphone charges` },
  ].filter(e => parseInt(e.text) > 0);
}
