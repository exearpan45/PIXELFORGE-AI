import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Cpu,
  Clock,
  Layers,
  Pause,
  Play,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  ShieldCheck,
} from 'lucide-react';
import { ProcessingProgress } from '../types';

interface ProcessingOverlayProps {
  progress: ProcessingProgress;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  title?: string;
  isCancelling?: boolean;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({
  progress,
  onCancel,
  onPause,
  onResume,
  title = 'AI Processing in Progress',
  isCancelling = false,
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const formatTime = (ms?: number) => {
    if (!ms || ms <= 0) return '0s';
    const totalSec = Math.round(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min > 0) return `${min}m ${sec}s`;
    return `${sec}s`;
  };

  const isPaused = progress.isPaused || false;
  const watchdog = progress.watchdog;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-[#11111c] border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.25)] flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-600/20 blur-3xl pointer-events-none rounded-full" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
                {progress.activePreset && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    progress.activePreset === 'eco'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                      : progress.activePreset === 'balanced'
                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                  }`}>
                    {progress.activePreset} Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">100% Client-Side Engine • Hardware Protected</p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Cancel process"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Callout if Paused or Throttled */}
        {isPaused ? (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-xs text-amber-200">
            <Pause className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Processing is paused. System resources have been yielded to the OS.</span>
          </div>
        ) : watchdog?.isThrottled ? (
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2.5 text-xs text-purple-200">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Adaptive CPU watchdog active: yielding {watchdog.throttleYieldMs}ms between frames to protect Core i3 / RAM.</span>
          </div>
        ) : null}

        {/* Progress Bar & Percentage */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-purple-300 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              {progress.percent}%
            </span>
            <span className="text-zinc-400 text-[11px] truncate max-w-[240px]">
              {progress.message}
            </span>
          </div>

          <div className="relative w-full h-3 rounded-full bg-black/60 overflow-hidden border border-white/10 p-0.5">
            <div
              style={{ width: `${progress.percent}%` }}
              className={`h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(168,85,247,0.6)] ${
                isPaused
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400'
              }`}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Elapsed</p>
              <p className="font-mono text-zinc-200">{formatTime(progress.elapsedTimeMs)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <p className="text-[9px] text-purple-300 uppercase tracking-wider font-semibold">Est. Remaining</p>
              <p className="font-mono text-purple-200 font-bold">{formatTime(progress.estimatedRemainingMs)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5">
            <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Frames & Speed</p>
              <p className="font-mono text-zinc-200">
                {progress.currentFrame && progress.totalFrames
                  ? `${progress.currentFrame}/${progress.totalFrames}`
                  : `${progress.percent}%`}
                {progress.fps ? ` • ${progress.fps} FPS` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Resource Watchdog Bar */}
        {watchdog && (
          <div className="p-3 rounded-2xl bg-black/50 border border-white/8 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-zinc-400">Workload:</span>
              <span className={`font-bold ${
                watchdog.cpuPressure === 'cool'
                  ? 'text-emerald-400'
                  : watchdog.cpuPressure === 'moderate'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}>
                {watchdog.cpuPressure.toUpperCase()} ({watchdog.frameLatencyMs}ms/f)
              </span>
            </div>

            {watchdog.heapUsedMb !== undefined && (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Heap: {watchdog.heapUsedMb} MB</span>
              </div>
            )}
          </div>
        )}

        {/* Startup Diagnostic Accordion Toggle */}
        {progress.diagnostics && progress.diagnostics.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-black/40 overflow-hidden">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs text-zinc-300 hover:bg-white/5 transition-colors font-medium"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                Startup Diagnostic Timeline ({progress.diagnostics.length} Stages)
              </span>
              {showDiagnostics ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {showDiagnostics && (
              <div className="p-3 pt-0 space-y-1.5 border-t border-white/5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {progress.diagnostics.map((evt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 border-b border-white/5 last:border-0"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {evt.status === 'success' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : evt.status === 'warn' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-purple-400 border-t-transparent animate-spin shrink-0" />
                      )}
                      <span className="text-zinc-300 truncate">{evt.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {evt.durationMs !== undefined && (
                        <span className="text-purple-300">{evt.durationMs}ms</span>
                      )}
                      {evt.heapUsedMb && (
                        <span className="text-zinc-500">{evt.heapUsedMb}MB</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls Footer: Pause, Resume, Cancel */}
        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <div className="flex items-center gap-2">
            {onPause && !isPaused && (
              <button
                onClick={onPause}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            )}
            {onResume && isPaused && (
              <button
                onClick={onResume}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Resume
              </button>
            )}
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-colors"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
