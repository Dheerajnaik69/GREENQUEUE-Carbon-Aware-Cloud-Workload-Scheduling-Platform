// AppContext.tsx - Global application state management

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { Job, RegionData, AppSettings, SimulationState, Analytics, ToastMessage, PresentationState, DemoScenario } from '../types';
import { getJobs, saveJobs, getSettings, saveSettings, getSimulationState, saveSimulationState, getRegionData, saveRegionData, isInitialized, markInitialized } from '../services/storageService';
import { generateAllForecasts } from '../services/carbonForecastService';
import { calculateAnalytics } from '../services/analyticsService';
import { createSampleJobs, updateJobWithScheduling } from '../services/jobService';
import { scheduleJob } from '../services/schedulingService';
import { getDefaultScenarios, getDefaultPresentationState } from '../services/demoScenarioService';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  jobs: Job[];
  regions: RegionData[];
  settings: AppSettings;
  simulation: SimulationState;
  analytics: Analytics;
  toasts: ToastMessage[];
  presentation: PresentationState;
  scenarios: DemoScenario[];
  isLoading: boolean;
}

type Action =
  | { type: 'SET_JOBS'; payload: Job[] }
  | { type: 'SET_REGIONS'; payload: RegionData[] }
  | { type: 'SET_SETTINGS'; payload: AppSettings }
  | { type: 'SET_SIMULATION'; payload: SimulationState }
  | { type: 'SET_ANALYTICS'; payload: Analytics }
  | { type: 'ADD_TOAST'; payload: ToastMessage }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_PRESENTATION'; payload: PresentationState }
  | { type: 'SET_SCENARIOS'; payload: DemoScenario[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REFRESH_ALL' };

const initialState: AppState = {
  jobs: [],
  regions: [],
  settings: {
    simulationEnabled: true,
    simulationSpeed: 1,
    defaultBaselineRegion: 'india',
    autoRegionSelection: true,
    flexibleWorkloadOptimization: true,
    minimumCarbonReduction: 0,
  },
  simulation: {
    currentTime: Date.now(),
    isRunning: false,
    speed: 1,
    lastAdvanced: Date.now(),
  },
  analytics: {
    totalJobs: 0,
    jobsOptimized: 0,
    totalEnergy: 0,
    baselineEmissions: 0,
    optimizedEmissions: 0,
    co2Avoided: 0,
    avgCarbonReduction: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    projectedSavings: 0,
    realizedSavings: 0,
  },
  toasts: [],
  presentation: getDefaultPresentationState(),
  scenarios: getDefaultScenarios(),
  isLoading: true,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_JOBS':
      return { ...state, jobs: action.payload };
    case 'SET_REGIONS':
      return { ...state, regions: action.payload };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'SET_SIMULATION':
      return { ...state, simulation: action.payload };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SET_PRESENTATION':
      return { ...state, presentation: action.payload };
    case 'SET_SCENARIOS':
      return { ...state, scenarios: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'REFRESH_ALL':
      return {
        ...state,
        jobs: getJobs(),
        analytics: calculateAnalytics(),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  refreshData: () => void;
  advanceTime: (hours: number) => void;
  refreshForecasts: () => void;
  initializeApp: () => void;
  resetApp: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = uuidv4();
    dispatch({ type: 'ADD_TOAST', payload: { id, type, title, message, duration: 4000 } });
    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 4000);
  }, []);

  const refreshData = useCallback(() => {
    dispatch({ type: 'REFRESH_ALL' });
  }, []);

  const advanceTime = useCallback((hours: number) => {
    const sim = getSimulationState();
    const newTime = sim.currentTime + hours * 3600000;
    const newSim = { ...sim, currentTime: newTime, lastAdvanced: Date.now() };
    saveSimulationState(newSim);
    dispatch({ type: 'SET_SIMULATION', payload: newSim });
    
    // Refresh forecasts for new time
    const regions = generateAllForecasts(newTime);
    saveRegionData(regions);
    dispatch({ type: 'SET_REGIONS', payload: regions });
    
    // Check if any scheduled jobs are now ready
    const jobs = getJobs();
    let updated = false;
    for (const job of jobs) {
      if (job.status === 'scheduled' && job.recommendedStartTime && newTime >= job.recommendedStartTime) {
        job.status = 'ready';
        updated = true;
      }
    }
    if (updated) {
      saveJobs(jobs);
    }
    
    dispatch({ type: 'REFRESH_ALL' });
  }, []);

  const refreshForecasts = useCallback(() => {
    const sim = getSimulationState();
    const regions = generateAllForecasts(sim.currentTime, Date.now());
    saveRegionData(regions);
    dispatch({ type: 'SET_REGIONS', payload: regions });
    addToast('info', 'Forecasts Updated', 'Carbon intensity forecasts have been refreshed.');
  }, [addToast]);

  const initializeApp = useCallback(() => {
    const sim: SimulationState = {
      currentTime: Date.now(),
      isRunning: false,
      speed: 1,
      lastAdvanced: Date.now(),
    };
    saveSimulationState(sim);
    dispatch({ type: 'SET_SIMULATION', payload: sim });

    // Generate initial forecasts
    const regions = generateAllForecasts(sim.currentTime);
    saveRegionData(regions);
    dispatch({ type: 'SET_REGIONS', payload: regions });

    // Create sample jobs if not initialized
    if (!isInitialized()) {
      const jobs = createSampleJobs(sim.currentTime);
      
      // Schedule all sample jobs through the engine
      for (const job of jobs) {
        const result = scheduleJob(job, regions, sim.currentTime, 'india');
        updateJobWithScheduling(job.id, {
          recommendedRegion: result.recommendedRegion,
          recommendedStartTime: result.recommendedStartTime,
          avgCarbonIntensity: result.avgCarbonIntensity,
          baselineEmissions: result.baselineEmissions,
          optimizedEmissions: result.optimizedEmissions,
          estimatedSavings: result.estimatedSavings,
          carbonReductionPercent: result.carbonReductionPercent,
          explanation: result.explanation,
          candidates: result.candidates,
        }, sim.currentTime);
      }
      
      markInitialized();
    }

    // Load settings
    const settings = getSettings();
    dispatch({ type: 'SET_SETTINGS', payload: settings });

    dispatch({ type: 'REFRESH_ALL' });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const resetApp = useCallback(() => {
    // Clear all data
    localStorage.clear();
    
    // Re-initialize
    initializeApp();
    addToast('success', 'Reset Complete', 'Application has been reset with sample data.');
  }, [initializeApp, addToast]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initializeApp();
    }
  }, [initializeApp]);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      addToast,
      refreshData,
      advanceTime,
      refreshForecasts,
      initializeApp,
      resetApp,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
