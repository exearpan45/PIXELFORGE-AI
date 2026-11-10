import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, Columns, Maximize2, SkipBack, SkipForward, CheckCircle, Download } from 'lucide-react';
import { VideoEnhanceResult, VideoMetadata } from '../services/video-engine';

interface VideoComparisonPlayerProps {
  originalUrl: string;
  enhancedResult: VideoEnhanceResult;
  originalMetadata: VideoMetadata;
  onDownload: () => void;
}

export const VideoComparisonPlayer: React.FC<VideoComparisonPlayerProps> = ({
  originalUrl,
  enhancedResult,
  originalMetadata,
  onDownload,
}) => {
  const origVideoRef = useRef<HTMLVideoElement>(null);
  const enhVideoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(originalMetadata.duration || 1);
  // Default to one decoded video on screen. Side-by-side doubles decoder work
  // and can stutter on older integrated-GPU laptops.
  const [viewMode, setViewMode] = useState<'side-by-side' | 'enhanced-only'>('enhanced-only');

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Synchronized Play/Pause
  const togglePlay = () => {
    const orig = origVideoRef.current;
    const enh = enhVideoRef.current;
    if (!enh) return;

    if (isPlaying) {
      orig?.pause();
      enh.pause();
      setIsPlaying(false);
    } else {
      // Keep the original aligned only when the comparison view is mounted.
      if (orig) {
        orig.currentTime = enh.currentTime;
        orig.play().catch(() => {});
      }
      enh.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Synchronized Seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (origVideoRef.current) origVideoRef.current.currentTime = target;
    if (enhVideoRef.current) enhVideoRef.current.currentTime = target;
  };

  // Step Frame (+/- 1 frame)
  const stepFrame = (deltaFrames: number) => {
    const fps = originalMetadata.estimatedFps || 30;
    const nextTime = Math.max(0, Math.min(duration, currentTime + deltaFrames / fps));
    setCurrentTime(nextTime);
    if (origVideoRef.current) origVideoRef.current.currentTime = nextTime;
    if (enhVideoRef.current) enhVideoRef.current.currentTime = nextTime;
  };

  const toggleMute = () => {
    if (enhVideoRef.current) {
      enhVideoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  // Update progress bar from enhanced video
  const handleTimeUpdate = () => {
    if (enhVideoRef.current) {
      setCurrentTime(enhVideoRef.current.currentTime);
      if (enhVideoRef.current.duration) {
        setDuration(enhVideoRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (origVideoRef.current) origVideoRef.current.currentTime = 0;
    if (enhVideoRef.current) enhVideoRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Video Viewport Area */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-purple-500/30 shadow-2xl">
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 bg-black">
            {/* Left: Original Video */}
            <div className="relative aspect-16/9 bg-black/60 flex items-center justify-center overflow-hidden">
              <video
                ref={origVideoRef}
                src={originalUrl}
                muted={true} // Keep original muted so enhanced video plays audio
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300">
                Original ({originalMetadata.width}×{originalMetadata.height})
              </div>
            </div>

            {/* Right: Enhanced 4K Video */}
            <div className="relative aspect-16/9 bg-black/60 flex items-center justify-center overflow-hidden">
              <video
                ref={enhVideoRef}
                src={enhancedResult.videoUrl}
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-purple-950/90 backdrop-blur-md border border-purple-500/40 text-[11px] font-bold text-purple-200">
                PIXELFORGE OUTPUT ({enhancedResult.targetWidth}×{enhancedResult.targetHeight})
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Only View */
          <div className="relative aspect-16/9 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={enhVideoRef}
              src={enhancedResult.videoUrl}
              muted={isMuted}
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-purple-950/90 backdrop-blur-md border border-purple-500/40 text-[11px] font-bold text-purple-200">
              PIXELFORGE OUTPUT ({enhancedResult.targetWidth}×{enhancedResult.targetHeight})
            </div>
          </div>
        )}

        {/* Floating Play/Pause Center Indicator when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all transform hover:scale-110 active:scale-95 cursor-pointer z-10"
          >
            <Play className="w-6 h-6 ml-1" />
          </button>
        )}
      </div>

      {/* Synchronized Player Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-[#10101b] border border-white/10 flex flex-col gap-2.5 text-xs text-zinc-300 shadow-xl">
        {/* Timeline Range Slider */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] min-w-10 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-mono text-[11px] min-w-10 text-zinc-500">{formatTime(duration)}</span>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-md shadow-purple-600/30"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="p-2 rounded-xl bg-black/40 hover:bg-white/10 text-zinc-300 transition-colors"
              title="Step Backward 1 Frame"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="p-2 rounded-xl bg-black/40 hover:bg-white/10 text-zinc-300 transition-colors"
              title="Step Forward 1 Frame"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-black/40 hover:bg-white/10 text-zinc-300 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'side-by-side' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('enhanced-only')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'enhanced-only' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Output Only</span>
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={onDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-[#10101b] border border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Original Resolution</span>
          <p className="font-mono text-zinc-200 font-bold">{originalMetadata.width} × {originalMetadata.height} px</p>
          <span className="text-[10px] text-zinc-500">{formatBytes(originalMetadata.sizeBytes)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
          <span className="text-[10px] text-purple-300 uppercase tracking-wider font-semibold">Enhanced Output</span>
          <p className="font-mono text-purple-200 font-bold">{enhancedResult.targetWidth} × {enhancedResult.targetHeight} px</p>
          <span className="text-[10px] text-purple-400 font-mono">{formatBytes(enhancedResult.sizeBytes)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#10101b] border border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Audio Track Status</span>
          <p className={`font-mono font-bold flex items-center gap-1 ${enhancedResult.hasAudio ? 'text-emerald-400' : 'text-amber-400'}`}>
            <CheckCircle className="w-3.5 h-3.5" />
            {enhancedResult.hasAudio ? 'Preserved (In Sync)' : 'No Audio in Output'}
          </p>
          <span className="text-[10px] text-zinc-500">Duration: {originalMetadata.duration.toFixed(1)}s</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#10101b] border border-white/8 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Encoding & Container</span>
          <p className="font-mono text-zinc-200 font-bold">{enhancedResult.format.toUpperCase()}</p>
          <span className="text-[10px] text-emerald-400 font-medium">WebM video export</span>
        </div>
      </div>
    </div>
  );
};
