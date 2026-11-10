// types/index.ts - Complete data models for GreenQueue

export type WorkloadType = 'batch' | 'ml-training' | 'backup' | 'analytics' | 'web-service' | 'db-processing';
export type JobPriority = 'urgent' | 'flexible';
export type JobStatus = 'submitted' | 'analyzing' | 'scheduled' | 'ready' | 'running' | 'completed' | 'failed' | 'cancelled';
export type RegionId = 'india' | 'north-europe' | 'west-us';
export type GridCondition = 'clean' | 'moderate' | 'dirty';

export const WORKLOAD_TYPES: { value: WorkloadType; label: string }[] = [
  { value: 'batch', label: 'Batch Processing' },
  { value: 'ml-training', label: 'Machine Learning Training' },
  { value: 'backup', label: 'Backup' },
  { value: 'analytics', label: 'Data Analytics' },
  { value: 'web-service', label: 'Web Service' },
  { value: 'db-processing', label: 'Database Processing' },
];

export const REGIONS: { id: RegionId; name: string; flag: string }[] = [
  { id: 'india', name: 'India', flag: '🇮🇳' },
  { id: 'north-europe', name: 'North Europe', flag: '🇪🇺' },
  { id: 'west-us', name: 'West US', flag: '🇺🇸' },
];

export interface Job {
  id: string;
  name: string;
  type: WorkloadType;
  description: string;
  priority: JobPriority;
  energyKwh: number;
  runtimeHours: number;
  deadlineHours: number;
  preferredRegion: RegionId | 'auto';
  recommendedRegion: RegionId | null;
  recommendedStartTime: number | null; // timestamp
  averageCarbonIntensity: number | null;
  baselineEmissions: number | null; // kg CO2
  optimizedEmissions: number | null; // kg CO2
  estimatedSavings: number | null; // kg CO2
  actualSavings: number | null; // kg CO2
  carbonReductionPercent: number | null;
  status: JobStatus;
  schedulingExplanation: string | null;
  schedulingCandidates: SchedulingCandidate[] | null;
  createdAt: number;
  scheduledAt: number | null;
  startedAt: number | null;
  completedAt: number | null;
  executionProgress: number; // 0-100
  failureReason: string | null;
  notes: string;
}

export interface SchedulingCandidate {
  region: RegionId;
  startTime: number;
  endTime: number;
  avgCarbonIntensity: number;
  estimatedEmissions: number; // kg CO2
  feasible: boolean;
  rejectionReason: string | null;
  selected: boolean;
}

export interface RegionData {
  id: RegionId;
  name: string;
  currentCarbonIntensity: number; // gCO2/kWh
  renewablePercentage: number;
  hourlyForecast: ForecastPoint[];
  gridCondition: GridCondition;
  updatedAt: number;
}

export interface ForecastPoint {
  timestamp: number;
  carbonIntensity: number; // gCO2/kWh
  renewablePercentage: number;
}

export interface ExecutionRecord {
  id: string;
  jobId: string;
  jobName: string;
  jobType: WorkloadType;
  submissionTime: number;
  scheduledTime: number | null;
  actualStartTime: number;
  actualEndTime: number;
  originalRegion: RegionId | 'auto';
  actualRegion: RegionId;
  baselineCarbonIntensity: number;
  actualCarbonIntensity: number;
  energyConsumed: number;
  baselineEmissions: number;
  actualEmissions: number;
  co2Avoided: number;
  executionDuration: number; // hours
  status: 'completed' | 'failed';
  failureReason: string | null;
  priority: JobPriority;
}

export interface AppSettings {
  simulationEnabled: boolean;
  simulationSpeed: number; // multiplier
  defaultBaselineRegion: RegionId;
  autoRegionSelection: boolean;
  flexibleWorkloadOptimization: boolean;
  minimumCarbonReduction: number; // percentage
}

export interface SimulationState {
  currentTime: number; // simulated timestamp
  isRunning: boolean;
  speed: number;
  lastAdvanced: number;
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  expectedBehavior: string;
  job: Partial<Job> | null;
  forecastOverride: Record<RegionId, number[]> | null;
  status: 'idle' | 'running' | 'passed' | 'failed';
  result: string | null;
  actualResult: string | null;
}

export interface PresentationState {
  isActive: boolean;
  currentStage: number;
  totalStages: number;
  stageName: string;
  stageDescription: string;
  stageInstructions: string;
}

export interface Analytics {
  totalJobs: number;
  jobsOptimized: number;
  totalEnergy: number;
  baselineEmissions: number;
  optimizedEmissions: number;
  co2Avoided: number;
  avgCarbonReduction: number;
  successfulExecutions: number;
  failedExecutions: number;
  projectedSavings: number;
  realizedSavings: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}
