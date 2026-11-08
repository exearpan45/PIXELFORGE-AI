import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Eye, SlidersHorizontal, Columns, RotateCcw } from 'lucide-react';

interface ComparisonSliderProps {
  originalSrc: string;
  enhancedSrc: string;
  originalLabel?: string;
  enhancedLabel?: string;
  originalDims?: { width: number; height: number };
  enhancedDims?: { width: number; height: number };
  aspectRatio?: number;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalSrc,
  enhancedSrc,
  originalLabel = 'Original',
  enhancedLabel = 'Enhanced AI (4K)',
  originalDims,
  enhancedDims,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = fit, 2 = 200%, 3 = 300%, 4 = 400%
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side' | 'toggle'>('slider');
  const [showOriginalInToggle, setShowOriginalInToggle] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Handle slider movement
  const updateSliderPos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pos);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // If zoomed and middle click or space/drag, pan
    if (zoomLevel > 1 && (e.button === 1 || e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (viewMode === 'slider') {
      setIsDragging(true);
      updateSliderPos(e.clientX);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isDragging) {
      updateSliderPos(e.clientX);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setIsPanning(false);
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setIsPanning(false);
    };

    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(1))));
      if (next === 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSliderPosition(50);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Controls toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#12121e]/90 border border-white/10 backdrop-blur-md text-xs text-zinc-300">
        {/* View Mode switches */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'slider'
                ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30'
                : 'hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30'
                : 'hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>
          <button
            onClick={() => setViewMode('toggle')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
              viewMode === 'toggle'
                ? 'bg-purple-600 text-white font-medium shadow-md shadow-purple-600/30'
                : 'hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hold to Compare</span>
          </button>
        </div>

        {/* Zoom & Navigation buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => handleZoom(-0.5)}
              disabled={zoomLevel <= 1}
              className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-40 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] min-w-10 text-center font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.5)}
              disabled={zoomLevel >= 4}
              className="p-1.5 hover:bg-white/10 rounded-md disabled:opacity-40 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={resetView}
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Reset Zoom & Position"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main interactive canvas area */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className={`relative w-full aspect-16/10 max-h-[640px] rounded-2xl overflow-hidden bg-[#07070b] border border-white/10 select-none shadow-2xl ${
          zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-ew-resize'
        }`}
      >
        {/* Side-by-side mode */}
        {viewMode === 'side-by-side' ? (
          <div className="grid grid-cols-2 w-full h-full divide-x divide-white/10 bg-black/60">
            <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-2">
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={originalSrc}
                  alt="Original"
                  className="max-w-full max-h-full object-contain pointer-events-none rounded"
                />
              </div>
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300">
                {originalLabel} {originalDims && `(${originalDims.width}×${originalDims.height})`}
              </div>
            </div>

            <div className="relative w-full h-full overflow-hidden flex items-center justify-center p-2">
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center"
              >
                <img
                  src={enhancedSrc}
                  alt="Enhanced"
                  className="max-w-full max-h-full object-contain pointer-events-none rounded shadow-lg"
                />
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-[11px] font-semibold text-purple-200">
                {enhancedLabel} {enhancedDims && `(${enhancedDims.width}×${enhancedDims.height})`}
              </div>
            </div>
          </div>
        ) : viewMode === 'toggle' ? (
          /* Hold to toggle mode */
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={showOriginalInToggle ? originalSrc : enhancedSrc}
                alt="Toggle Preview"
                className="max-w-full max-h-full object-contain pointer-events-none rounded"
              />
            </div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onMouseDown={() => setShowOriginalInToggle(true)}
                onMouseUp={() => setShowOriginalInToggle(false)}
                onTouchStart={() => setShowOriginalInToggle(true)}
                onTouchEnd={() => setShowOriginalInToggle(false)}
                className="px-5 py-2.5 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 backdrop-blur-md border border-purple-400/40 cursor-pointer active:scale-95 transition-all select-none"
              >
                {showOriginalInToggle ? 'Showing Original' : 'Hold to View Original'}
              </button>
            </div>
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300">
              {showOriginalInToggle ? originalLabel : enhancedLabel}
            </div>
          </div>
        ) : (
          /* Split slider mode (default) */
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {/* Zoom / Pan wrapper */}
            <div
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Enhanced image (background full) */}
              <img
                src={enhancedSrc}
                alt="Enhanced"
                className="max-w-full max-h-full object-contain pointer-events-none select-none"
              />

              {/* Original image (clipped by slider) */}
              <div
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                className="absolute inset-0 w-full h-full flex items-center justify-center"
              >
                <img
                  src={originalSrc}
                  alt="Original"
                  className="max-w-full max-h-full object-contain pointer-events-none select-none"
                />
              </div>

              {/* Vertical divider line */}
              <div
                style={{ left: `${sliderPosition}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-white to-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] pointer-events-none z-10"
              >
                {/* Glowing circular handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#12121e] border-2 border-purple-400 flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.7)]">
                  <div className="flex items-center gap-0.5 text-purple-300">
                    <span className="text-[10px] font-bold">◀</span>
                    <span className="text-[10px] font-bold">▶</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300 pointer-events-none z-20">
              {originalLabel} {originalDims && `(${originalDims.width}×${originalDims.height})`}
            </div>

            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-purple-950/85 backdrop-blur-md border border-purple-500/40 text-[11px] font-semibold text-purple-200 pointer-events-none z-20 shadow-lg">
              {enhancedLabel} {enhancedDims && `(${enhancedDims.width}×${enhancedDims.height})`}
            </div>
          </div>
        )}
      </div>

      {zoomLevel > 1 && (
        <div className="text-[11px] text-zinc-500 text-center">
          💡 Zoomed in {Math.round(zoomLevel * 100)}% • Hold Shift + Drag (or Middle Click) to pan across the canvas
        </div>
      )}
    </div>
  );
};
