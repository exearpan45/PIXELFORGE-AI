import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Sliders,
  Play,
  Pause,
  UploadCloud,
  FileVideo,
  Clapperboard,
  ShieldCheck,
  Activity,
  HardDrive,
  Info,
  CheckCircle2,
  Clock,
  Layers,
  X,
} from 'lucide-react';
import {
  AppPreferences,
  ProcessingProgress,
  ProjectRecord,
  ResolutionTarget,
  VideoEnhancementSettings,
  ProcessingPreset,
  AdvancedCancellationToken,
  HardwareInfo,
  DiagnosticEvent,
} from '../types';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { VideoComparisonPlayer } from '../components/VideoComparisonPlayer';
import { FloatingResourceMonitor } from '../components/FloatingResourceMonitor';
import {
  VideoEnhanceResult,
  VideoMetadata,
  parseVideoMetadata,
  videoEnhancerInstance,
} from '../services/video-engine';
import { calculateTargetDimensions } from '../services/image-engine';
import { createAdvancedCancellationToken } from '../services/diagnostic';
import { detectHardwareCapabilities, getRecommendedPreset } from '../services/hardware';
import { generateDemoVideoBlob } from '../services/samples';
import { saveProject } from '../services/storage';

interface VideoEnhancerProps {
  preferences: AppPreferences;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const VideoEnhancer: React.FC<VideoEnhancerProps> = ({ preferences, onNotify }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Hardware and Presets
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [preset, setPreset] = useState<ProcessingPreset>('eco');

  // Settings
  const [settings, setSettings] = useState<VideoEnhancementSettings>({
    resolution: '1080p',
    detailRestoration: 70,
    noiseReduction: 35,
    sharpening: 50,
    faceEnhancement: 40,
    colorEnhancement: 25,
    textureEnhancement: 45,
    preserveAudio: true,
    quality: 'balanced',
    targetFps: 30,
  });

  // Processing
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });
  const cancellationTokenRef = useRef<AdvancedCancellationToken | null>(null);

  // Result & Diagnostics
  const [enhancedResult, setEnhancedResult] = useState<VideoEnhanceResult | null>(null);
  const [generatingSample, setGeneratingSample] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);
  const [lastDiagnostics, setLastDiagnostics] = useState<DiagnosticEvent[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect hardware on mount and auto-select ECO preset if low-end
  useEffect(() => {
    detectHardwareCapabilities().then((hw) => {
      setHardware(hw);
      const recommended = getRecommendedPreset(hw);
      setPreset(recommended);
      if (recommended === 'eco') {
        onNotify(
          'info',
          'Low-Resource Protection Active',
          `Detected ${hw.hardwareConcurrency} cores / ${hw.deviceMemoryGb || 4}GB RAM. Defaulting to ECO Mode to prevent high CPU load and browser freezes.`
        );
      }
    });
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFile = async (file: File) => {
    const validExtensions = /\.(mp4|webm|mov|mkv)$/i;
    if (!file.type.startsWith('video/') && !file.name.match(validExtensions)) {
      onNotify('error', 'Unsupported Video', 'Please upload MP4, WebM, or MOV video files.');
      return;
    }

    try {
      const { metadata: meta, videoElement } = await parseVideoMetadata(file);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setMetadata(meta);
      videoElementRef.current = videoElement;
      setEnhancedResult(null);
      onNotify('success', 'Video Loaded', `${meta.width}×${meta.height} • ${meta.duration.toFixed(1)}s`);
    } catch (err: any) {
      onNotify('error', 'Video Decode Error', err.message || 'Could not parse video metadata.');
    }
  };

  const loadDemoVideo = async () => {
    setGeneratingSample(true);
    try {
      onNotify('info', 'Generating Test Clip', 'Synthesizing dynamic 640×360 video stream in browser...');
      const demoFile = await generateDemoVideoBlob();
      await handleFile(demoFile);
    } catch (err: any) {
      onNotify('error', 'Demo Clip Error', err.message || 'Failed to synthesize demo video.');
    } finally {
      setGeneratingSample(false);
    }
  };

  const startVideoEnhancement = async () => {
    if (!videoElementRef.current || !metadata || !videoFile) return;

    if (preset === 'eco' || hardware?.isLowEndDevice) {
      onNotify(
        'warning',
        'Low-resource video mode',
        'Low-resource mode caps output at 854×480 and 5 FPS, and limits clips to 30 seconds / 100 MB to reduce freezing risk.'
      );
    }

    setIsProcessing(true);
    const cancelToken = createAdvancedCancellationToken();
    cancellationTokenRef.current = cancelToken;

    try {
      const result = await videoEnhancerInstance.enhanceVideo(
        videoElementRef.current,
        metadata,
        settings,
        settings.resolution,
        preset,
        (p) => {
          setProgress(p);
          if (p.diagnostics && p.diagnostics.length > 0) {
            setLastDiagnostics(p.diagnostics);
          }
        },
        cancelToken
      );

      setEnhancedResult(result);
      setLastDiagnostics(videoEnhancerInstance.getTracker().getEvents());
      onNotify('success', 'Video Enhancement Completed!', `Rendered at ${result.targetWidth}×${result.targetHeight}`);

      // Save to project history
      if (preferences.autoSaveHistory) {
        const projectRecord: ProjectRecord = {
          id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'video',
          originalFileName: videoFile.name,
          originalWidth: metadata.width,
          originalHeight: metadata.height,
          originalSizeBytes: metadata.sizeBytes,
          targetWidth: result.targetWidth,
          targetHeight: result.targetHeight,
          outputSizeBytes: result.sizeBytes,
          durationSeconds: metadata.duration,
          settings: { ...settings },
          createdAt: Date.now(),
          mimeType: result.format,
        };
        await saveProject(projectRecord);
      }
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        onNotify('info', 'Enhancement Cancelled', 'Video frame processing stopped and buffers released.');
      } else {
        console.error(err);
        onNotify('error', 'Enhancement Failed', err.message || 'Failed to complete video enhancement.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePause = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.pause();
      setProgress((prev) => ({
        ...prev,
        isPaused: true,
        message: 'Processing Paused. System resources released.',
      }));
      onNotify('info', 'Processing Paused', 'Video playback paused and frame capture stopped until you resume.');
    }
  };

  const handleResume = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.resume();
      setProgress((prev) => ({ ...prev, isPaused: false }));
      onNotify('success', 'Processing Resumed', 'Continuing frame enhancement.');
    }
  };

  const handleCancel = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.cancel();
      setIsProcessing(false);
    }
  };

  const resetVideo = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    if (enhancedResult?.videoUrl) URL.revokeObjectURL(enhancedResult.videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setMetadata(null);
    setEnhancedResult(null);
  };

  const downloadResult = () => {
    if (!enhancedResult) return;
    const a = document.createElement('a');
    a.href = enhancedResult.videoUrl;
    const ext = enhancedResult.format.includes('mp4') ? 'mp4' : 'webm';
    const baseName = videoFile ? videoFile.name.replace(/\.[^/.]+$/, '') : 'pixelforge_enhanced';
    a.download = `${baseName}_${enhancedResult.targetWidth}x${enhancedResult.targetHeight}_enhanced.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const estimatedDims = metadata
    ? (() => {
        const requested = calculateTargetDimensions(metadata.width, metadata.height, settings.resolution);
        if (preset !== 'eco' && !hardware?.isLowEndDevice) return requested;
        const scale = Math.min(
          requested.width / metadata.width,
          requested.height / metadata.height,
          1.5,
          854 / metadata.width,
          480 / metadata.height
        );
        return {
          width: Math.max(1, Math.round(metadata.width * scale)),
          height: Math.max(1, Math.round(metadata.height * scale)),
        };
      })()
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              Video Workspace
            </span>
            <span className="text-zinc-500 text-xs">• 100% Client-Side Engine</span>
            {hardware && (
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                hardware.isLowEndDevice
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-purple-500/10 text-purple-300 border-purple-500/20'
              }`}>
                {hardware.hardwareConcurrency} Cores • {hardware.deviceMemoryGb || '4'}GB RAM
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Video Upscaler & Enhancer
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Upscale video locally in your browser. Low-resource processing uses reduced resolution and frame rate to limit CPU load.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastDiagnostics.length > 0 && (
            <button
              onClick={() => setShowDiagnosticModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Startup Diagnostics</span>
            </button>
          )}

          {videoFile && (
            <button
              onClick={resetVideo}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Upload New Video</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      {!videoFile ? (
        <div className="space-y-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group cursor-pointer p-8 sm:p-14 rounded-3xl border-2 border-dashed border-white/15 hover:border-purple-500/50 bg-[#10101b]/60 hover:bg-[#121222]/80 backdrop-blur-xl shadow-xl text-center flex flex-col items-center justify-center transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-lg mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide mb-1.5">
              Drop your video here, or <span className="text-purple-400 group-hover:underline">browse files</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-4">
              Upload MP4, WebM or MOV. Output resolution and audio support depend on your device's processing mode.
            </p>
            <div className="flex gap-2 text-[11px] font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/8">720p</span>
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/8">1080p</span>
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/8">2K QHD</span>
              <span className="px-2 py-0.5 rounded bg-black/40 border border-white/8">4K UHD</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <button
              onClick={loadDemoVideo}
              disabled={generatingSample}
              className="px-5 py-2.5 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Clapperboard className="w-4 h-4" />
              <span>{generatingSample ? 'Synthesizing Test Clip...' : 'Try With Dynamic Test Video'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Player & Preview */}
          <div className="lg:col-span-8 space-y-6">
            {enhancedResult && videoUrl ? (
              <div className="space-y-4">
                <VideoComparisonPlayer
                  originalUrl={videoUrl}
                  enhancedResult={enhancedResult}
                  originalMetadata={metadata!}
                  onDownload={downloadResult}
                />

                <div className="p-5 rounded-3xl bg-[#10101b] border border-emerald-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {enhancedResult.targetWidth}×{enhancedResult.targetHeight} Output Ready
                      </h4>
                      <p className="text-xs text-zinc-400">
                        {formatBytes(enhancedResult.sizeBytes)} • {enhancedResult.hasAudio ? 'Audio Included' : 'Audio Not Included'} • {(enhancedResult.duration).toFixed(1)}s
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={downloadResult}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Video</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-black/60 border border-white/10 shadow-2xl flex items-center justify-center">
                  {videoUrl && (
                    <video
                      src={videoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />
                  )}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-300">
                    Source: {metadata?.width}×{metadata?.height} @ {metadata?.estimatedFps || 30}fps
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#10101b] border border-white/10 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2 truncate">
                    <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />
                    {videoFile.name} ({formatBytes(videoFile.size)})
                  </span>
                  <span className="shrink-0">Audio: {metadata?.hasAudio ? 'Detected' : 'None'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#10101b] border border-white/10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Video Upscale Controls</h3>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Video Studio
                </span>
              </div>

              {/* Resolution options */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-zinc-200">Target Video Resolution</label>
                  {estimatedDims && (
                    <span className="text-purple-400 font-mono text-[11px]">
                      → {estimatedDims.width} × {estimatedDims.height}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(['720p', '1080p', '1440p', '4k'] as ResolutionTarget[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setSettings({ ...settings, resolution: res })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        settings.resolution === res
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                          : 'bg-black/40 hover:bg-white/5 text-zinc-300 border border-white/8'
                      }`}
                    >
                      {res === '4k' ? '4K UHD (2160p)' : res === '1440p' ? '2K QHD (1440p)' : res.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Protection Preset Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-zinc-200">Processing Preset</label>
                  <span className={`font-mono text-[11px] ${
                    preset === 'eco'
                      ? 'text-emerald-400'
                      : preset === 'balanced'
                      ? 'text-blue-400'
                      : 'text-purple-400'
                  }`}>
                    {preset === 'eco' ? '🛡️ ECO (Safe)' : preset === 'balanced' ? '⚖️ Balanced' : '🎯 Quality'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPreset('eco')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      preset === 'eco'
                        ? 'bg-emerald-600 text-white shadow-md border border-emerald-400'
                        : 'bg-black/40 hover:bg-white/5 text-zinc-300 border border-white/8'
                    }`}
                  >
                    🛡️ ECO
                  </button>
                  <button
                    disabled={Boolean(hardware?.isLowEndDevice)}
                    onClick={() => setPreset('balanced')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      preset === 'balanced'
                        ? 'bg-blue-600 text-white shadow-md border border-blue-400'
                        : 'bg-black/40 hover:bg-white/5 text-zinc-300 border border-white/8'
                    }`}
                  >
                    ⚖️ Balanced
                  </button>
                  <button
                    disabled={Boolean(hardware?.isLowEndDevice)}
                    onClick={() => setPreset('quality')}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold transition-all text-center ${
                      preset === 'quality'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400'
                        : 'bg-black/40 hover:bg-white/5 text-zinc-300 border border-white/8'
                    }`}
                  >
                    🎯 Quality
                  </button>
                </div>
              </div>

              {/* Low-End Device Banner */}
              {preset === 'eco' && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-xs text-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-300">Low-Resource Protection Active</span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Uses low-load 2D scaling at up to 854×480 and 5 FPS. ECO is limited to 30-second, 100 MB clips. Detail and color adjustments remain available; this cannot guarantee every device will remain responsive.
                    </p>
                  </div>
                </div>
              )}

              {/* Sliders */}
              {(preset === 'eco' || hardware?.isLowEndDevice) && (
                <p className="text-[11px] leading-relaxed text-emerald-200/80">
                  ECO uses lightweight canvas scaling. Detail and color adjustments are available; denoise and sharpening are disabled to protect older CPUs.
                </p>
              )}
              <div className="space-y-4 pt-1">
                {/* AI Detail */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Frame Detail</span>
                    <span className="font-mono text-purple-400">{settings.detailRestoration}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.detailRestoration}
                    onChange={(e) =>
                      setSettings({ ...settings, detailRestoration: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Noise Reduction */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Temporal & Sensor Denoise</span>
                    <span className="font-mono text-purple-400">{settings.noiseReduction}%</span>
                  </div>
                  <input
                    type="range"
                    disabled={preset === 'eco' || Boolean(hardware?.isLowEndDevice)}
                    min="0"
                    max="100"
                    value={settings.noiseReduction}
                    onChange={(e) =>
                      setSettings({ ...settings, noiseReduction: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Sharpening */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Frame Sharpening</span>
                    <span className="font-mono text-purple-400">{settings.sharpening}%</span>
                  </div>
                  <input
                    type="range"
                    disabled={preset === 'eco' || Boolean(hardware?.isLowEndDevice)}
                    min="0"
                    max="100"
                    value={settings.sharpening}
                    onChange={(e) =>
                      setSettings({ ...settings, sharpening: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Color Correction */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Color Dynamics & Vibrance</span>
                    <span className="font-mono text-purple-400">{settings.colorEnhancement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.colorEnhancement}
                    onChange={(e) =>
                      setSettings({ ...settings, colorEnhancement: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Audio preservation toggle */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/8 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">Preserve Audio Track</p>
                  <p className="text-[11px] text-zinc-400">
                    {preset === 'eco' || hardware?.isLowEndDevice ? 'Capture source audio without full-file decoding' : 'Synchronize audio with upscale'}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, preserveAudio: !settings.preserveAudio })
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    settings.preserveAudio ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settings.preserveAudio ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Start Button */}
              <div>
                <button
                  onClick={startVideoEnhancement}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {enhancedResult ? 'Re-Process Video' : `Enhance Video to ${estimatedDims ? `${estimatedDims.width}×${estimatedDims.height}` : settings.resolution.toUpperCase()}`}
                  </span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  Client-side processing • ECO workload limits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Real-Time Resource Monitor */}
      <FloatingResourceMonitor
        isProcessing={isProcessing}
        activePreset={preset}
        onPresetChange={(p) => setPreset(p)}
        watchdogMetrics={progress.watchdog}
        hardwareInfo={hardware}
      />

      {/* Processing overlay with Pause, Resume, and Watchdog */}
      {isProcessing && (
        <ProcessingOverlay
          progress={progress}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
          title={`Enhancing Video to ${estimatedDims ? `${estimatedDims.width}×${estimatedDims.height}` : settings.resolution.toUpperCase()}`}
        />
      )}

      {/* Startup Diagnostic Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl p-6 rounded-3xl bg-[#11111c] border border-purple-500/30 shadow-2xl flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Startup Diagnostic Report</h3>
              </div>
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs space-y-1 text-zinc-300">
              <p>Hardware concurrency: {hardware?.hardwareConcurrency || 4} threads</p>
              <p>Device memory: {hardware?.deviceMemoryGb || 4} GB</p>
              <p>Renderer: {hardware?.webglRenderer || 'WebGL 2'}</p>
              <p>Active preset: {preset.toUpperCase()} Mode</p>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <p className="text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                Execution Timeline:
              </p>
              <div className="space-y-1.5">
                {lastDiagnostics.map((evt, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-white font-medium">{evt.name}</span>
                      {evt.details && <span className="text-zinc-500 text-[10px]">({evt.details})</span>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {evt.durationMs !== undefined && (
                        <span className="text-purple-300 font-bold">{evt.durationMs}ms</span>
                      )}
                      {evt.heapUsedMb && (
                        <span className="text-zinc-400 text-[10px]">{evt.heapUsedMb}MB</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowDiagnosticModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
