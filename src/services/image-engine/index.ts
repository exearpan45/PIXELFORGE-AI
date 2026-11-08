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
      // 1920x1080 standard target
      if (aspect >= 16 / 9) {
        const width = 1920;
        const height = Math.round(width / aspect);
        return { width, height };
      } else {
        const height = 1080;
        const width = Math.round(height * aspect);
        return { width, height };
      }
    }

    case '1440p': {
      // 2560x1440 (2K QHD) target
      if (aspect >= 16 / 9) {
        const width = 2560;
        const height = Math.round(width / aspect);
        return { width, height };
      } else {
        const height = 1440;
        const width = Math.round(height * aspect);
        return { width, height };
      }
    }

    case '4k': {
      // 3840x2160 (4K UHD) target
      if (aspect >= 16 / 9) {
        const width = 3840;
        const height = Math.round(width / aspect);
        return { width, height };
      } else {
        const height = 2160;
        const width = Math.round(height * aspect);
        return { width, height };
      }
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
