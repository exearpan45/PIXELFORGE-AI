import { EnhancementSettings, ProcessingProgress, ResolutionTarget } from '../../types';
import { TileProcessor, CancellationToken } from './tile-processor';
import { WebGLSuperResolutionPipeline } from './webgl-pipeline';

export interface ImageEnhanceResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  blob: Blob;
  targetWidth: number;
  targetHeight: number;
  sizeBytes: number;
  format: string;
}

export function calculateTargetDimensions(
  origW: number,
  origH: number,
  target: ResolutionTarget
): { width: number; height: number } {
  const aspect = origW / origH;

  switch (target) {
    case 'original':
      return { width: origW, height: origH };

    case '2x':
      return { width: Math.round(origW * 2), height: Math.round(origH * 2) };

    case '4x':
      return { width: Math.round(origW * 4), height: Math.round(origH * 4) };

    case '1080p': {
      // Preserve aspect ratio and make the longer edge 1920px (portrait or landscape).
      const longEdge = 1920;
      return aspect >= 1
        ? { width: longEdge, height: Math.max(1, Math.round(longEdge / aspect)) }
        : { width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge };
    }

    case '1440p': {
      // Preserve aspect ratio and make the longer edge 2560px.
      const longEdge = 2560;
      return aspect >= 1
        ? { width: longEdge, height: Math.max(1, Math.round(longEdge / aspect)) }
        : { width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge };
    }

    case '4k': {
      // 4K UHD means a 3840px long edge. Portrait 9:16 becomes 2160×3840.
      const longEdge = 3840;
      return aspect >= 1
        ? { width: longEdge, height: Math.max(1, Math.round(longEdge / aspect)) }
        : { width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge };
    }

    default:
      return { width: origW, height: origH };
  }
}

export class ImageEnhancerService {
  private pipeline: WebGLSuperResolutionPipeline;
  private tileProcessor: TileProcessor;

  constructor() {
    this.pipeline = new WebGLSuperResolutionPipeline();
    this.tileProcessor = new TileProcessor(this.pipeline);
  }

  public async enhanceImage(
    imageSource: HTMLImageElement | HTMLCanvasElement,
    settings: EnhancementSettings,
    tileSize: number = 512,
    onProgress?: (progress: ProcessingProgress) => void,
    cancellationToken?: CancellationToken,
    lowMemoryMode: boolean = false
  ): Promise<ImageEnhanceResult> {
    const origW = 'naturalWidth' in imageSource ? imageSource.naturalWidth : imageSource.width;
    const origH = 'naturalHeight' in imageSource ? imageSource.naturalHeight : imageSource.height;

    if (!origW || !origH) {
      throw new Error('Invalid image dimensions.');
    }

    const { width: targetW, height: targetH } = calculateTargetDimensions(
      origW,
      origH,
      settings.resolution
    );

    if (onProgress) {
      onProgress({
        stage: 'initializing',
        percent: 10,
        message: `Initializing 4K Super-Resolution (${targetW}×${targetH})...`,
      });
    }

    const resultCanvas = await this.tileProcessor.processImageTiled(
      imageSource,
      origW,
      origH,
      targetW,
      targetH,
      settings,
      tileSize,
      onProgress,
      cancellationToken,
      lowMemoryMode
    );

    if (onProgress) {
      onProgress({
        stage: 'finalizing',
        percent: 96,
        message: 'Generating high-resolution lossless image output...',
      });
    }

    // Convert to Blob and Data URL
    const blob = await new Promise<Blob>((resolve, reject) => {
      resultCanvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create image blob.'));
        },
        'image/png',
        1.0
      );
    });

    const dataUrl = resultCanvas.toDataURL('image/png', 1.0);

    return {
      canvas: resultCanvas,
      dataUrl,
      blob,
      targetWidth: targetW,
      targetHeight: targetH,
      sizeBytes: blob.size,
      format: 'image/png',
    };
  }

  public dispose() {
    this.pipeline.dispose();
  }
}

export const imageEnhancerInstance = new ImageEnhancerService();
