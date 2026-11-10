import React, { useState } from 'react';
import { Activity, HardDrive, ShieldCheck, Minimize2, X, ChevronUp } from 'lucide-react';
import { HardwareInfo, ProcessingPreset, WatchdogMetrics } from '../types';

interface FloatingResourceMonitorProps {
  isProcessing: boolean;
  activePreset: ProcessingPreset;
  onPresetChange?: (preset: ProcessingPreset) => void;
  watchdogMetrics?: WatchdogMetrics;
  hardwareInfo?: HardwareInfo | null;
}

export const FloatingResourceMonitor: React.FC<FloatingResourceMonitorProps> = ({
  isProcessing,
  activePreset,
  watchdogMetrics,
  hardwareInfo,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const frameTime = watchdogMetrics?.frameLatencyMs;
  const heapUsed = watchdogMetrics?.heapUsedMb;
  const heapLimit = watchdogMetrics?.heapLimitMb;
  const pressure = watchdogMetrics?.cpuPressure;
  const threadCount = hardwareInfo?.hardwareConcurrency ||
    (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4);

  const frameStatus = pressure === 'high' ? 'High' : pressure === 'moderate' ? 'Moderate' : 'Normal';
  const statusColor = pressure === 'high' ? 'text-rose-400' : pressure === 'moderate' ? 'text-amber-400' : 'text-emerald-400';

  if (isClosed) {
    return (
      <button
        onClick={() => setIsClosed(false)}
        className="fixed bottom-5 right-5 z-40 px-3 py-2 rounded-2xl bg-[#10101b]/90 hover:bg-[#151528] border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-xl transition-all"
        title="Show workload monitor"
      >
        <Activity className="w-3.5 h-3.5 text-emerald-400" />
        <span>Workload Monitor</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      {isMinimized ? (
        <div
          onClick={() => setIsMinimized(false)}
          className="cursor-pointer px-4 py-2.5 rounded-2xl bg-[#10101b]/95 border border-purple-500/30 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3 font-mono text-xs hover:border-purple-400 transition-all"
        >
          <span className="text-zinc-400">Frame:</span>
          <span className={statusColor}>{frameTime !== undefined ? `${frameTime}ms` : '—'}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">JS heap:</span>
          <span className="text-purple-300">{heapUsed !== undefined ? `${heapUsed}MB` : 'N/A'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 uppercase text-zinc-300">
            {activePreset}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        </div>
      ) : (
        <div className="w-80 rounded-3xl bg-[#11111c]/95 border border-purple-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl p-4 flex flex-col gap-3.5 text-white">
          <div className="flex items-center justify-between pb-2 border-b border-white/8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">Workload Monitor</h4>
                <p className="text-[10px] text-zinc-400 font-mono">Browser-side diagnostics</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-zinc-400">
              <button onClick={() => setIsMinimized(true)} className="p-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Minimize monitor">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsClosed(true)} className="p-1 hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Hide monitor">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Frame render time</p>
              <p className={`text-xl font-bold font-mono ${statusColor}`}>{frameTime !== undefined ? `${frameTime} ms` : 'Waiting'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Frame pressure</p>
              <p className={`text-sm font-bold ${statusColor}`}>{isProcessing ? frameStatus : 'Idle'}</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                JavaScript heap
              </span>
              <span className="font-mono font-bold text-purple-300">
                {heapUsed !== undefined ? `${heapUsed} MB` : 'Not exposed'}
              </span>
            </div>
            {heapLimit !== undefined && (
              <p className="text-[10px] text-zinc-500 mt-1">Browser heap limit: {heapLimit} MB</p>
            )}
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
            <span className="text-zinc-300">Processing state</span>
            <span className={isProcessing ? 'text-emerald-300' : 'text-zinc-400'}>{isProcessing ? 'Active' : 'Idle'}</span>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-white/5 text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activePreset.toUpperCase()} mode • {threadCount} logical threads</span>
            </div>
          </div>
          <p className="text-[10px] leading-relaxed text-zinc-500">
            Browsers cannot report system-wide CPU percentage or total RAM use. This panel shows frame timing and JavaScript heap only.
            {hardwareInfo?.isLowEndDevice ? ' Low-end device safeguards are active.' : ''}
          </p>
        </div>
      )}
    </div>
  );
};
