import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { AppSettings, RegionId } from '../../types';
import { saveSettings } from '../../services/storageService';
import {
  Sliders,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  ShieldAlert,
  Save,
  CheckCircle2,
  Zap,
  Globe,
  FastForward,
  RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { state, dispatch, addToast, advanceTime, refreshForecasts, resetApp } = useApp();
  const { settings, simulation } = state;

  const [formSettings, setFormSettings] = useState<AppSettings>(settings);
  const [advanceHours, setAdvanceHours] = useState<number>(4);

  const handleSave = () => {
    saveSettings(formSettings);
    dispatch({ type: 'SET_SETTINGS', payload: formSettings });
    addToast('success', 'Settings Saved', 'Scheduling & simulation parameters updated.');
  };

  const handleExportJSON = () => {
    const data = {
      jobs: state.jobs,
      regions: state.regions,
      settings: state.settings,
      simulation: state.simulation,
      analytics: state.analytics,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenqueue-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Export Complete', 'Full database downloaded as JSON.');
  };

  const handleClearData = () => {
    if (window.confirm('WARNING: This will wipe all jobs, executions, and settings. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
          System Settings & Simulation Controls
        </h2>
        <p className="text-xs text-[#8DA29E] mt-1">
          Configure baseline regions, optimization thresholds, and time advancement parameters for the GreenQueue engine.
        </p>
      </div>

      {/* Scheduling Optimization Settings */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2 border-b border-[#24343C] pb-3">
          <Zap className="w-4 h-4 text-[#75E0A2]" />
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Core Scheduling Parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
              Default Baseline Comparison Region
            </label>
            <select
              value={formSettings.defaultBaselineRegion}
              onChange={(e) => setFormSettings({ ...formSettings, defaultBaselineRegion: e.target.value as RegionId })}
              className="w-full px-3 py-2 rounded-lg bg-[#14232B] border border-[#24343C] text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
            >
              <option value="india">India (Default Conventional Baseline)</option>
              <option value="north-europe">North Europe</option>
              <option value="west-us">West US</option>
            </select>
            <p className="text-[10px] text-[#8DA29E] mt-1">
              Used to calculate avoided emissions when automatic region selection is enabled.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#8DA29E] uppercase tracking-wider mb-1.5">
              Minimum Carbon Reduction Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="90"
              value={formSettings.minimumCarbonReduction}
              onChange={(e) => setFormSettings({ ...formSettings, minimumCarbonReduction: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg bg-[#14232B] border border-[#24343C] text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
            />
            <p className="text-[10px] text-[#8DA29E] mt-1">
              Minimum savings required before delaying a flexible job.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.autoRegionSelection}
              onChange={(e) => setFormSettings({ ...formSettings, autoRegionSelection: e.target.checked })}
              className="rounded bg-[#14232B] border-[#24343C] text-[#75E0A2] focus:ring-0"
            />
            <span className="text-xs text-[#E8F1EE]">
              Allow cross-regional job placement when region is set to 'Automatic Selection'
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.flexibleWorkloadOptimization}
              onChange={(e) => setFormSettings({ ...formSettings, flexibleWorkloadOptimization: e.target.checked })}
              className="rounded bg-[#14232B] border-[#24343C] text-[#75E0A2] focus:ring-0"
            />
            <span className="text-xs text-[#E8F1EE]">
              Enable multi-hour carbon-aware shifting for flexible workloads
            </span>
          </label>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-sm transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Scheduling Preferences</span>
        </button>
      </div>

      {/* Simulation Controls */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#24343C] pb-3">
          <Clock className="w-4 h-4 text-[#75E0A2]" />
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Simulated Time Controls
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-semibold text-[#E8F1EE]">Current Simulated Time</p>
            <p className="font-mono text-[#75E0A2] text-sm mt-0.5">
              {new Date(simulation.currentTime).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={advanceHours}
              onChange={(e) => setAdvanceHours(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE]"
            >
              <option value={1}>+1 Hour</option>
              <option value={4}>+4 Hours</option>
              <option value={8}>+8 Hours</option>
              <option value={12}>+12 Hours</option>
              <option value={24}>+24 Hours</option>
            </select>

            <button
              onClick={() => {
                advanceTime(advanceHours);
                addToast('info', 'Time Advanced', `Advanced simulated clock by ${advanceHours} hour(s).`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-semibold"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Advance Clock</span>
            </button>

            <button
              onClick={refreshForecasts}
              className="p-1.5 rounded-lg bg-[#14232B] hover:bg-[#101A22] text-[#8DA29E] border border-[#24343C]"
              title="Refresh Forecasts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#24343C] pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#E8F1EE] uppercase tracking-wider">
            Data Management & Demo Resets
          </h3>
        </div>

        <p className="text-xs text-[#8DA29E]">
          Backup your application state or restore the demo environment to its initial 10 academic workloads.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Database JSON</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset application to the default 10 sample workloads?')) {
                resetApp();
              }
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14232B] hover:bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Sample Jobs</span>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

