import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  Clock,
  FastForward,
  RefreshCw,
  Presentation,
  Bell,
  Play,
  RotateCcw
} from 'lucide-react';

interface TopNavProps {
  title?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ title }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, advanceTime, refreshForecasts, resetApp } = useApp();

  const getPageTitle = () => {
    if (title) return title;
    switch (location.pathname) {
      case '/': return 'Operational Dashboard';
      case '/jobs/new': return 'Submit New Workload';
      case '/queue': return 'Workload Queue & Execution';
      case '/carbon': return 'Regional Carbon Intelligence';
      case '/scheduler': return 'Deterministic Smart Scheduler';
      case '/history': return 'Workload Execution History';
      case '/reports': return 'Sustainability & Emissions Reports';
      case '/scenarios': return 'Demo Scenario Library';
      case '/presentation': return 'Presentation Demo Mode';
      case '/settings': return 'System Settings & Controls';
      default: return 'GreenQueue';
    }
  };

  const formattedSimTime = new Date(state.simulation.currentTime).toLocaleString('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-[#101A22]/90 backdrop-blur-md border-b border-[#24343C] px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Page Title & Breadcrumb */}
      <div>
        <h1 className="text-lg font-bold text-[#E8F1EE] tracking-tight flex items-center gap-2">
          {getPageTitle()}
        </h1>
        <p className="text-[11px] text-[#8DA29E]">
          Carbon-aware workload orchestration platform • Academic Prototype
        </p>
      </div>

      {/* Control Actions & Simulation Clock */}
      <div className="flex items-center gap-3">
        {/* Simulation Clock Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs">
          <Clock className="w-3.5 h-3.5 text-[#75E0A2]" />
          <span className="text-[#8DA29E] font-medium">Sim Clock:</span>
          <span className="text-[#E8F1EE] font-mono font-semibold">{formattedSimTime}</span>
        </div>

        {/* Quick Advance Simulation Time */}
        <div className="flex items-center rounded-lg bg-[#14232B] border border-[#24343C] p-0.5">
          <button
            onClick={() => advanceTime(1)}
            title="Advance simulated clock by 1 hour"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#8DA29E] hover:text-[#75E0A2] hover:bg-[#101A22] rounded transition-all"
          >
            <FastForward className="w-3 h-3 text-[#75E0A2]" />
            +1h
          </button>
          <div className="w-[1px] h-4 bg-[#24343C]" />
          <button
            onClick={() => advanceTime(4)}
            title="Advance simulated clock by 4 hours"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#8DA29E] hover:text-[#75E0A2] hover:bg-[#101A22] rounded transition-all"
          >
            <FastForward className="w-3 h-3 text-[#75E0A2]" />
            +4h
          </button>
        </div>

        {/* Refresh Forecast */}
        <button
          onClick={refreshForecasts}
          title="Refresh carbon intensity forecasts"
          className="p-2 rounded-lg bg-[#14232B] border border-[#24343C] text-[#8DA29E] hover:text-[#75E0A2] hover:bg-[#101A22] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Reset Demo Quick Button */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demo jobs and data to initial state?')) {
              resetApp();
            }
          }}
          title="Reset demo data to initial 10 workloads"
          className="p-2 rounded-lg bg-[#14232B] border border-[#24343C] text-[#8DA29E] hover:text-amber-400 hover:bg-[#101A22] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Presentation Mode Direct Button */}
        {location.pathname !== '/presentation' && (
          <button
            onClick={() => navigate('/presentation')}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#27B56E] to-[#75E0A2] text-[#080D12] text-xs font-bold hover:brightness-110 shadow-md shadow-emerald-500/10 transition-all"
          >
            <Presentation className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Presentation Mode</span>
          </button>
        )}
      </div>
    </header>
  );
};

