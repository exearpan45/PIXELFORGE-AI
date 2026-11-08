import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_IMAGES, SampleImage } from '../services/samples';

interface ImageDropzoneProps {
  onImageSelected: (file: File | string, previewUrl: string, width: number, height: number, sizeBytes: number, name: string) => void;
  onError: (msg: string) => void;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelected, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/avif'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|bmp|avif)$/i)) {
      onError('Unsupported image format. Please upload JPG, PNG, WEBP, BMP, or AVIF.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      onImageSelected(file, previewUrl, img.naturalWidth, img.naturalHeight, file.size, file.name);
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      onError('Unable to decode the image file. It may be corrupted.');
    };
    img.src = previewUrl;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = async (sample: SampleImage) => {
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      processFile(file);
    } catch {
      onError('Failed to load sample image. Please check your internet connection or upload your own image.');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Drag & Drop Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center overflow-hidden ${
          isDragOver
            ? 'border-purple-400 bg-purple-950/20 shadow-[0_0_40px_rgba(168,85,247,0.3)] scale-[1.01]'
            : 'border-white/15 hover:border-purple-500/50 bg-[#10101b]/60 hover:bg-[#121222]/80 backdrop-blur-xl shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp,image/avif"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {/* Ambient background hover glow */}
        <div className="absolute inset-0 bg-radial from-purple-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-lg mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide mb-1.5">
          Drop your image here, or <span className="text-purple-400 group-hover:underline">browse files</span>
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mb-4">
          Upscale up to 4K resolution directly on your device. Never uploaded to any external server.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-zinc-400">
          <span className="px-2 py-1 rounded bg-black/40 border border-white/8">JPG / JPEG</span>
          <span className="px-2 py-1 rounded bg-black/40 border border-white/8">PNG</span>
          <span className="px-2 py-1 rounded bg-black/40 border border-white/8">WEBP</span>
          <span className="px-2 py-1 rounded bg-black/40 border border-white/8">BMP</span>
          <span className="px-2 py-1 rounded bg-black/40 border border-white/8">AVIF</span>
        </div>
      </div>

      {/* Or Pick a Curated Sample */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Or test with a curated sample image
          </span>
          <span className="text-zinc-500 text-[11px]">Click to load instantly</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSampleClick(sample)}
              className="group cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 bg-[#11111c] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-950/40"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-black/40">
                <img
                  src={sample.url}
                  alt={sample.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-purple-300 border border-white/10">
                  {sample.originalRes}
                </div>
              </div>
              <div className="p-2.5">
                <h4 className="text-xs font-semibold text-white truncate">{sample.title}</h4>
                <p className="text-[10px] text-zinc-400 truncate mt-0.5">{sample.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
