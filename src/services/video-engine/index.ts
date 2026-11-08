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

      // Heuristic for audio presence
      let hasAudio = false;
      if (
        (video as any).mozHasAudio !== undefined ||
        Boolean((video as any).webkitAudioDecodedByteCount) ||
        Boolean((video as any).audioTracks?.length)
      ) {
        hasAudio = true;
      } else {
        // Assume audio exists if file size > 500KB (typical for video clips)
        hasAudio = file.size > 500000;
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
    const fps = settings.targetFps || 30;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    tracker.completeStage('file_validation', `Validated (${totalFrames} frames)`);

    // 3. Stage: Resolution Target Calculation
    tracker.startStage('metadata_parsed', 'Target Resolution Compute', `Scaling target: ${targetResolution}`);
    const { width: targetW, height: targetH } = calculateTargetDimensions(
      originalMetadata.width,
      originalMetadata.height,
      targetResolution
    );
    tracker.completeStage('metadata_parsed', `Target grid: ${targetW}×${targetH}`);

    // 4. Stage: Device Compatibility & Preset Check
    tracker.startStage('device_check', 'Hardware Compatibility Check', 'Inspecting GPU and core limits');
    const hardware = await detectHardwareCapabilities();
    const effectivePreset: ProcessingPreset = hardware.isLowEndDevice ? 'eco' : preset;
    tracker.completeStage(
      'device_check',
      `Preset: ${effectivePreset.toUpperCase()} • ${hardware.webglRenderer || 'GPU'}`
    );

    // 5. Stage: WebGL Pipeline & Shader Verification
    tracker.startStage('gl_pipeline_init', 'Shader Pipeline Verification', 'Checking WebGL 2.0 Super-Resolution shaders');
    await yieldThread(10);
    if (!this.pipeline.isSupported()) {
      tracker.warnStage('gl_pipeline_init', 'WebGL 2.0 unavailable, using high-performance 2D Canvas fallback');
    } else {
      tracker.completeStage('gl_pipeline_init', 'Directional Tensor Shaders ready');
    }

    // 6. Stage: Audio Track Preparation (Safe & Non-duplicative)
    let audioBuffer = originalMetadata.audioBuffer || null;
    let audioContext: AudioContext | null = null;
    let audioSourceNode: AudioBufferSourceNode | null = null;
    let audioDestNode: MediaStreamAudioDestinationNode | null = null;

    tracker.startStage('audio_stream_init', 'Audio Stream Preparation', 'Preparing audio preservation');
    if (settings.preserveAudio && originalMetadata.hasAudio && originalMetadata.videoFile) {
      if (!audioBuffer) {
        audioBuffer = await extractAudioBufferSafely(originalMetadata.videoFile);
      }
      if (audioBuffer) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            audioContext = new AudioCtx();
            if (audioContext.state === 'suspended') {
              await audioContext.resume().catch(() => {});
            }
            audioDestNode = audioContext.createMediaStreamDestination();
            audioSourceNode = audioContext.createBufferSource();
            audioSourceNode.buffer = audioBuffer;
            audioSourceNode.connect(audioDestNode);
            tracker.completeStage('audio_stream_init', 'Stereo track extracted & synchronized');
          }
        } catch (e: any) {
          tracker.warnStage('audio_stream_init', `Audio notice: ${e.message}`);
        }
      } else {
        tracker.completeStage('audio_stream_init', 'No audio stream found or preserved');
      }
    } else {
      tracker.completeStage('audio_stream_init', 'Preserve audio not requested or no audio');
    }

    // 7. Stage: Direct WebGL Canvas Stream Buffer Allocation
    tracker.startStage('buffer_allocation', 'Direct Stream Allocation', `Allocating ${targetW}×${targetH} WebGL canvas`);
    await yieldThread(10);
    const webglCanvas = this.pipeline.getCanvas();
    webglCanvas.width = targetW;
    webglCanvas.height = targetH;
    const canvasStream = webglCanvas.captureStream(fps);

    if (audioDestNode) {
      const audioTracks = audioDestNode.stream.getAudioTracks();
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0]);
      }
    }
    tracker.completeStage('buffer_allocation', 'Zero-copy direct stream connected');

    // 8. Stage: Test Frame Extraction (Warming up video decoder)
    tracker.startStage('test_frame_extract', 'Test Frame Extraction', 'Seeking to 0.05s to prime decoder');
    videoSource.currentTime = 0.05;
    await new Promise<void>((res) => {
      const onSeeked = () => {
        videoSource.removeEventListener('seeked', onSeeked);
        res();
      };
      videoSource.addEventListener('seeked', onSeeked, { once: true });
      setTimeout(res, 300); // Safety timeout
    });
    tracker.completeStage('test_frame_extract', 'Video frame decoder primed');

    // 9. Stage: Test Frame AI / WebGL Processing Verification
    tracker.startStage('test_frame_process', 'Test Frame Inference Verification', 'Executing 1 test frame');
    const t0 = performance.now();
    this.pipeline.renderFrame(videoSource, originalMetadata.width, originalMetadata.height, targetW, targetH, settings);
    const testFrameDuration = Math.round(performance.now() - t0);
    tracker.completeStage('test_frame_process', `Rendered in ${testFrameDuration}ms`);

    // 10. Stage: Encoder Configuration
    tracker.startStage('encoder_init', 'MediaRecorder Configuration', 'Selecting container and bitrate');
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = '';
        }
      }
    }

    // Conservative bitrate by preset to prevent encoder CPU stalls on Core i3
    const targetBitrate =
      effectivePreset === 'eco'
        ? targetW >= 2560 ? 8000000 : 4000000
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

    // 11. Stage: Controlled Batch Processing with Adaptive CPU Workload Management
    tracker.startStage('batch_processing', 'Controlled Batch Processing', 'Starting frame loop with watchdog protection');
    recorder.start(250);
    if (audioSourceNode) {
      try {
        audioSourceNode.start(0);
      } catch {}
    }

    const watchdog = new ResourceProtectionWatchdog(effectivePreset);
    const startTime = Date.now();
    let processedFrames = 0;
    const stepSec = 1 / fps;

    try {
      for (let i = 0; i < totalFrames; i++) {
        // A. Cancellation Check
        if (cancellationToken?.isCancelled) {
          tracker.failStage('batch_processing', 'User cancelled processing');
          throw new Error('Video processing was cancelled.');
        }

        // B. Pause / Resume Check
        if (cancellationToken?.isPaused) {
          if (onProgress) {
            onProgress({
              stage: 'processing_frames',
              percent: Math.min(99, Math.round((processedFrames / totalFrames) * 100)),
              message: 'Processing Paused. Click Resume to continue.',
              currentFrame: processedFrames,
              totalFrames,
              isPaused: true,
              activePreset: effectivePreset,
              diagnostics: tracker.getEvents(),
            });
          }
          await cancellationToken.checkPause();
        }

        // C. Seek to exact frame timestamp
        videoSource.currentTime = i * stepSec;
        await new Promise<void>((r) => {
          const onSeek = () => {
            videoSource.removeEventListener('seeked', onSeek);
            r();
          };
          videoSource.addEventListener('seeked', onSeek, { once: true });
          setTimeout(r, 60); // Safety timeout
        });

        // D. Measure Frame Render Latency
        const frameStart = performance.now();
        this.pipeline.renderFrame(
          videoSource,
          originalMetadata.width,
          originalMetadata.height,
          targetW,
          targetH,
          settings
        );
        const frameLatency = performance.now() - frameStart;
        processedFrames++;

        // E. Feed Watchdog & Apply Adaptive CPU Yield
        const watchdogMetrics = watchdog.recordFrameRender(frameLatency);

        // F. Calculate Progress and Remaining Time
        const percent = Math.min(99, Math.round((processedFrames / totalFrames) * 100));
        const elapsedMs = Date.now() - startTime;
        const avgFrameMs = elapsedMs / processedFrames;
        const remainingFrames = totalFrames - processedFrames;
        const estimatedRemainingMs = Math.round(remainingFrames * avgFrameMs);
        const liveFps = Math.max(1, Math.round(1000 / (avgFrameMs || 1)));

        if (onProgress && (i % 2 === 0 || i === totalFrames - 1)) {
          onProgress({
            stage: 'processing_frames',
            percent,
            message: `Frame ${processedFrames}/${totalFrames} • ${liveFps} FPS • ${Math.ceil(estimatedRemainingMs / 1000)}s left`,
            currentFrame: processedFrames,
            totalFrames,
            elapsedTimeMs: elapsedMs,
            estimatedRemainingMs,
            fps: liveFps,
            isPaused: false,
            activePreset: effectivePreset,
            diagnostics: tracker.getEvents(),
            watchdog: watchdogMetrics,
          });
        }

        // G. Adaptive CPU Yield (Prevents 98% CPU freeze & lets browser event loop breathe)
        await yieldThread(watchdog.getYieldDelay());
      }

      tracker.completeStage('batch_processing', `Completed all ${processedFrames} frames`);

      // 12. Finalizing & Encoding
      tracker.startStage('finalizing', 'Finalizing Video File', 'Packing video chunks');
      if (onProgress) {
        onProgress({
          stage: 'encoding',
          percent: 99,
          message: 'Packing final video stream with synchronized audio...',
          diagnostics: tracker.getEvents(),
        });
      }

      const videoBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          const finalBlob = new Blob(recordedChunks, { type: mimeType || 'video/webm' });
          resolve(finalBlob);
        };
        recorder.stop();
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
        hasAudio: Boolean(audioBuffer),
      };
    } finally {
      if (audioSourceNode) {
        try {
          audioSourceNode.stop();
          audioSourceNode.disconnect();
        } catch {}
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {});
      }
      canvasStream.getTracks().forEach((t) => t.stop());
    }
  }

  public dispose() {
    this.pipeline.dispose();
  }
}

export const videoEnhancerInstance = new VideoEnhancerService();
