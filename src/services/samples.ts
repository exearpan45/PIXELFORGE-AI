export interface SampleImage {
  id: string;
  title: string;
  category: string;
  description: string;
  originalRes: string;
  targetRecommend: string;
  url: string;
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'cyberpunk-city',
    title: 'Neon Cyberpunk Metropolis',
    category: 'Architecture & Lighting',
    description: 'Fine architectural lines, neon signs, and reflections to test edge synthesis and 4K upscaling.',
    originalRes: '640 × 360',
    targetRecommend: '4K (3840 × 2160)',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=640&q=60',
  },
  {
    id: 'portrait-woman',
    title: 'Studio Portrait Photography',
    category: 'Faces & Portraits',
    description: 'Delicate skin tones, iris details, and eyelashes to evaluate Face & Portrait Enhancement.',
    originalRes: '600 × 800',
    targetRecommend: '4K (2160 × 2880)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=60',
  },
  {
    id: 'wildlife-fox',
    title: 'Wild Fox in Forest Foliage',
    category: 'Textures & Wildlife',
    description: 'Subtle fur fibers, whiskers, and autumn leaf textures for texture restoration testing.',
    originalRes: '640 × 426',
    targetRecommend: '2K / 4K',
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=640&q=60',
  },
  {
    id: 'mountain-sunset',
    title: 'Alpine Peak at Twilight',
    category: 'Landscape & Dynamic Range',
    description: 'High dynamic range gradients, misty ridge lines, and low-light noise reduction.',
    originalRes: '640 × 427',
    targetRecommend: '4K (3840 × 2160)',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=640&q=60',
  },
];

/**
 * Generates an in-browser sample video blob using canvas animation
 * so users can test the Video Enhancer immediately without needing to upload a file!
 */
export async function generateDemoVideoBlob(): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  const fps = 24;
  const durationSec = 3;
  const totalFrames = fps * durationSec;

  const stream = canvas.captureStream(fps);

  let mimeType = 'video/webm;codecs=vp9';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, { mimeType });
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  for (let f = 0; f < totalFrames; f++) {
    const progress = f / totalFrames;
    const time = progress * durationSec;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, '#0a0a14');
    grad.addColorStop(0.5, '#1e1035');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // Glowing animated orb
    const cx = 320 + Math.cos(time * 3) * 120;
    const cy = 180 + Math.sin(time * 4) * 60;
    const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 90);
    radGrad.addColorStop(0, '#ec4899');
    radGrad.addColorStop(0.4, '#8b5cf6');
    radGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, 0, Math.PI * 2);
    ctx.fill();

    // Geometric grid lines to test edge synthesis
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }
    for (let y = 0; y < 360; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // High frequency test text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PIXELFORGE AI TEST STREAM', 320, 150);

    ctx.fillStyle = '#a78bfa';
    ctx.font = '14px monospace';
    ctx.fillText(`FRAME ${f + 1} / ${totalFrames} • 640×360 LOW RES`, 320, 190);

    // Animated particle dust
    for (let i = 0; i < 20; i++) {
      const px = (Math.sin(time * 2 + i * 1.5) * 0.5 + 0.5) * 640;
      const py = (Math.cos(time * 2 + i * 2.1) * 0.5 + 0.5) * 360;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(px, py, 2, 2);
    }

    await new Promise((r) => setTimeout(r, 1000 / fps));
  }

  const blob = await new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.stop();
  });

  return new File([blob], 'pixelforge-demo-sample.webm', { type: mimeType });
}
