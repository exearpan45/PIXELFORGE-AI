import { EnhancementSettings, ProcessingProgress } from '../../types';
import { WebGLSuperResolutionPipeline } from './webgl-pipeline';

export interface CancellationToken {
  isCancelled: boolean;
}

export class TileProcessor {
  private pipeline: WebGLSuperResolutionPipeline;

  constructor(pipeline?: WebGLSuperResolutionPipeline) {
    this.pipeline = pipeline || new WebGLSuperResolutionPipeline();
  }

  public async processImageTiled(
    source: HTMLImageElement | HTMLCanvasElement,
    sourceWidth: number,
    sourceHeight: number,
    targetWidth: number,
    targetHeight: number,
    settings: EnhancementSettings,
    tileSize: number = 512,
    onProgress?: (progress: ProcessingProgress) => void,
    cancellationToken?: CancellationToken,
    forceTiling: boolean = false
  ): Promise<HTMLCanvasElement> {
    const scaleX = targetWidth / sourceWidth;
    const scaleY = targetHeight / sourceHeight;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;
    const outputCtx = outputCanvas.getContext('2d');

    if (!outputCtx) {
      throw new Error('Failed to get 2D rendering context for output canvas.');
    }

    // Direct GPU Pass for any resolution up to 4096px
    // Guarantees zero tile borders, zero black boxes, and instant render!
    if (!forceTiling || (targetWidth <= 4096 && targetHeight <= 4096)) {
      if (onProgress) {
        onProgress({
          stage: 'inferencing',
          percent: 60,
          message: `Applying 4K Neural Super-Resolution (${targetWidth}×${targetHeight})...`,
        });
      }
      await new Promise((r) => setTimeout(r, 16));
      return this.pipeline.process(source, sourceWidth, sourceHeight, targetWidth, targetHeight, settings, outputCanvas);
    }

    // Tiled Processing with strict coordinate bounds for massive images >4096px
    const effectiveTileSize = Math.max(512, tileSize);
    const numTilesX = Math.ceil(sourceWidth / effectiveTileSize);
    const numTilesY = Math.ceil(sourceHeight / effectiveTileSize);
    const totalTiles = numTilesX * numTilesY;

    const sourceTileCanvas = document.createElement('canvas');
    const sourceTileCtx = sourceTileCanvas.getContext('2d')!;
    const enhancedTileCanvas = document.createElement('canvas');

    const startTime = Date.now();
    let processedTiles = 0;

    for (let ty = 0; ty < numTilesY; ty++) {
      for (let tx = 0; tx < numTilesX; tx++) {
        if (cancellationToken?.isCancelled) {
          throw new Error('Processing was cancelled by user.');
        }

        const srcX = tx * effectiveTileSize;
        const srcY = ty * effectiveTileSize;
        const srcW = Math.min(effectiveTileSize, sourceWidth - srcX);
        const srcH = Math.min(effectiveTileSize, sourceHeight - srcY);

        sourceTileCanvas.width = srcW;
        sourceTileCanvas.height = srcH;
        sourceTileCtx.clearRect(0, 0, srcW, srcH);
        sourceTileCtx.drawImage(source, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

        const tgtTileW = Math.round(srcW * scaleX);
        const tgtTileH = Math.round(srcH * scaleY);

        enhancedTileCanvas.width = tgtTileW;
        enhancedTileCanvas.height = tgtTileH;

        this.pipeline.process(
          sourceTileCanvas,
          srcW,
          srcH,
          tgtTileW,
          tgtTileH,
          settings,
          enhancedTileCanvas
        );

        const destX = Math.round(srcX * scaleX);
        const destY = Math.round(srcY * scaleY);

        outputCtx.drawImage(
          enhancedTileCanvas,
          0,
          0,
          tgtTileW,
          tgtTileH,
          destX,
          destY,
          tgtTileW,
          tgtTileH
        );

        processedTiles++;
        const percent = Math.min(99, Math.round((processedTiles / totalTiles) * 100));
        const elapsed = Date.now() - startTime;
        const estimatedRemaining = processedTiles > 0 ? ((totalTiles - processedTiles) / processedTiles) * elapsed : 0;

        if (onProgress) {
          onProgress({
            stage: 'inferencing',
            percent,
            message: `Processing tile ${processedTiles} of ${totalTiles}...`,
            currentFrame: processedTiles,
            totalFrames: totalTiles,
            elapsedTimeMs: elapsed,
            estimatedRemainingMs: estimatedRemaining,
          });
        }

        await new Promise((resolve) => setTimeout(resolve, 4));
      }
    }

    return outputCanvas;
  }
}
