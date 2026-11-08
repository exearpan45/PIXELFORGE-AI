export type NavigationTab = 'home' | 'photo' | 'video' | 'projects' | 'about';

export type ResolutionTarget = 'original' | '2x' | '4x' | '1080p' | '1440p' | '4k';

export interface EnhancementSettings {
  resolution: ResolutionTarget;
  detailRestoration: number; // 0 - 100
  noiseReduction: number;    // 0 - 100
  sharpening: number;        // 0 - 100
  faceEnhancement: number;   // 0 - 100
  colorEnhancement: number;  // 0 - 100
  textureEnhancement: number;// 0 - 100
}

export interface VideoEnhancementSettings extends EnhancementSettings {
  targetFps?: number;
  preserveAudio: boolean;
  quality: 'fast' | 'balanced' | 'ultra';
}

export interface HardwareInfo {
  hasWebGPU: boolean;
  webgpuAdapterName?: string;
  hasWebGL2: boolean;
  webglRenderer?: string;
  maxTextureSize: number;
  hardwareConcurrency: number;
  deviceMemoryGb?: number;
  isLowEndDevice: boolean;
}

export interface AppPreferences {
  theme: 'dark' | 'light';
  defaultResolution: ResolutionTarget;
  gpuMode: 'auto' | 'webgpu' | 'webgl' | 'wasm';
  tileSize: 128 | 256 | 512 | 1024;
  lowMemoryMode: boolean;
  autoSaveHistory: boolean;
}

export interface ProjectRecord {
  id: string;
  type: 'image' | 'video';
  originalFileName: string;
  originalWidth: number;
  originalHeight: number;
  originalSizeBytes: number;
  targetWidth: number;
  targetHeight: number;
  outputSizeBytes?: number;
  settings: EnhancementSettings;
  createdAt: number;
  thumbnailUrl?: string;
  durationSeconds?: number;
  mimeType: string;
}

export interface ProcessingProgress {
  stage: 'idle' | 'initializing' | 'tiling' | 'inferencing' | 'extracting_frames' | 'processing_frames' | 'encoding' | 'finalizing' | 'completed' | 'error';
  percent: number; // 0 - 100
  message: string;
  currentFrame?: number;
  totalFrames?: number;
  elapsedTimeMs?: number;
  estimatedRemainingMs?: number;
  fps?: number;
  isPaused?: boolean;
  activePreset?: 'eco' | 'balanced' | 'quality';
  diagnostics?: DiagnosticEvent[];
  watchdog?: WatchdogMetrics;
}

export type ProcessingPreset = 'eco' | 'balanced' | 'quality';

export interface DiagnosticEvent {
  stageId: string;
  name: string;
  timestampMs: number;
  durationMs?: number;
  status: 'pending' | 'success' | 'warn' | 'error';
  details?: string;
  heapUsedMb?: number;
}

export interface WatchdogMetrics {
  heapUsedMb?: number;
  heapLimitMb?: number;
  frameLatencyMs: number;
  cpuPressure: 'cool' | 'moderate' | 'high';
  isThrottled: boolean;
  throttleYieldMs: number;
}

export interface AdvancedCancellationToken {
  isCancelled: boolean;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  checkPause: () => Promise<void>;
  cancel: () => void;
}
