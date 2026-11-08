import { DiagnosticEvent, WatchdogMetrics, AdvancedCancellationToken } from '../types';

/**
 * Diagnostic Tracker for measuring exact startup timeline,
 * latencies, memory footprint, and stage transitions.
 */
export class DiagnosticTracker {
  private events: DiagnosticEvent[] = [];
  private activeStages: Map<string, { startTime: number; name: string }> = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.events = [];
    this.activeStages.clear();
  }

  public getMemorySnapshot(): { heapUsedMb?: number; heapLimitMb?: number } {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        heapUsedMb: Math.round(mem.usedJSHeapSize / (1024 * 1024)),
        heapLimitMb: Math.round(mem.jsHeapSizeLimit / (1024 * 1024)),
      };
    }
    return {};
  }

  public startStage(stageId: string, name: string, details?: string): void {
    const startTime = performance.now();
    this.activeStages.set(stageId, { startTime, name });

    // Mark in browser performance timeline
    try {
      performance.mark(`pixelforge-start-${stageId}`);
    } catch {
      // ignore
    }

    const mem = this.getMemorySnapshot();
    const event: DiagnosticEvent = {
      stageId,
      name,
      timestampMs: Math.round(startTime),
      status: 'pending',
      details,
      heapUsedMb: mem.heapUsedMb,
    };
    this.events.push(event);
  }

  public completeStage(stageId: string, details?: string): void {
    const active = this.activeStages.get(stageId);
    const endTime = performance.now();
    let durationMs = 0;

    if (active) {
      durationMs = Math.round(endTime - active.startTime);
      this.activeStages.delete(stageId);
      try {
        performance.mark(`pixelforge-end-${stageId}`);
        performance.measure(`pixelforge-${stageId}`, `pixelforge-start-${stageId}`, `pixelforge-end-${stageId}`);
      } catch {
        // ignore
      }
    }

    const mem = this.getMemorySnapshot();
    // Update existing pending event or add completed
    const existing = this.events.find((e) => e.stageId === stageId && e.status === 'pending');
    if (existing) {
      existing.status = 'success';
      existing.durationMs = durationMs;
      if (details) existing.details = details;
      if (mem.heapUsedMb) existing.heapUsedMb = mem.heapUsedMb;
    } else {
      this.events.push({
        stageId,
        name: active?.name || stageId,
        timestampMs: Math.round(endTime),
        durationMs,
        status: 'success',
        details,
        heapUsedMb: mem.heapUsedMb,
      });
    }
  }

  public warnStage(stageId: string, warning: string): void {
    const mem = this.getMemorySnapshot();
    const existing = this.events.find((e) => e.stageId === stageId);
    if (existing) {
      existing.status = 'warn';
      existing.details = `${existing.details ? existing.details + ' • ' : ''}${warning}`;
    } else {
      this.events.push({
        stageId,
        name: stageId,
        timestampMs: Math.round(performance.now()),
        status: 'warn',
        details: warning,
        heapUsedMb: mem.heapUsedMb,
      });
    }
  }

  public failStage(stageId: string, error: string): void {
    const mem = this.getMemorySnapshot();
    const existing = this.events.find((e) => e.stageId === stageId);
    if (existing) {
      existing.status = 'error';
      existing.details = error;
    } else {
      this.events.push({
        stageId,
        name: stageId,
        timestampMs: Math.round(performance.now()),
        status: 'error',
        details: error,
        heapUsedMb: mem.heapUsedMb,
      });
    }
  }

  public getEvents(): DiagnosticEvent[] {
    return [...this.events];
  }
}

/**
 * Resource Protection Watchdog
 * Continuously measures frame processing latency and heap memory pressure.
 * Automatically throttles execution yield delays to prevent 98% CPU starvation
 * and keeps the laptop screen and browser responsive.
 */
export class ResourceProtectionWatchdog {
  private frameLatencies: number[] = [];
  private baseYieldMs: number;
  private currentYieldMs: number;
  private isThrottled: boolean = false;

  constructor(preset: 'eco' | 'balanced' | 'quality') {
    // In ECO mode, default to 25ms yield to protect 2-core / 4-thread CPUs
    this.baseYieldMs = preset === 'eco' ? 25 : preset === 'balanced' ? 8 : 2;
    this.currentYieldMs = this.baseYieldMs;
  }

  public recordFrameRender(latencyMs: number): WatchdogMetrics {
    this.frameLatencies.push(latencyMs);
    if (this.frameLatencies.length > 10) {
      this.frameLatencies.shift();
    }

    const avgLatency =
      this.frameLatencies.reduce((a, b) => a + b, 0) / this.frameLatencies.length;

    // Check Memory if available
    let heapUsedMb: number | undefined;
    let heapLimitMb: number | undefined;
    let isMemoryHigh = false;

    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      heapUsedMb = Math.round(mem.usedJSHeapSize / (1024 * 1024));
      heapLimitMb = Math.round(mem.jsHeapSizeLimit / (1024 * 1024));
      if (heapLimitMb && heapUsedMb / heapLimitMb > 0.75) {
        isMemoryHigh = true;
      }
    }

    // Determine CPU Pressure & Adaptive Throttle
    let cpuPressure: 'cool' | 'moderate' | 'high' = 'cool';
    if (avgLatency > 120 || isMemoryHigh) {
      cpuPressure = 'high';
      this.isThrottled = true;
      // Step up yield delay dynamically to prevent system freeze
      this.currentYieldMs = Math.min(60, this.baseYieldMs + 30);
    } else if (avgLatency > 60) {
      cpuPressure = 'moderate';
      this.isThrottled = true;
      this.currentYieldMs = Math.min(40, this.baseYieldMs + 15);
    } else {
      cpuPressure = 'cool';
      this.isThrottled = false;
      this.currentYieldMs = this.baseYieldMs;
    }

    return {
      heapUsedMb,
      heapLimitMb,
      frameLatencyMs: Math.round(avgLatency),
      cpuPressure,
      isThrottled: this.isThrottled,
      throttleYieldMs: this.currentYieldMs,
    };
  }

  public getYieldDelay(): number {
    return this.currentYieldMs;
  }

  public reset() {
    this.frameLatencies = [];
    this.currentYieldMs = this.baseYieldMs;
    this.isThrottled = false;
  }
}

/**
 * Creates an Advanced Cancellation Token supporting Pause, Resume, and Cancel.
 */
export function createAdvancedCancellationToken(): AdvancedCancellationToken {
  let isCancelled = false;
  let isPaused = false;
  let resumeResolve: (() => void) | null = null;

  return {
    get isCancelled() {
      return isCancelled;
    },
    get isPaused() {
      return isPaused;
    },
    pause() {
      isPaused = true;
    },
    resume() {
      isPaused = false;
      if (resumeResolve) {
        const resolve = resumeResolve;
        resumeResolve = null;
        resolve();
      }
    },
    async checkPause() {
      if (isPaused) {
        await new Promise<void>((resolve) => {
          resumeResolve = resolve;
        });
      }
    },
    cancel() {
      isCancelled = true;
      isPaused = false;
      if (resumeResolve) {
        const resolve = resumeResolve;
        resumeResolve = null;
        resolve();
      }
    },
  };
}

/**
 * Friendly cooperative thread yielding helper using scheduler.yield if supported,
 * falling back to setTimeout to give the browser and OS scheduler breathing room.
 */
export async function yieldThread(ms: number = 0): Promise<void> {
  if (ms > 0) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  if (typeof (window as any).scheduler !== 'undefined' && (window as any).scheduler.yield) {
    return (window as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
