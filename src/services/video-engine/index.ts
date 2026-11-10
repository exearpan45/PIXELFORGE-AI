import {
  ProcessingProgress,
  ResolutionTarget,
  VideoEnhancementSettings,
  ProcessingPreset,
  AdvancedCancellationToken,
} from '../../types';
import { calculateTargetDimensions } from '../image-engine';
import { WebGLSuperResolutionPipeline } from '../image-engine/webgl-pipeline';
import { DiagnosticTracker, ResourceProtectionWatchdog, yieldThread } from '../diagnostic';
import { detectHardwareCapabilities } from '../hardware';

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // seconds
  sizeBytes: number;
  estimatedFps: number;
  totalFrames: number;
  hasAudio: boolean;
  audioBuffer?: AudioBuffer | null;
  videoFile?: File;
}

export interface VideoEnhanceResult {
  blob: Blob;
  videoUrl: string;
  targetWidth: number;
  targetHeight: number;
  duration: number;
  sizeBytes: number;
  format: string;
  hasAudio: boolean;
}

export type ProcessingSpeedMode = 'fast' | 'balanced' | 'quality';

// Reuse one Web Audio source per video element so re-processing does not throw
// InvalidStateError from createMediaElementSource being called twice.
const audioGraphCache = new WeakMap<HTMLVideoElement, {
  context: AudioContext;
  source: MediaElementAudioSourceNode;
}>();

/**
 * Parses video metadata lightly WITHOUT reading the entire file ArrayBuffer
 * into memory, preventing memory bloat and startup browser lockup on 4GB RAM devices.
 */
export async function parseVideoMetadata(file: File): Promise<{ metadata: VideoMetadata; videoElement: HTMLVideoElement }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const duration = video.duration || 1;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const estimatedFps = 30;
      const totalFrames = Math.max(1, Math.round(duration * estimatedFps));

      // Detect an actual audio track where the browser exposes MediaStream capture.
      let hasAudio = Boolean((video as any).audioTracks?.length);
      try {
        const capture = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
        if (capture) {
          hasAudio = capture.getAudioTracks().length > 0;
          capture.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        }
      } catch {
        // Keep the browser's native audioTracks result; never guess from file size.
      }

      resolve({
        metadata: {
          width,
          height,
          duration,
          sizeBytes: file.size,
          estimatedFps,
          totalFrames,
          hasAudio,
          videoFile: file,
        },
        videoElement: video,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video file. Format or codec unsupported by browser.'));
    };
  });
}

/**
 * Decodes the audio track safely and only when requested by the user,
 * avoiding memory duplication.
 */
async function extractAudioBufferSafely(file: File): Promise<AudioBuffer | null> {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    const audioCtx = new AudioCtx();
    const fileBuffer = await file.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(fileBuffer).catch(() => null);
    audioCtx.close().catch(() => {});
    return audioBuffer;
  } catch (err) {
    console.warn('Safe audio extraction notice:', err);
    return null;
  }
}

export class VideoEnhancerService {
  private pipeline: WebGLSuperResolutionPipeline;
  private tracker: DiagnosticTracker;

  constructor() {
    this.pipeline = new WebGLSuperResolutionPipeline();
    this.tracker = new DiagnosticTracker();
  }

  public getTracker(): DiagnosticTracker {
    return this.tracker;
  }

  /**
   * Safe, stepwise video enhancement pipeline with:
   * 1. Sequential stage instrumentation & timing
   * 2. Low-end device auto-adaptation (ECO Mode)
   * 3. Adaptive CPU workload management with micro-sleep yielding
   * 4. Resource protection watchdog to prevent 98% CPU freezes
   * 5. Pause / Resume / Cancel interactive control
   */
  public async enhanceVideo(
    videoSource: HTMLVideoElement,
    originalMetadata: VideoMetadata,
    settings: VideoEnhancementSettings,
    targetResolution: ResolutionTarget,
    preset: ProcessingPreset = 'eco',
    onProgress?: (progress: ProcessingProgress) => void,
    cancellationToken?: AdvancedCancellationToken
  ): Promise<VideoEnhanceResult> {
    const tracker = this.tracker;
    tracker.reset();

    // 1. Stage: Start button clicked & Input Validation
    tracker.startStage('start_clicked', 'Start Request Received', 'Verifying video source and inputs');
    await yieldThread(10);
    if (!videoSource || !originalMetadata) {
      tracker.failStage('start_clicked', 'Invalid video source');
      throw new Error('Video source or metadata missing.');
    }
    tracker.completeStage('start_clicked', `${originalMetadata.width}×${originalMetadata.height}`);

    // 2. Stage: File & Bounds Validation
    tracker.startStage('file_validation', 'File Bounds Validation', `Validating duration: ${originalMetadata.duration.toFixed(1)}s`);
    await yieldThread(10);
    const duration = Math.min(originalMetadata.duration, 300); // Max 5 min
    tracker.completeStage('file_validation', `Validated duration: ${duration.toFixed(1)}s`);

    // 3. Stage: Resolution Target Calculation
    tracker.startStage('metadata_parsed', 'Target Resolution Compute', `Scaling target: ${targetResolution}`);
    const requestedDimensions = calculateTargetDimensions(
      originalMetadata.width,
      originalMetadata.height,
      targetResolution
    );

    // 4. Stage: Device Compatibility & Preset Check
    tracker.startStage('device_check', 'Hardware Compatibility Check', 'Inspecting GPU and core limits');
    const hardware = await detectHardwareCapabilities();
    const effectivePreset: ProcessingPreset = hardware.isLowEndDevice ? 'eco' : preset;
    // ECO uses a lightweight canvas path capped at 1280×720 and 8 fps.
    const ecoScale = Math.min(
      requestedDimensions.width / originalMetadata.width,
      requestedDimensions.height / originalMetadata.height,
      2,
      1280 / originalMetadata.width,
      720 / originalMetadata.height
    );
    const targetW = effectivePreset === 'eco'
      ? Math.max(1, Math.round(originalMetadata.width * ecoScale))
      : requestedDimensions.width;
    const targetH = effectivePreset === 'eco'
      ? Math.max(1, Math.round(originalMetadata.height * ecoScale))
      : requestedDimensions.height;
    const fps = effectivePreset === 'eco' ? Math.min(settings.targetFps || 30, 8) : (settings.targetFps || 30);
    const totalFrames = Math.max(1, Math.round(duration * fps));
    tracker.completeStage(
      'device_check',
      `Preset: ${effectivePreset.toUpperCase()} • ${hardware.webglRenderer || 'GPU'} • ${fps} fps • ${targetW}×${targetH}`
    );
    tracker.completeStage('metadata_parsed', `Output grid: ${targetW}×${targetH}`);

    // 5. Stage: WebGL Pipeline & Shader Verification
    tracker.startStage('gl_pipeline_init', 'Shader Pipeline Verification', 'Checking WebGL 2.0 Super-Resolution shaders');
    await yieldThread(10);
    if (!this.pipeline.isSupported()) {
      tracker.warnStage('gl_pipeline_init', 'WebGL 2.0 unavailable, using high-performance 2D Canvas fallback');
    } else {
      tracker.completeStage('gl_pipeline_init', 'Directional Tensor Shaders ready');
    }

    // 6. Capture the original audio track through Web Audio without decoding
    // the entire source file into a second in-memory AudioBuffer.
    let audioContext: AudioContext | null = null;
    let audioSourceNode: MediaElementAudioSourceNode | null = null;
    let audioDestNode: MediaStreamAudioDestinationNode | null = null;

    tracker.startStage('audio_stream_init', 'Audio Stream Capture', 'Capturing source audio without a full-file decode');
    if (settings.preserveAudio && originalMetadata.hasAudio) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          let graph = audioGraphCache.get(videoSource);
          if (!graph) {
            audioContext = new AudioCtx();
            videoSource.muted = false;
            audioSourceNode = audioContext.createMediaElementSource(videoSource);
            graph = { context: audioContext, source: audioSourceNode };
            audioGraphCache.set(videoSource, graph);
          } else {
            audioContext = graph.context;
            audioSourceNode = graph.source;
            videoSource.muted = false;
          }
          if (audioContext.state === 'suspended') await audioContext.resume();
          audioDestNode = audioContext.createMediaStreamDestination();
          audioSourceNode.connect(audioDestNode);
          tracker.completeStage('audio_stream_init', 'Original audio track routed to output stream');
        } else {
          tracker.warnStage('audio_stream_init', 'Web Audio is unavailable; output will be silent');
        }
      } catch (e: any) {
        tracker.warnStage('audio_stream_init', `Audio capture unavailable: ${e.message || 'unknown error'}`);
      }
    } else {
      tracker.completeStage(
        'audio_stream_init',
        settings.preserveAudio ? 'No source audio track detected' : 'Audio preservation disabled by user'
      );
    }

    // 7. Stage: Select lightweight 2D canvas for ECO, WebGL for stronger devices
    tracker.startStage('buffer_allocation', 'Direct Stream Allocation', `Allocating ${targetW}×${targetH} output canvas`);
    await yieldThread(10);
    const ecoCanvas = effectivePreset === 'eco' ? document.createElement('canvas') : null;
    const ecoContext = ecoCanvas
      ? ecoCanvas.getContext('2d', { alpha: false, desynchronized: true })
      : null;
    if (effectivePreset === 'eco' && (!ecoCanvas || !ecoContext)) {
      throw new Error('Low-resource 2D canvas is unavailable in this browser.');
    }
    const outputCanvas = ecoCanvas || this.pipeline.getCanvas();
    outputCanvas.width = targetW;
    outputCanvas.height = targetH;
    const canvasStream = outputCanvas.captureStream(fps);

    const renderOutputFrame = () => {
      if (ecoContext) {
        ecoContext.imageSmoothingEnabled = true;
        ecoContext.imageSmoothingQuality = 'medium';
        ecoContext.drawImage(videoSource, 0, 0, targetW, targetH);
      } else {
        this.pipeline.renderFrame(
          videoSource,
          originalMetadata.width,
          originalMetadata.height,
          targetW,
          targetH,
          settings
        );
      }
    };

    if (audioDestNode) {
      const audioTracks = audioDestNode.stream.getAudioTracks();
      if (audioTracks.length > 0) canvasStream.addTrack(audioTracks[0]);
    }
    tracker.completeStage('buffer_allocation', effectivePreset === 'eco' ? 'Lightweight 2D canvas stream connected' : 'WebGL canvas stream connected');

    // 8. Stage: Test Frame Extraction (Warming up video decoder)
    tracker.startStage('test_frame_extract', 'Test Frame Extraction', 'Seeking to 0.05s to prime decoder');
    videoSource.pause();
    videoSource.currentTime = 0;
    await new Promise<void>((resolve, reject) => {
      if (videoSource.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && videoSource.currentTime === 0) {
        resolve();
        return;
      }
      const onSeeked = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('Could not seek to the first video frame.')); };
      const cleanup = () => {
        videoSource.removeEventListener('seeked', onSeeked);
        videoSource.removeEventListener('error', onError);
      };
      videoSource.addEventListener('seeked', onSeeked, { once: true });
      videoSource.addEventListener('error', onError, { once: true });
      setTimeout(() => { cleanup(); resolve(); }, 1500);
    });
    tracker.completeStage('test_frame_extract', 'Video frame decoder primed');

    // 9. Stage: Test Frame AI / WebGL Processing Verification
    tracker.startStage('test_frame_process', 'Test Frame Inference Verification', 'Executing 1 test frame');
    const t0 = performance.now();
    renderOutputFrame();
    const testFrameDuration = Math.round(performance.now() - t0);
    tracker.completeStage('test_frame_process', `Rendered in ${testFrameDuration}ms`);

    // 10. Stage: Encoder Configuration
    tracker.startStage('encoder_init', 'MediaRecorder Configuration', 'Selecting container and bitrate');
    let mimeType = audioDestNode
      ? 'video/webm;codecs=vp8,opus'
      : (effectivePreset === 'eco' ? 'video/webm;codecs=vp8' : 'video/webm;codecs=vp9');
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = audioDestNode ? 'video/webm;codecs=vp8,opus' : 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = '';
      }
    }

    // Conservative bitrate by preset to prevent encoder CPU stalls on Core i3
    const targetBitrate =
      effectivePreset === 'eco'
        ? 1200000
        : targetW >= 2560 ? 14000000 : 8000000;

    const recordedChunks: Blob[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(canvasStream, { mimeType, videoBitsPerSecond: targetBitrate })
        : new MediaRecorder(canvasStream);
    } catch {
      recorder = new MediaRecorder(canvasStream);
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };
    tracker.completeStage('encoder_init', `${mimeType || 'default'} @ ${(targetBitrate / 1000000).toFixed(1)} Mbps`);

    // 11. Record in real time. The previous seek-per-frame loop added a
    // fixed wait to every frame, making exported videos play much slower.
    tracker.startStage('batch_processing', 'Real-Time Video Capture', 'Recording playback at the ECO frame cap');
    const watchdog = new ResourceProtectionWatchdog(effectivePreset);
    const startTime = Date.now();
    let processedFrames = 0;
    let lastDrawTime = -1;
    let lastProgressTime = 0;
    let rafId = 0;
    const stepSec = 1 / fps;

    const stopTracks = () => canvasStream.getTracks().forEach((track) => track.stop());
    const waitForPlayback = async () => {
      if (cancellationToken?.isCancelled) throw new Error('Video processing was cancelled.');
      if (cancellationToken?.isPaused) {
        videoSource.pause();
        await cancellationToken.checkPause();
        if (cancellationToken?.isCancelled) throw new Error('Video processing was cancelled.');
        await videoSource.play();
      }
    };

    try {
      videoSource.currentTime = 0;
      recorder.start(1000);
      await videoSource.play();

      await new Promise<void>((resolve, reject) => {
        const onEnded = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('Source video playback failed during processing.')); };
        const cleanup = () => {
          videoSource.removeEventListener('ended', onEnded);
          videoSource.removeEventListener('error', onError);
          if (rafId) cancelAnimationFrame(rafId);
        };
        videoSource.addEventListener('ended', onEnded, { once: true });
        videoSource.addEventListener('error', onError, { once: true });

        const tick = async (now: number) => {
          try {
            await waitForPlayback();
            if (videoSource.paused && !videoSource.ended) {
              rafId = requestAnimationFrame(tick);
              return;
            }
            const currentTime = videoSource.currentTime;
            if (lastDrawTime < 0 || currentTime - lastDrawTime >= stepSec) {
              const frameStart = performance.now();
              renderOutputFrame();
              const frameLatency = performance.now() - frameStart;
              processedFrames++;
              lastDrawTime = currentTime;
              const watchdogMetrics = watchdog.recordFrameRender(frameLatency);

              if (onProgress && (now - lastProgressTime >= 500 || videoSource.ended)) {
                lastProgressTime = now;
                const percent = Math.min(99, Math.round((currentTime / Math.max(duration, 0.1)) * 100));
                onProgress({
                  stage: 'processing_frames',
                  percent,
                  message: `Captured ${processedFrames} frames • ${fps} FPS target`,
                  currentFrame: processedFrames,
                  totalFrames,
                  elapsedTimeMs: Date.now() - startTime,
                  estimatedRemainingMs: Math.max(0, (duration - currentTime) * 1000),
                  fps,
                  isPaused: false,
                  activePreset: effectivePreset,
                  diagnostics: tracker.getEvents(),
                  watchdog: watchdogMetrics,
                });
              }
            }
            if (!videoSource.ended) rafId = requestAnimationFrame(tick);
          } catch (error) {
            cleanup();
            reject(error);
          }
        };
        rafId = requestAnimationFrame(tick);
      });

      // Ensure the final decoded frame is included.
      renderOutputFrame();
      tracker.completeStage('batch_processing', `Captured ${processedFrames} frames at a target of ${fps} FPS`);

      // 12. Finalizing & Encoding
      tracker.startStage('finalizing', 'Finalizing Video File', 'Packing video chunks');
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          percent: 99,
          message: audioDestNode ? 'Finalizing video with captured source audio...' : 'Finalizing video output...',
          diagnostics: tracker.getEvents(),
        });
      }

      const videoBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const finalBlob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
          resolve(finalBlob);
        };
        if (recorder.state !== 'inactive') recorder.stop();
        else resolve(new Blob(recordedChunks, { type: mimeType || 'video/webm' }));
      });

      const videoUrl = URL.createObjectURL(videoBlob);
      tracker.completeStage('finalizing', `File ready: ${(videoBlob.size / 1024 / 1024).toFixed(2)} MB`);

      if (onProgress) {
        onProgress({
          stage: 'completed',
          percent: 100,
          message: 'Video enhancement finished!',
          diagnostics: tracker.getEvents(),
        });
      }

      return {
        blob: videoBlob,
        videoUrl,
        targetWidth: targetW,
        targetHeight: targetH,
        duration,
        sizeBytes: videoBlob.size,
        format: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm',
        hasAudio: Boolean(audioDestNode && audioDestNode.stream.getAudioTracks().length > 0),
      };
    } finally {
      videoSource.pause();
      if (audioSourceNode && audioDestNode) {
        try { audioSourceNode.disconnect(audioDestNode); } catch {}
      }
      if (audioDestNode) audioDestNode.stream.getTracks().forEach((track) => track.stop());
      stopTracks();
    }
  }

  public dispose() {
    this.pipeline.dispose();
  }
}

export const videoEnhancerInstance = new VideoEnhancerService();
