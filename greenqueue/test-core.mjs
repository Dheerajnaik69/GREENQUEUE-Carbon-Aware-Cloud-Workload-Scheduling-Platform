// test-core.mjs - Automated unit & integration tests for GreenQueue

import { scheduleJob, rescheduleFlexibleJobs } from './src/services/schedulingService.js';
import { generateAllForecasts, getAverageCarbonIntensity } from './src/services/carbonForecastService.js';
import { calculateJobEmissions, formatEmissions } from './src/services/emissionsService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🧪 RUNNING GREENQUEUE VERIFICATION TESTS');
console.log('========================================\n');

// 1. Forecast Generation Test
console.log('Test Suite 1: Carbon Forecast Generation');
const now = Date.now();
const regions = generateAllForecasts(now, 42);
assert(regions.length === 3, 'Generates exactly 3 regions');
assert(regions.some(r => r.id === 'india'), 'Contains India region');
assert(regions.some(r => r.id === 'north-europe'), 'Contains North Europe region');
assert(regions.some(r => r.id === 'west-us'), 'Contains West US region');

const india = regions.find(r => r.id === 'india');
assert(india.hourlyForecast.length === 24, 'India forecast has 24 hourly data points');
assert(india.currentCarbonIntensity >= 400 && india.currentCarbonIntensity <= 800, `India intensity within simulated range (was ${india.currentCarbonIntensity})`);

const europe = regions.find(r => r.id === 'north-europe');
assert(europe.currentCarbonIntensity >= 50 && europe.currentCarbonIntensity <= 250, `North Europe intensity within range (was ${europe.currentCarbonIntensity})`);

// 2. Urgent Workload Scheduling Test (Part 8.1 & Part 20.3)
console.log('\nTest Suite 2: Urgent Workload (No Intentional Delay)');
const urgentJob = {
  id: 'TEST-URGENT-001',
  name: 'Customer Payment API',
  type: 'web-service',
  priority: 'urgent',
  energyKwh: 20,
  runtimeHours: 1,
  deadlineHours: 2,
  preferredRegion: 'auto',
  createdAt: now,
  status: 'submitted',
};

const urgentResult = scheduleJob(urgentJob, regions, now, 'india');
assert(urgentResult.recommendedStartTime === now, 'Urgent job recommended start time is IMMEDIATE (0 delay)');
assert(urgentResult.candidates.length === 1, 'Urgent job only considers immediate execution candidate');
assert(urgentResult.explanation.includes('URGENT'), 'Scheduling explanation notes urgent classification');

// 3. Flexible Workload Scheduling Test (Part 8.3 & Part 20.8)
console.log('\nTest Suite 3: Flexible Workload (Lowest-Emission Window Search)');
const flexibleJob = {
  id: 'TEST-FLEX-001',
  name: 'AI Model Training',
  type: 'ml-training',
  priority: 'flexible',
  energyKwh: 120,
  runtimeHours: 4,
  deadlineHours: 24,
  preferredRegion: 'auto',
  createdAt: now,
  status: 'submitted',
};

const flexResult = scheduleJob(flexibleJob, regions, now, 'india');
assert(flexResult.candidates.length > 1, `Flexible job evaluated multiple candidate windows (${flexResult.candidates.length})`);
assert(flexResult.estimatedSavings >= 0, `Savings is non-negative (${flexResult.estimatedSavings.toFixed(2)} kg)`);
assert(flexResult.recommendedRegion === 'north-europe', `Selected lowest carbon region (North Europe, got ${flexResult.recommendedRegion})`);

// 4. Deadline Constraints Test (Part 8.2 & Part 20.1)
console.log('\nTest Suite 4: Strict Deadline Constraint Enforcement');
const tightJob = {
  id: 'TEST-TIGHT-001',
  name: 'Quick Sync',
  type: 'db-processing',
  priority: 'flexible',
  energyKwh: 30,
  runtimeHours: 2,
  deadlineHours: 3, // only 1 hour of potential postponement
  preferredRegion: 'auto',
  createdAt: now,
  status: 'submitted',
};

const tightResult = scheduleJob(tightJob, regions, now, 'india');
const validDeadline = tightResult.recommendedStartTime + tightJob.runtimeHours * 3600000 <= now + tightJob.deadlineHours * 3600000;
assert(validDeadline, 'Execution window finishes strictly on or before deadline');

// 5. Region Restriction Test (Part 8.3 & Part 20.5)
console.log('\nTest Suite 5: Regional Restriction Guarantee');
const restrictedJob = {
  id: 'TEST-RESTRICT-001',
  name: 'India Backup',
  type: 'backup',
  priority: 'flexible',
  energyKwh: 60,
  runtimeHours: 2,
  deadlineHours: 12,
  preferredRegion: 'india', // strictly restricted to India
  createdAt: now,
  status: 'submitted',
};

const restrictResult = scheduleJob(restrictedJob, regions, now, 'india');
assert(restrictResult.recommendedRegion === 'india', 'Job stayed in restricted India region');
assert(restrictResult.candidates.every(c => c.region === 'india'), 'Only India candidates were considered');

// 6. Zero Opportunity Test (Part 20.4)
console.log('\nTest Suite 6: No Delayed Opportunity (Runtime = Deadline)');
const zeroJob = {
  id: 'TEST-ZERO-001',
  name: 'Immediate Process',
  type: 'batch',
  priority: 'flexible',
  energyKwh: 50,
  runtimeHours: 4,
  deadlineHours: 4, // Deadline == Runtime, zero room to delay
  preferredRegion: 'india',
  createdAt: now,
  status: 'submitted',
};

const zeroResult = scheduleJob(zeroJob, regions, now, 'india');
assert(zeroResult.recommendedStartTime === now, 'Recommends immediate start when deadline equals runtime');

// 7. Carbon Accounting & Calculations (Part 11)
console.log('\nTest Suite 7: Emissions Calculation Formulas');
const calc1 = calculateJobEmissions(100, 500); // 100 kWh * 500 gCO2/kWh / 1000 = 50 kg
assert(calc1 === 50, '100 kWh @ 500 gCO2/kWh = exactly 50 kg CO2');

const formatted = formatEmissions(1250);
assert(formatted.includes('t CO₂'), '1250 kg formatted as tonnes');

console.log('\n========================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}

