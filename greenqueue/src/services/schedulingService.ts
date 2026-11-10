// schedulingService.ts - Core carbon-aware scheduling algorithm
// This is the heart of GreenQueue - a deterministic scheduler that evaluates
// execution windows across regions to minimize estimated CO2 emissions.

import { Job, RegionData, RegionId, SchedulingCandidate, JobPriority } from '../types';
import { getAverageCarbonIntensity, getCarbonIntensityAtTime } from './carbonForecastService';

export interface SchedulingResult {
  jobId: string;
  recommendedRegion: RegionId;
  recommendedStartTime: number;
  executionDuration: number; // hours
  avgCarbonIntensity: number; // gCO2/kWh
  baselineEmissions: number; // kg CO2
  optimizedEmissions: number; // kg CO2
  estimatedSavings: number; // kg CO2
  carbonReductionPercent: number;
  explanation: string;
  candidates: SchedulingCandidate[];
}

/**
 * Main scheduling function. Evaluates all feasible execution windows
 * and selects the lowest-emission option.
 * 
 * For URGENT jobs: recommends immediate execution (no delay for carbon optimization)
 * For FLEXIBLE jobs: evaluates all feasible time slots across eligible regions
 */
export function scheduleJob(
  job: Job,
  regions: RegionData[],
  simulationTime: number,
  defaultBaselineRegion: RegionId = 'india'
): SchedulingResult {
  if (job.priority === 'urgent') {
    return scheduleUrgentJob(job, regions, simulationTime, defaultBaselineRegion);
  }
  return scheduleFlexibleJob(job, regions, simulationTime, defaultBaselineRegion);
}

/**
 * Urgent jobs: execute immediately in the best available region (or preferred region).
 * No intentional delay for carbon optimization.
 */
function scheduleUrgentJob(
  job: Job,
  regions: RegionData[],
  simulationTime: number,
  defaultBaselineRegion: RegionId
): SchedulingResult {
  const startTime = simulationTime;
  const endTime = startTime + job.runtimeHours * 3600000;
  
  // Determine execution region
  let executionRegion: RegionId;
  const eligibleRegions = getEligibleRegions(job, regions);
  
  if (job.preferredRegion !== 'auto') {
    executionRegion = job.preferredRegion;
  } else {
    // For urgent auto-region, pick the current cleanest region (no delay)
    executionRegion = eligibleRegions.reduce((best, r) => {
      const bestData = regions.find(rd => rd.id === best)!;
      const rData = regions.find(rd => rd.id === r)!;
      return rData.currentCarbonIntensity < bestData.currentCarbonIntensity ? r : best;
    }, eligibleRegions[0]);
  }
  
  const regionData = regions.find(r => r.id === executionRegion)!;
  const avgIntensity = getAverageCarbonIntensity(regionData, startTime, job.runtimeHours);
  const optimizedEmissions = (job.energyKwh * avgIntensity) / 1000;
  
  // Baseline: what it would cost at the default baseline region right now
  const baselineRegion = job.preferredRegion !== 'auto' ? job.preferredRegion : defaultBaselineRegion;
  const baselineData = regions.find(r => r.id === baselineRegion)!;
  const baselineIntensity = getAverageCarbonIntensity(baselineData, startTime, job.runtimeHours);
  const baselineEmissions = (job.energyKwh * baselineIntensity) / 1000;
  
  const savings = Math.max(0, baselineEmissions - optimizedEmissions);
  const reductionPct = baselineEmissions > 0 ? (savings / baselineEmissions) * 100 : 0;
  
  // Build candidate list (single candidate for urgent)
  const candidate: SchedulingCandidate = {
    region: executionRegion,
    startTime,
    endTime,
    avgCarbonIntensity: avgIntensity,
    estimatedEmissions: optimizedEmissions,
    feasible: true,
    rejectionReason: null,
    selected: true,
  };
  
  return {
    jobId: job.id,
    recommendedRegion: executionRegion,
    recommendedStartTime: startTime,
    executionDuration: job.runtimeHours,
    avgCarbonIntensity: avgIntensity,
    baselineEmissions,
    optimizedEmissions,
    estimatedSavings: savings,
    carbonReductionPercent: Math.round(reductionPct * 10) / 10,
    explanation: `⚡ URGENT: "${job.name}" is classified as urgent and scheduled for immediate execution in ${regionData.name}. ` +
      `Urgent workloads are not delayed for carbon optimization. ` +
      `Current carbon intensity: ${avgIntensity} gCO₂/kWh.` +
      (savings > 0 && job.preferredRegion === 'auto' 
        ? ` Region selection saved ${savings.toFixed(2)} kg CO₂ vs. ${baselineRegion} baseline.`
        : ''),
    candidates: [candidate],
  };
}

/**
 * Flexible jobs: evaluate all feasible execution windows across eligible regions.
 * Select the window with the lowest estimated emissions.
 */
function scheduleFlexibleJob(
  job: Job,
  regions: RegionData[],
  simulationTime: number,
  defaultBaselineRegion: RegionId
): SchedulingResult {
  const deadline = simulationTime + job.deadlineHours * 3600000;
  const eligibleRegions = getEligibleRegions(job, regions);
  const candidates: SchedulingCandidate[] = [];
  
  // Generate candidates: every hour start time × every eligible region
  for (const regionId of eligibleRegions) {
    const regionData = regions.find(r => r.id === regionId)!;
    
    // Try every hour as a potential start time
    const maxStartOffset = Math.floor(job.deadlineHours - job.runtimeHours);
    
    for (let h = 0; h <= maxStartOffset; h++) {
      const candidateStart = simulationTime + h * 3600000;
      const candidateEnd = candidateStart + job.runtimeHours * 3600000;
      
      // Check feasibility
      if (candidateEnd > deadline) {
        candidates.push({
          region: regionId,
          startTime: candidateStart,
          endTime: candidateEnd,
          avgCarbonIntensity: 0,
          estimatedEmissions: 0,
          feasible: false,
          rejectionReason: `Execution would end after deadline (${new Date(candidateEnd).toLocaleTimeString()} > ${new Date(deadline).toLocaleTimeString()})`,
          selected: false,
        });
        continue;
      }
      
      const avgIntensity = getAverageCarbonIntensity(regionData, candidateStart, job.runtimeHours);
      const emissions = (job.energyKwh * avgIntensity) / 1000;
      
      candidates.push({
        region: regionId,
        startTime: candidateStart,
        endTime: candidateEnd,
        avgCarbonIntensity: avgIntensity,
        estimatedEmissions: emissions,
        feasible: true,
        rejectionReason: null,
        selected: false,
      });
    }
  }
  
  // Find the best feasible candidate
  const feasibleCandidates = candidates.filter(c => c.feasible);
  
  if (feasibleCandidates.length === 0) {
    // No feasible window - schedule immediately in best available region
    const regionId = eligibleRegions[0];
    const regionData = regions.find(r => r.id === regionId)!;
    const avgIntensity = getAverageCarbonIntensity(regionData, simulationTime, job.runtimeHours);
    const emissions = (job.energyKwh * avgIntensity) / 1000;
    
    return {
      jobId: job.id,
      recommendedRegion: regionId,
      recommendedStartTime: simulationTime,
      executionDuration: job.runtimeHours,
      avgCarbonIntensity: avgIntensity,
      baselineEmissions: emissions,
      optimizedEmissions: emissions,
      estimatedSavings: 0,
      carbonReductionPercent: 0,
      explanation: `⚠️ No feasible execution window found within deadline. Recommending immediate execution in ${regionData.name}.`,
      candidates,
    };
  }
  
  // Sort by emissions (ascending), then by start time (ascending) for tie-breaking
  feasibleCandidates.sort((a, b) => {
    const emissionDiff = a.estimatedEmissions - b.estimatedEmissions;
    if (Math.abs(emissionDiff) < 0.001) {
      // Tie-break: earliest start time
      return a.startTime - b.startTime;
    }
    return emissionDiff;
  });
  
  const best = feasibleCandidates[0];
  best.selected = true;
  
  // Mark selected in the main candidates array
  const bestIdx = candidates.findIndex(
    c => c.region === best.region && c.startTime === best.startTime
  );
  if (bestIdx >= 0) {
    candidates[bestIdx].selected = true;
  }
  
  // Calculate baseline emissions (immediate execution in baseline region)
  const baselineRegion = job.preferredRegion !== 'auto' ? job.preferredRegion : defaultBaselineRegion;
  const baselineData = regions.find(r => r.id === baselineRegion)!;
  const baselineIntensity = getAverageCarbonIntensity(baselineData, simulationTime, job.runtimeHours);
  const baselineEmissions = (job.energyKwh * baselineIntensity) / 1000;
  
  const savings = Math.max(0, baselineEmissions - best.estimatedEmissions);
  const reductionPct = baselineEmissions > 0 ? (savings / baselineEmissions) * 100 : 0;
  
  // Build explanation
  const bestRegionData = regions.find(r => r.id === best.region)!;
  const startTimeStr = new Date(best.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const delayHours = Math.round((best.startTime - simulationTime) / 3600000);
  
  let explanation = `🌿 FLEXIBLE: "${job.name}" scheduled for ${bestRegionData.name} at ${startTimeStr}. `;
  
  if (delayHours > 0) {
    explanation += `Execution deferred by ${delayHours}h to a cleaner grid period. `;
  } else {
    explanation += `Immediate execution recommended as this is the optimal window. `;
  }
  
  explanation += `Average carbon intensity: ${best.avgCarbonIntensity} gCO₂/kWh. `;
  
  if (savings > 0) {
    explanation += `Estimated savings: ${savings.toFixed(2)} kg CO₂ (${reductionPct.toFixed(1)}% reduction vs. baseline). `;
  } else {
    explanation += `No carbon savings available — current window is already optimal. `;
  }
  
  explanation += `Evaluated ${feasibleCandidates.length} feasible windows across ${eligibleRegions.length} region(s), `;
  explanation += `rejected ${candidates.filter(c => !c.feasible).length} infeasible windows.`;
  
  return {
    jobId: job.id,
    recommendedRegion: best.region,
    recommendedStartTime: best.startTime,
    executionDuration: job.runtimeHours,
    avgCarbonIntensity: best.avgCarbonIntensity,
    baselineEmissions,
    optimizedEmissions: best.estimatedEmissions,
    estimatedSavings: savings,
    carbonReductionPercent: Math.round(reductionPct * 10) / 10,
    explanation,
    candidates,
  };
}

/**
 * Determine eligible regions based on job preference
 */
function getEligibleRegions(job: Job, regions: RegionData[]): RegionId[] {
  if (job.preferredRegion !== 'auto') {
    return [job.preferredRegion];
  }
  return regions.map(r => r.id);
}

/**
 * Reschedule a job with updated forecasts
 */
export function rescheduleJob(
  job: Job,
  regions: RegionData[],
  simulationTime: number,
  defaultBaselineRegion: RegionId = 'india'
): SchedulingResult {
  return scheduleJob(job, regions, simulationTime, defaultBaselineRegion);
}

/**
 * Batch reschedule all pending flexible jobs
 */
export function rescheduleFlexibleJobs(
  jobs: Job[],
  regions: RegionData[],
  simulationTime: number,
  defaultBaselineRegion: RegionId = 'india'
): Map<string, SchedulingResult> {
  const results = new Map<string, SchedulingResult>();
  
  for (const job of jobs) {
    if (job.priority === 'flexible' && ['submitted', 'analyzing', 'scheduled'].includes(job.status)) {
      const result = scheduleJob(job, regions, simulationTime, defaultBaselineRegion);
      results.set(job.id, result);
    }
  }
  
  return results;
}
