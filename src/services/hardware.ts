import { HardwareInfo } from '../types';

let cachedHardwareInfo: HardwareInfo | null = null;

export async function detectHardwareCapabilities(): Promise<HardwareInfo> {
  if (cachedHardwareInfo) {
    return cachedHardwareInfo;
  }

  let hasWebGPU = false;
  let webgpuAdapterName: string | undefined;

  // Check WebGPU
  if (typeof navigator !== 'undefined' && 'gpu' in navigator && (navigator as any).gpu) {
    try {
      const adapter = await (navigator as any).gpu.requestAdapter();
      if (adapter) {
        hasWebGPU = true;
        // In some browsers info is available on adapter
        const info = (adapter as any).info;
        if (info) {
          webgpuAdapterName = `${info.vendor || ''} ${info.architecture || info.device || 'GPU'}`.trim();
        } else {
          webgpuAdapterName = 'WebGPU Hardware Accelerated Device';
        }
      }
    } catch {
      hasWebGPU = false;
    }
  }

  // Check WebGL 2
  let hasWebGL2 = false;
  let webglRenderer: string | undefined;
  let maxTextureSize = 4096;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      hasWebGL2 = !!canvas.getContext('webgl2');
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      } else {
        webglRenderer = gl.getParameter(gl.RENDERER) || 'WebGL Accelerated GPU';
      }
    }
  } catch {
    hasWebGL2 = false;
  }

  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const deviceMemoryGb = typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined;

  const isIntelIntegratedOld = !!webglRenderer && /intel.*(hd|uhd)\s*(graphics)?\s*(5500|5000|4000|3000|620|630|520|5300|610|615)/i.test(webglRenderer);
  const isSoftwareRenderer = !!webglRenderer && /llvmpipe|swiftshader|mesa.*software/i.test(webglRenderer);
  const isConstrainedMemory = deviceMemoryGb !== undefined && deviceMemoryGb <= 4;
  const isLowCoreCount = hardwareConcurrency <= 4;

  // Intel Core i3-5005U (4 threads, 4GB RAM, HD Graphics 5500) will be accurately identified as low-end
  // Four logical threads is already a constrained tier for sustained browser video rendering.
  // This deliberately errs on the safe side for older dual-core / four-thread laptops.
  const isLowEndDevice = isConstrainedMemory || hardwareConcurrency <= 4 || (isLowCoreCount && isIntelIntegratedOld) || isSoftwareRenderer;

  cachedHardwareInfo = {
    hasWebGPU,
    webgpuAdapterName,
    hasWebGL2,
    webglRenderer,
    maxTextureSize,
    hardwareConcurrency,
    deviceMemoryGb,
    isLowEndDevice,
  };

  return cachedHardwareInfo;
}

export function getRecommendedPreset(hardware: HardwareInfo): 'eco' | 'balanced' | 'quality' {
  // Always default Intel Core i3 / 4GB RAM / HD 5500 devices to ECO MODE
  if (hardware.isLowEndDevice || (hardware.deviceMemoryGb !== undefined && hardware.deviceMemoryGb <= 4) || hardware.hardwareConcurrency <= 4) {
    return 'eco';
  }
  if (hardware.hasWebGPU && hardware.hardwareConcurrency >= 8 && (hardware.deviceMemoryGb === undefined || hardware.deviceMemoryGb >= 8)) {
    return 'quality';
  }
  return 'balanced';
}

export function getRecommendedTileSize(hardware: HardwareInfo): 128 | 256 | 512 | 1024 {
  if (hardware.isLowEndDevice) return 256;
  if (hardware.hasWebGPU || (hardware.hasWebGL2 && hardware.maxTextureSize >= 8192)) return 512;
  return 256;
}
