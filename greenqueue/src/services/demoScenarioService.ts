// demoScenarioService.ts - Manages the 8 demo scenarios and presentation mode

import { DemoScenario, Job, RegionId, RegionData, PresentationState } from '../types';
import { createJob } from './jobService';
import { scheduleJob } from './schedulingService';
import { generateAllForecasts, generateDeterministicForecast } from './carbonForecastService';
import { getJobs, saveJobs, getExecutions, saveExecutions } from './storageService';
import { updateJobWithScheduling, updateJobStatus, createSampleJobs } from './jobService';

export function getDefaultScenarios(): DemoScenario[] {
  return [
    {
      id: 'scenario-1',
      name: 'Urgent Workload',
      description: 'Customer Payment API - urgent priority. Must execute immediately without carbon-optimization delays.',
      expectedBehavior: 'Immediate execution recommendation with no intentional delay for carbon optimization.',
      job: {
        name: 'Customer Payment API',
        type: 'web-service',
        priority: 'urgent',
        energyKwh: 20,
        runtimeHours: 1,
        deadlineHours: 2,
        preferredRegion: 'auto',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-2',
      name: 'Flexible Workload',
      description: 'AI Model Training - flexible priority with 24h deadline. Should find the lowest-emission feasible execution slot.',
      expectedBehavior: 'Lowest-emission feasible execution slot selected from all candidate windows.',
      job: {
        name: 'AI Model Training',
        type: 'ml-training',
        priority: 'flexible',
        energyKwh: 120,
        runtimeHours: 4,
        deadlineHours: 24,
        preferredRegion: 'auto',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-3',
      name: 'Tight Deadline',
      description: 'Customer Data Sync - flexible with only 3h deadline for a 2h job. Very limited scheduling flexibility.',
      expectedBehavior: 'Only feasible windows considered. Limited optimization opportunity due to tight deadline.',
      job: {
        name: 'Customer Data Sync',
        type: 'db-processing',
        priority: 'flexible',
        energyKwh: 45,
        runtimeHours: 2,
        deadlineHours: 3,
        preferredRegion: 'auto',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-4',
      name: 'Region Restriction',
      description: 'Regional Database Backup - restricted to India region only.',
      expectedBehavior: 'Optimization restricted to India region only. No cross-region scheduling.',
      job: {
        name: 'Regional Database Backup',
        type: 'backup',
        priority: 'flexible',
        energyKwh: 80,
        runtimeHours: 2,
        deadlineHours: 12,
        preferredRegion: 'india',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-5',
      name: 'Changing Carbon Intensity',
      description: 'Modify regional forecasts and observe that pending flexible workloads are re-evaluated while urgent workloads remain unaffected.',
      expectedBehavior: 'Flexible workloads re-evaluated with new forecasts. Urgent workloads unchanged.',
      job: null,
      forecastOverride: {
        'india': [700,720,680,650,620,600,580,560,540,520,500,480,460,450,440,430,450,470,500,530,560,600,640,680],
        'north-europe': [80,75,70,65,60,55,50,48,52,58,65,70,75,80,90,100,110,120,115,105,95,85,80,78],
        'west-us': [300,290,280,260,240,220,200,180,160,140,130,120,130,150,180,210,250,280,310,330,340,330,320,310],
      },
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-6',
      name: 'No Optimization Opportunity',
      description: 'Immediate Data Processing - flexible with 6h deadline for 6h job in India. No room for delayed execution.',
      expectedBehavior: 'No delayed execution opportunity. Recommend immediate execution in India.',
      job: {
        name: 'Immediate Data Processing',
        type: 'analytics',
        priority: 'flexible',
        energyKwh: 50,
        runtimeHours: 6,
        deadlineHours: 6,
        preferredRegion: 'india',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-7',
      name: 'Equal Carbon Intensity',
      description: 'Two candidate windows with identical average carbon intensity. Should select the earliest feasible slot.',
      expectedBehavior: 'Earliest feasible slot selected when carbon intensity is equal.',
      job: {
        name: 'Equal Intensity Test',
        type: 'batch',
        priority: 'flexible',
        energyKwh: 40,
        runtimeHours: 1,
        deadlineHours: 6,
        preferredRegion: 'india',
      },
      forecastOverride: {
        'india': [500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500,500],
        'north-europe': [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
        'west-us': [250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250,250],
      },
      status: 'idle',
      result: null,
      actualResult: null,
    },
    {
      id: 'scenario-8',
      name: 'Execution Failure',
      description: 'Simulate a workload failure. Should show failed status, no realized savings, and offer retry option.',
      expectedBehavior: 'Failed status. No realized savings. Retry option available. Correct accounting after retry.',
      job: {
        name: 'Failure Test Job',
        type: 'batch',
        priority: 'flexible',
        energyKwh: 30,
        runtimeHours: 1,
        deadlineHours: 12,
        preferredRegion: 'auto',
      },
      forecastOverride: null,
      status: 'idle',
      result: null,
      actualResult: null,
    },
  ];
}

export function getDefaultPresentationState(): PresentationState {
  return {
    isActive: false,
    currentStage: 0,
    totalStages: 6,
    stageName: '',
    stageDescription: '',
    stageInstructions: '',
  };
}

export const PRESENTATION_STAGES = [
  {
    stage: 1,
    name: 'Environmental Problem',
    description: 'Understanding regional carbon intensity differences',
    instructions: 'Navigate to Carbon Intelligence to view the differences in carbon intensity across India, North Europe, and West US. Notice how carbon intensity varies by time of day and region.',
  },
  {
    stage: 2,
    name: 'Urgent Workload',
    description: 'Demonstrating urgency-aware scheduling',
    instructions: 'Submit a Customer Payment API job with Urgent priority. Observe that the system recommends immediate execution without delay — critical workloads are never delayed for carbon optimization.',
  },
  {
    stage: 3,
    name: 'Flexible Workload',
    description: 'Carbon-aware scheduling in action',
    instructions: 'Submit an ML Training workload with Flexible priority and 24h deadline. The scheduler will evaluate all feasible execution windows across regions and select the lowest-emission slot.',
  },
  {
    stage: 4,
    name: 'Dynamic Grid Changes',
    description: 'Responding to changing conditions',
    instructions: 'Use the "Simulate Grid Changes" button to modify carbon forecasts. Watch how pending flexible workloads are re-evaluated with new data, while urgent workloads remain unaffected.',
  },
  {
    stage: 5,
    name: 'Workload Execution',
    description: 'Running and monitoring workloads',
    instructions: 'Advance the simulation clock to make scheduled jobs ready. Then execute ready workloads and monitor their progress in the queue.',
  },
  {
    stage: 6,
    name: 'Environmental Impact',
    description: 'Measuring sustainability outcomes',
    instructions: 'Navigate to Sustainability Reports. Compare baseline vs GreenQueue emissions. Review total CO₂ avoided and carbon reduction percentage across all executed workloads.',
  },
];
