import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListTodo,
  Leaf,
  Cpu,
  History,
  FileBarChart,
  Presentation,
  Sliders,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/jobs/new', label: 'Job Submission', icon: PlusCircle },
    { to: '/queue', label: 'Workload Queue', icon: ListTodo },
    { to: '/carbon', label: 'Carbon Intelligence', icon: Leaf },
    { to: '/scheduler', label: 'Smart Scheduler', icon: Cpu },
    { to: '/history', label: 'Execution History', icon: History },
    { to: '/reports', label: 'Sustainability Reports', icon: FileBarChart },
    { to: '/scenarios', label: 'Scenario Library', icon: Sparkles },
    { to: '/presentation', label: 'Presentation Mode', icon: Presentation, highlight: true },
    { to: '/settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-[#101A22] border-r border-[#24343C] flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#24343C] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#75E0A2] to-[#27B56E] flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Leaf className="w-5 h-5 text-[#080D12] stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-[#E8F1EE]">GreenQueue</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-[#C4F27B]/15 text-[#C4F27B] border border-[#C4F27B]/30 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-[#8DA29E] font-medium leading-none mt-0.5">
              Carbon-Aware Scheduler
            </p>
          </div>
        </div>
      </div>

      {/* Demo Badge */}
      <div className="px-5 py-2.5 bg-[#14232B]/60 border-b border-[#24343C] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-[#8DA29E]">Demo Simulation Active</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
          Academic
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-transparent text-[#75E0A2] border-l-2 border-[#75E0A2] font-semibold'
                  : item.highlight
                  ? 'text-[#C4F27B] hover:bg-[#14232B] hover:text-[#E8F1EE]'
                  : 'text-[#8DA29E] hover:bg-[#14232B] hover:text-[#E8F1EE]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#75E0A2]' : item.highlight ? 'text-[#C4F27B]' : ''}`} />
              <span className="truncate">{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[#C4F27B]/20 text-[#C4F27B] font-bold">
                  LIVE
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Academic Project Footer */}
      <div className="p-4 border-t border-[#24343C] bg-[#0c151c]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#14232B] border border-[#24343C] flex items-center justify-center shrink-0 text-[#75E0A2]">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h5 className="text-xs font-semibold text-[#E8F1EE] truncate">NMIT Bangalore</h5>
            <p className="text-[10px] text-[#8DA29E] truncate">Green IT & Sustainability</p>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-[#24343C]/60 flex items-center justify-between text-[10px] text-[#8DA29E]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Deterministic Algorithm
          </span>
          <span className="text-[#75E0A2]">ISO 14064</span>
        </div>
      </div>
    </aside>
  );
};

