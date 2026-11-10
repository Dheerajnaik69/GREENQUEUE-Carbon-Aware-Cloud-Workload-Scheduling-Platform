import { RegionData, RegionId, ForecastPoint, GridCondition } from '../types';

// Seeded pseudo-random number generator for reproducibility
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

// Regional carbon intensity profiles - time-of-day dependent
// These are SIMULATED values for academic demonstration
const REGION_PROFILES: Record<RegionId, {
  name: string;
  baseRange: [number, number]; // [min, max] gCO2/kWh
  renewableBase: number; // base renewable %
  // 24-hour profile multiplier (0=midnight, 12=noon)
  hourlyMultiplier: number[];
  variability: number; // random variability factor
}> = {
  'india': {
    name: 'India',
    baseRange: [400, 800],
    renewableBase: 22,
    // Coal-heavy grid: higher during peak hours, lower at night
    // Solar helps mid-day, but coal dominates
    hourlyMultiplier: [
      0.70, 0.65, 0.60, 0.58, 0.55, 0.60, // 0-5: night, low demand
      0.75, 0.85, 0.90, 0.80, 0.70, 0.65, // 6-11: morning ramp, solar kicks in
      0.60, 0.62, 0.68, 0.75, 0.85, 0.95, // 12-17: afternoon, solar fades
      1.00, 0.98, 0.92, 0.88, 0.82, 0.75, // 18-23: evening peak, coal heavy
    ],
    variability: 0.08,
  },
  'north-europe': {
    name: 'North Europe',
    baseRange: [50, 250],
    renewableBase: 65,
    // High renewable grid: wind-dependent, lower carbon overall
    hourlyMultiplier: [
      0.55, 0.50, 0.48, 0.45, 0.42, 0.45, // 0-5: night, good wind
      0.50, 0.55, 0.60, 0.58, 0.55, 0.50, // 6-11: moderate
      0.48, 0.52, 0.58, 0.65, 0.72, 0.80, // 12-17: afternoon demand
      0.85, 0.78, 0.70, 0.65, 0.60, 0.58, // 18-23: evening, wind picks up
    ],
    variability: 0.12,
  },
  'west-us': {
    name: 'West US',
    baseRange: [150, 400],
    renewableBase: 40,
    // Solar-heavy grid: cleanest mid-day, dirtier morning/evening
    hourlyMultiplier: [
      0.80, 0.78, 0.75, 0.72, 0.70, 0.72, // 0-5: night, no solar
      0.68, 0.60, 0.50, 0.40, 0.35, 0.30, // 6-11: solar ramp up
      0.28, 0.30, 0.35, 0.45, 0.55, 0.70, // 12-17: solar peak then fade
      0.82, 0.88, 0.90, 0.88, 0.85, 0.82, // 18-23: evening, gas peakers
    ],
    variability: 0.10,
  },
};

function getGridCondition(intensity: number, region: RegionId): GridCondition {
  const profile = REGION_PROFILES[region];
  const range = profile.baseRange[1] - profile.baseRange[0];
  const mid = profile.baseRange[0] + range * 0.4;
  const high = profile.baseRange[0] + range * 0.7;
  
  if (intensity <= mid) return 'clean';
  if (intensity <= high) return 'moderate';
  return 'dirty';
}

export function generateForecast(
  regionId: RegionId,
  simulationTime: number,
  seed?: number
): RegionData {
  const profile = REGION_PROFILES[regionId];
  const rng = new SeededRandom(seed ?? Math.floor(simulationTime / 3600000));
  
  const baseDate = new Date(simulationTime);
  const currentHour = baseDate.getHours();
  
  // Generate 24 hourly forecast points
  const hourlyForecast: ForecastPoint[] = [];
  
  for (let h = 0; h < 24; h++) {
    const forecastHour = (currentHour + h) % 24;
    const multiplier = profile.hourlyMultiplier[forecastHour];
    const range = profile.baseRange[1] - profile.baseRange[0];
    const base = profile.baseRange[0] + range * multiplier;
    const variation = rng.nextRange(-profile.variability, profile.variability);
    const intensity = Math.round(Math.max(
      profile.baseRange[0],
      Math.min(profile.baseRange[1], base * (1 + variation))
    ));
    
    const timestamp = simulationTime + h * 3600000;
    
    // Renewable % inversely correlated with carbon intensity
    const intensityRatio = (intensity - profile.baseRange[0]) / (profile.baseRange[1] - profile.baseRange[0]);
    const renewablePct = Math.round(Math.max(5, Math.min(95,
      profile.renewableBase + (1 - intensityRatio) * 30 - intensityRatio * 15
    )));
    
    hourlyForecast.push({
      timestamp,
      carbonIntensity: intensity,
      renewablePercentage: renewablePct,
    });
  }
  
  const currentIntensity = hourlyForecast[0].carbonIntensity;
  
  return {
    id: regionId,
    name: profile.name,
    currentCarbonIntensity: currentIntensity,
    renewablePercentage: hourlyForecast[0].renewablePercentage,
    hourlyForecast,
    gridCondition: getGridCondition(currentIntensity, regionId),
    updatedAt: simulationTime,
  };
}

export function generateAllForecasts(simulationTime: number, seed?: number): RegionData[] {
  return (['india', 'north-europe', 'west-us'] as RegionId[]).map((regionId, idx) =>
    generateForecast(regionId, simulationTime, (seed ?? Math.floor(simulationTime / 3600000)) + idx * 1000)
  );
}

// Get carbon intensity for a specific region at a specific time
export function getCarbonIntensityAtTime(
  regionData: RegionData,
  timestamp: number
): number {
  const forecast = regionData.hourlyForecast;
  if (forecast.length === 0) return regionData.currentCarbonIntensity;
  
  // Find the closest forecast point
  let closest = forecast[0];
  let minDiff = Math.abs(timestamp - forecast[0].timestamp);
  
  for (const point of forecast) {
    const diff = Math.abs(timestamp - point.timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closest = point;
    }
  }
  
  // Interpolate between two nearest points
  let before = forecast[0];
  let after = forecast[forecast.length - 1];
  
  for (let i = 0; i < forecast.length - 1; i++) {
    if (forecast[i].timestamp <= timestamp && forecast[i + 1].timestamp >= timestamp) {
      before = forecast[i];
      after = forecast[i + 1];
      break;
    }
  }
  
  if (before.timestamp === after.timestamp) return before.carbonIntensity;
  
  const ratio = (timestamp - before.timestamp) / (after.timestamp - before.timestamp);
  return Math.round(before.carbonIntensity + ratio * (after.carbonIntensity - before.carbonIntensity));
}

// Calculate average carbon intensity over a time window
export function getAverageCarbonIntensity(
  regionData: RegionData,
  startTime: number,
  durationHours: number
): number {
  const points = Math.max(1, Math.ceil(durationHours));
  let total = 0;
  
  for (let i = 0; i < points; i++) {
    const t = startTime + (i * durationHours * 3600000) / points;
    total += getCarbonIntensityAtTime(regionData, t);
  }
  // Also include the endpoint
  total += getCarbonIntensityAtTime(regionData, startTime + durationHours * 3600000);
  
  return Math.round(total / (points + 1));
}

// Find the cleanest window in the forecast
export function findCleanestWindow(
  regionData: RegionData,
  durationHours: number,
  deadlineTimestamp: number,
  startAfter: number
): { startTime: number; avgIntensity: number } | null {
  const forecast = regionData.hourlyForecast;
  if (forecast.length === 0) return null;
  
  let bestStart = -1;
  let bestIntensity = Infinity;
  
  // Check every hour as a potential start time
  for (let h = 0; h < 24; h++) {
    const candidateStart = startAfter + h * 3600000;
    const candidateEnd = candidateStart + durationHours * 3600000;
    
    // Must finish before deadline
    if (candidateEnd > deadlineTimestamp) continue;
    // Must start after the earliest time
    if (candidateStart < startAfter) continue;
    
    const avgIntensity = getAverageCarbonIntensity(regionData, candidateStart, durationHours);
    
    if (avgIntensity < bestIntensity) {
      bestIntensity = avgIntensity;
      bestStart = candidateStart;
    }
  }
  
  if (bestStart === -1) return null;
  
  return { startTime: bestStart, avgIntensity: bestIntensity };
}

// Generate deterministic forecasts for demo scenarios
export function generateDeterministicForecast(
  regionId: RegionId,
  simulationTime: number,
  overrideIntensities?: number[]
): RegionData {
  if (overrideIntensities && overrideIntensities.length === 24) {
    const baseDate = new Date(simulationTime);
    const hourlyForecast: ForecastPoint[] = overrideIntensities.map((intensity, h) => ({
      timestamp: simulationTime + h * 3600000,
      carbonIntensity: intensity,
      renewablePercentage: Math.round(Math.max(5, 80 - (intensity / 10))),
    }));
    
    const profile = REGION_PROFILES[regionId];
    return {
      id: regionId,
      name: profile.name,
      currentCarbonIntensity: overrideIntensities[0],
      renewablePercentage: hourlyForecast[0].renewablePercentage,
      hourlyForecast,
      gridCondition: getGridCondition(overrideIntensities[0], regionId),
      updatedAt: simulationTime,
    };
  }
  
  return generateForecast(regionId, simulationTime, 42); // Fixed seed for determinism
}
