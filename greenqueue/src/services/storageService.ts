// storageService.ts - Persistence layer using localStorage
// Abstracted for future Firebase/Supabase migration

import { Job, ExecutionRecord, AppSettings, SimulationState, RegionData, RegionId } from '../types';

const KEYS = {
  JOBS: 'gq_jobs',
  EXECUTIONS: 'gq_executions',
  SETTINGS: 'gq_settings',
  SIMULATION: 'gq_simulation',
  REGIONS: 'gq_regions',
  INITIALIZED: 'gq_initialized',
};

const defaultSettings: AppSettings = {
  simulationEnabled: true,
  simulationSpeed: 1,
  defaultBaselineRegion: 'india',
  autoRegionSelection: true,
  flexibleWorkloadOptimization: true,
  minimumCarbonReduction: 0,
};

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// Jobs
export function getJobs(): Job[] {
  return getItem<Job[]>(KEYS.JOBS, []);
}

export function saveJobs(jobs: Job[]): void {
  setItem(KEYS.JOBS, jobs);
}

export function getJob(id: string): Job | undefined {
  return getJobs().find(j => j.id === id);
}

export function saveJob(job: Job): void {
  const jobs = getJobs();
  const idx = jobs.findIndex(j => j.id === job.id);
  if (idx >= 0) {
    jobs[idx] = job;
  } else {
    jobs.push(job);
  }
  saveJobs(jobs);
}

export function deleteJob(id: string): void {
  saveJobs(getJobs().filter(j => j.id !== id));
}

// Executions
export function getExecutions(): ExecutionRecord[] {
  return getItem<ExecutionRecord[]>(KEYS.EXECUTIONS, []);
}

export function saveExecutions(records: ExecutionRecord[]): void {
  setItem(KEYS.EXECUTIONS, records);
}

export function addExecution(record: ExecutionRecord): void {
  const records = getExecutions();
  // Prevent duplicates
  if (!records.find(r => r.id === record.id)) {
    records.push(record);
    saveExecutions(records);
  }
}

// Settings
export function getSettings(): AppSettings {
  return getItem<AppSettings>(KEYS.SETTINGS, defaultSettings);
}

export function saveSettings(settings: AppSettings): void {
  setItem(KEYS.SETTINGS, settings);
}

// Simulation State
export function getSimulationState(): SimulationState {
  return getItem<SimulationState>(KEYS.SIMULATION, {
    currentTime: Date.now(),
    isRunning: false,
    speed: 1,
    lastAdvanced: Date.now(),
  });
}

export function saveSimulationState(state: SimulationState): void {
  setItem(KEYS.SIMULATION, state);
}

// Region data
export function getRegionData(): RegionData[] {
  return getItem<RegionData[]>(KEYS.REGIONS, []);
}

export function saveRegionData(data: RegionData[]): void {
  setItem(KEYS.REGIONS, data);
}

// Initialization
export function isInitialized(): boolean {
  return localStorage.getItem(KEYS.INITIALIZED) === 'true';
}

export function markInitialized(): void {
  localStorage.setItem(KEYS.INITIALIZED, 'true');
}

// Clear all data
export function clearAllData(): void {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

export function resetToDefaults(): void {
  clearAllData();
}
