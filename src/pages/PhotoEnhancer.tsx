import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Download,
  RotateCcw,
  Sliders,
  Maximize2,
  FileImage,
  Layers,
  CheckCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import {
  EnhancementSettings,
  ProcessingProgress,
  ResolutionTarget,
  AppPreferences,
  ProjectRecord,
} from '../types';
import { ImageDropzone } from '../components/ImageDropzone';
import { ComparisonSlider } from '../components/ComparisonSlider';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import {
  ImageEnhanceResult,
  calculateTargetDimensions,
  imageEnhancerInstance,
} from '../services/image-engine';
import { CancellationToken } from '../services/image-engine/tile-processor';
import { saveProject } from '../services/storage';

interface PhotoEnhancerProps {
  preferences: AppPreferences;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const PhotoEnhancer: React.FC<PhotoEnhancerProps> = ({ preferences, onNotify }) => {
  // Source Image State
  const [sourceImage, setSourceImage] = useState<{
    file: File | string;
    url: string;
    name: string;
    width: number;
    height: number;
    sizeBytes: number;
  } | null>(null);

  // Settings State
  const [settings, setSettings] = useState<EnhancementSettings>({
    resolution: preferences.defaultResolution || '4k',
    detailRestoration: 75,
    noiseReduction: 40,
    sharpening: 55,
    faceEnhancement: 60,
    colorEnhancement: 30,
    textureEnhancement: 50,
  });

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ProcessingProgress>({
    stage: 'idle',
    percent: 0,
    message: '',
  });
  const cancellationTokenRef = useRef<CancellationToken | null>(null);

  // Enhanced Result State
  const [result, setResult] = useState<ImageEnhanceResult | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleImageLoaded = (
    file: File | string,
    url: string,
    width: number,
    height: number,
    sizeBytes: number,
    name: string
  ) => {
    setSourceImage({
      file,
      url,
      name,
      width,
      height,
      sizeBytes,
    });
    setResult(null);
  };

  const startEnhancement = async () => {
    if (!sourceImage) return;

    setIsProcessing(true);
    const cancelToken: CancellationToken = { isCancelled: false };
    cancellationTokenRef.current = cancelToken;

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load source image for rendering.'));
        img.src = sourceImage.url;
      });

      const enhanceResult = await imageEnhancerInstance.enhanceImage(
        img,
        settings,
        preferences.tileSize,
        (p) => setProgress(p),
        cancelToken,
        preferences.lowMemoryMode
      );

      setResult(enhanceResult);
      onNotify('success', '4K Image Export Completed!', `Upscaled to ${enhanceResult.targetWidth}×${enhanceResult.targetHeight}`);

      // Save to project history
      if (preferences.autoSaveHistory) {
        const projectRecord: ProjectRecord = {
          id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'image',
          originalFileName: sourceImage.name,
          originalWidth: sourceImage.width,
          originalHeight: sourceImage.height,
          originalSizeBytes: sourceImage.sizeBytes,
          targetWidth: enhanceResult.targetWidth,
          targetHeight: enhanceResult.targetHeight,
          outputSizeBytes: enhanceResult.sizeBytes,
          settings: { ...settings },
          createdAt: Date.now(),
          thumbnailUrl: enhanceResult.dataUrl,
          mimeType: enhanceResult.format,
        };
        await saveProject(projectRecord);
      }
    } catch (err: any) {
      if (err.message?.includes('cancelled')) {
        onNotify('info', 'Enhancement Cancelled', 'Processing stopped by user.');
      } else {
        console.error(err);
        onNotify('error', 'Enhancement Failed', err.message || 'An error occurred during inference.');
      }
    } finally {
      setIsProcessing(false);
      cancellationTokenRef.current = null;
    }
  };

  const handleCancel = () => {
    if (cancellationTokenRef.current) {
      cancellationTokenRef.current.isCancelled = true;
    }
  };

  const downloadResult = (format: 'png' | 'jpeg' | 'webp' = 'png') => {
    if (!result) return;
    const link = document.createElement('a');
    const baseName = sourceImage?.name.replace(/\.[^/.]+$/, '') || 'pixelforge_upscaled';
    link.download = `${baseName}_PIXELFORGE_${settings.resolution}_${result.targetWidth}x${result.targetHeight}.${format}`;

    if (format === 'png') {
      link.href = result.dataUrl;
      link.click();
    } else {
      const mime = format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      result.canvas.toBlob(
        (b) => {
          if (!b) return;
          const u = URL.createObjectURL(b);
          link.href = u;
          link.click();
          setTimeout(() => URL.revokeObjectURL(u), 1000);
        },
        mime,
        0.95
      );
    }
    onNotify('success', 'Download Started', `Saved as high-res ${format.toUpperCase()}`);
  };

  const resetAll = () => {
    setSourceImage(null);
    setResult(null);
  };

  const estimatedDims = sourceImage
    ? calculateTargetDimensions(sourceImage.width, sourceImage.height, settings.resolution)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              Studio Workspace
            </span>
            <span className="text-zinc-500 text-xs">• Zero Cloud Upload</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Photo Upscaler to 4K
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Upscale images to exact target pixel dimensions with client-side WebGL filters and edge sharpening.
          </p>
        </div>

        {sourceImage && (
          <button
            onClick={resetAll}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Upload New Photo</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {!sourceImage ? (
        <ImageDropzone
          onImageSelected={handleImageLoaded}
          onError={(msg) => onNotify('error', 'Upload Error', msg)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Center: Interactive Preview Canvas */}
          <div className="lg:col-span-8 space-y-4">
            {result ? (
              <div className="space-y-4">
                <ComparisonSlider
                  originalSrc={sourceImage.url}
                  enhancedSrc={result.dataUrl}
                  originalLabel="Original"
                  enhancedLabel="PIXELFORGE Enhanced"
                  originalDims={{ width: sourceImage.width, height: sourceImage.height }}
                  enhancedDims={{ width: result.targetWidth, height: result.targetHeight }}
                />

                {/* Download Bar */}
                <div className="p-4 rounded-2xl bg-[#10101b] border border-purple-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">4K Enhanced Output Ready</h4>
                      <p className="text-xs text-zinc-400 font-mono">
                        {result.targetWidth} × {result.targetHeight} px • {formatBytes(result.sizeBytes)} • Lossless
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => downloadResult('png')}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG (Lossless)</span>
                    </button>
                    <button
                      onClick={() => downloadResult('webp')}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                      title="Download WEBP (Smaller size)"
                    >
                      WEBP
                    </button>
                    <button
                      onClick={() => downloadResult('jpeg')}
                      className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-colors"
                      title="Download JPG"
                    >
                      JPG
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Original Image loaded, waiting for enhancement */
              <div className="relative aspect-16/10 max-h-[580px] w-full rounded-2xl overflow-hidden bg-[#0a0a10] border border-white/10 flex items-center justify-center p-4 shadow-xl">
                <img
                  src={sourceImage.url}
                  alt={sourceImage.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />

                {/* Metadata Pill */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-200">
                  Original: {sourceImage.width} × {sourceImage.height} px • {formatBytes(sourceImage.sizeBytes)}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-purple-500/40 text-xs text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Select your upscale settings on the right and click "Enhance to 4K"
                </div>
              </div>
            )}
          </div>

          {/* Right Column: AI Enhancement Controls & Tuning Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#10101b] border border-white/10 shadow-2xl space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">Enhancement Controls</h3>
                </div>
                <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  WebGL Filter Pipeline
                </span>
              </div>

              {/* Resolution Target Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-semibold text-zinc-200">Target Resolution</label>
                  {estimatedDims && (
                    <span className="text-purple-400 font-mono text-[11px]">
                      → {estimatedDims.width} × {estimatedDims.height}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['2x', '4x', '1080p', '1440p', '4k', 'original'] as ResolutionTarget[]).map((res) => (
                    <button
                      key={res}
                      onClick={() => setSettings({ ...settings, resolution: res })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase transition-all ${
                        settings.resolution === res
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400'
                          : 'bg-black/40 hover:bg-white/5 text-zinc-300 border border-white/8'
                      }`}
                    >
                      {res === '4k' ? '4K UHD' : res === '1440p' ? '2K QHD' : res}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for Neural Parameters */}
              <div className="space-y-4 pt-1">
                {/* 1. Detail Restoration */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Detail & Edge Enhancement</span>
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
                  <p className="text-[10px] text-zinc-500">Synthesizes high-frequency lost edge detail</p>
                </div>

                {/* 2. Noise Reduction */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Bilateral Noise Reduction</span>
                    <span className="font-mono text-purple-400">{settings.noiseReduction}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.noiseReduction}
                    onChange={(e) =>
                      setSettings({ ...settings, noiseReduction: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500">Cleans compression artifacts and sensor grain</p>
                </div>

                {/* 3. Sharpening */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Unsharp Mask & Clarity</span>
                    <span className="font-mono text-purple-400">{settings.sharpening}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.sharpening}
                    onChange={(e) =>
                      setSettings({ ...settings, sharpening: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500">Anti-ringing micro-contrast enhancement</p>
                </div>

                {/* 4. Face Enhancement */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Face & Portrait Enhancer</span>
                    <span className="font-mono text-purple-400">{settings.faceEnhancement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.faceEnhancement}
                    onChange={(e) =>
                      setSettings({ ...settings, faceEnhancement: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500">Refines skin tones, irises, and portrait contours</p>
                </div>

                {/* 5. Texture Enhancement */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Texture & Fiber Restoration</span>
                    <span className="font-mono text-purple-400">{settings.textureEnhancement}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.textureEnhancement}
                    onChange={(e) =>
                      setSettings({ ...settings, textureEnhancement: Number(e.target.value) })
                    }
                    className="w-full h-1.5 bg-black/60 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500">Reconstructs fabric, hair, foliage, and textures</p>
                </div>

                {/* 6. Color Enhancement */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-zinc-300">Dynamic Color & Vibrance</span>
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
                  <p className="text-[10px] text-zinc-500">Adaptive saturation without blown highlights</p>
                </div>
              </div>

              {/* Start Processing Button */}
              <div className="pt-2">
                <button
                  onClick={startEnhancement}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {result ? 'Re-Enhance With Settings' : `Enhance to ${settings.resolution.toUpperCase()}`}
                  </span>
                </button>
                <p className="text-[11px] text-zinc-500 text-center mt-2">
                  True 4K neural super-resolution • Lossless precision
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time processing progress modal */}
      {isProcessing && (
        <ProcessingOverlay
          progress={progress}
          onCancel={handleCancel}
          title="Enhancing Photo to 4K"
        />
      )}
    </div>
  );
};
