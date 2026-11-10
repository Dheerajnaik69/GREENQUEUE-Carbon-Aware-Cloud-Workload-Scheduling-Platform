import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { ExecutionRecord, RegionId, WorkloadType } from '../../types';
import { getExecutions } from '../../services/storageService';
import { exportToCSV, downloadCSV } from '../../services/analyticsService';
import { Badge } from '../../components/common/Badge';
import {
  History,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Zap,
  Leaf,
  Layers
} from 'lucide-react';

export const ExecutionHistoryPage: React.FC = () => {
  const { state, addToast } = useApp();
  const executions = getExecutions();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredExecutions = executions.filter((e) => {
    const matchesSearch =
      e.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.jobId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || e.actualRegion === regionFilter;
    const matchesType = typeFilter === 'all' || e.jobType === typeFilter;
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesRegion && matchesType && matchesStatus;
  });

  const handleExport = () => {
    if (filteredExecutions.length === 0) {
      addToast('warning', 'No Records', 'There are no execution records to export.');
      return;
    }

    const csvContent = exportToCSV(filteredExecutions);
    downloadCSV(csvContent, `greenqueue-execution-history-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast('success', 'Export Complete', 'Execution audit log downloaded as CSV.');
  };

  const totalSaved = filteredExecutions.reduce((sum, e) => sum + e.co2Avoided, 0);
  const totalEnergy = filteredExecutions.reduce((sum, e) => sum + e.energyConsumed, 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#E8F1EE] tracking-tight">
            Workload Execution Audit History
          </h2>
          <p className="text-xs text-[#8DA29E] mt-1">
            Immutable log of dispatched workloads, real-time grid conditions, and realized emissions savings.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14232B] hover:bg-[#1f333f] text-[#75E0A2] border border-[#24343C] text-xs font-semibold transition-all self-start md:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <p className="text-[10px] text-[#8DA29E] uppercase tracking-wider font-semibold">Executions Logged</p>
          <p className="text-xl font-bold text-[#E8F1EE] mt-1 font-mono">{filteredExecutions.length}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-[#8DA29E] uppercase tracking-wider font-semibold">Realized CO₂ Avoided</p>
          <p className="text-xl font-bold text-[#75E0A2] mt-1 font-mono">{totalSaved.toFixed(2)} kg</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-[#8DA29E] uppercase tracking-wider font-semibold">Total Energy Consumed</p>
          <p className="text-xl font-bold text-sky-400 mt-1 font-mono">{totalEnergy.toFixed(1)} kWh</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-[10px] text-[#8DA29E] uppercase tracking-wider font-semibold">Success Rate</p>
          <p className="text-xl font-bold text-[#C4F27B] mt-1 font-mono">
            {filteredExecutions.length > 0
              ? `${Math.round((filteredExecutions.filter(e => e.status === 'completed').length / filteredExecutions.length) * 100)}%`
              : '100%'}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-[#8DA29E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job ID or name..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] placeholder-[#8DA29E]/50 focus:outline-none focus:border-[#75E0A2]"
          />
        </div>

        {/* Region Filter */}
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
        >
          <option value="all">All Regions</option>
          <option value="india">India</option>
          <option value="north-europe">North Europe</option>
          <option value="west-us">West US</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
        >
          <option value="all">All Workload Types</option>
          <option value="batch">Batch</option>
          <option value="ml-training">ML Training</option>
          <option value="backup">Backup</option>
          <option value="analytics">Analytics</option>
          <option value="web-service">Web Service</option>
          <option value="db-processing">DB Processing</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-1.5 rounded-lg bg-[#14232B] border border-[#24343C] text-xs text-[#E8F1EE] focus:outline-none focus:border-[#75E0A2]"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Execution Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#24343C] bg-[#14232B]/50 text-[10px] font-semibold text-[#8DA29E] uppercase tracking-wider">
                <th className="py-3 px-4">Job</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Timestamps</th>
                <th className="py-3 px-4">Carbon Intensity</th>
                <th className="py-3 px-4">Energy / Duration</th>
                <th className="py-3 px-4">Emissions Impact</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24343C]/60">
              {filteredExecutions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8DA29E]">
                    <History className="w-8 h-8 text-[#24343C] mx-auto mb-2" />
                    <p className="font-semibold text-[#E8F1EE]">No execution records found</p>
                    <p className="text-xs text-[#8DA29E] mt-0.5">
                      Jobs completed or failed in the Workload Queue will be recorded here automatically.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExecutions.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#14232B]/40 transition-colors">
                    {/* Job ID & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#75E0A2] bg-[#75E0A2]/10 px-1.5 py-0.5 rounded border border-[#75E0A2]/20">
                          {rec.jobId}
                        </span>
                        <div>
                          <span className="font-semibold text-[#E8F1EE]">{rec.jobName}</span>
                          <p className="text-[10px] text-[#8DA29E] capitalize">{rec.jobType} • {rec.priority}</p>
                        </div>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3 px-4 capitalize">
                      <span className="text-[#E8F1EE] font-medium">{rec.actualRegion}</span>
                      {rec.originalRegion !== rec.actualRegion && (
                        <p className="text-[10px] text-[#75E0A2]">Shifted from {rec.originalRegion}</p>
                      )}
                    </td>

                    {/* Timestamps */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8DA29E]">
                      <div>Start: <span className="text-[#E8F1EE]">{new Date(rec.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <div>End: <span className="text-[#E8F1EE]">{new Date(rec.actualEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                    </td>

                    {/* Carbon Intensity */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-[#75E0A2] font-semibold">{rec.actualCarbonIntensity.toFixed(0)} g</span>
                      <p className="text-[10px] text-[#8DA29E]">Base: {rec.baselineCarbonIntensity.toFixed(0)} g</p>
                    </td>

                    {/* Energy & Duration */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-[#E8F1EE]">{rec.energyConsumed} kWh</span>
                      <p className="text-[10px] text-[#8DA29E]">{rec.executionDuration}h runtime</p>
                    </td>

                    {/* Emissions & Savings */}
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-semibold">{rec.actualEmissions.toFixed(2)} kg CO₂</span>
                      {rec.co2Avoided > 0 ? (
                        <p className="text-[10px] text-[#C4F27B] font-bold">
                          Avoided: {rec.co2Avoided.toFixed(2)} kg
                        </p>
                      ) : (
                        <p className="text-[10px] text-[#8DA29E]">Base: {rec.baselineEmissions.toFixed(2)} kg</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right">
                      <Badge variant={rec.status}>
                        {rec.status}
                      </Badge>
                      {rec.failureReason && (
                        <p className="text-[10px] text-rose-400 mt-1 truncate max-w-[150px]" title={rec.failureReason}>
                          {rec.failureReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

