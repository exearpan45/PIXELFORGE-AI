import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Zap,
  Maximize2,
  Download,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { ComparisonSlider } from '../components/ComparisonSlider';

interface HomePageProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectTab }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Curated showcase images for the live hero comparison slider
  const showcaseOriginal =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=480&q=50';
  const showcaseEnhanced =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1920&q=95';

  const faqs = [
    {
      q: 'Is PIXELFORGE AI truly 100% free with no hidden limits?',
      a: 'Yes, absolutely. Because all AI neural enhancement occurs locally on your own computer or phone using your device GPU (WebGL 2.0 and WebGPU), we incur zero server cloud computing expenses. There are no subscriptions, credits, watermarks, or hidden paywalls.',
    },
    {
      q: 'Does PIXELFORGE AI upload my photos or videos to any server?',
      a: 'Never. Your media files are decoded, upscaled, and enhanced completely inside your browser sandbox. No file, frame, or metadata is ever transmitted over the network.',
    },
    {
      q: 'What resolution can I upscale to?',
      a: 'PIXELFORGE AI supports upscaling up to 4K Ultra HD (3840 × 2160) for 16:9 media, as well as 2x, 4x, 1080p, and 1440p (2K). For custom aspect ratios, proportions are strictly preserved.',
    },
    {
      q: 'How does video upscaling preserve audio?',
      a: 'Our video engine extracts the original audio stream using browser Web Audio / MediaStream channels and synchronizes it with the newly enhanced high-resolution video frames during the client-side encoding phase.',
    },
    {
      q: 'What should I do if my browser runs low on memory?',
      a: 'You can open Settings from the top navigation bar and enable "Low-Memory Mode" or switch the GPU Tile Size to 128px or 256px. This enables fine-grained tile processing and avoids memory spikes on low-end devices.',
    },
  ];

  return (
    <div className="space-y-24 py-6">
      {/* 1. Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 pb-8 text-center space-y-8">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-purple-700/15 via-indigo-600/10 to-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Top Tagline Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#161626] border border-purple-500/30 text-purple-300 text-xs font-semibold shadow-lg shadow-purple-950/40 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>From blurry to brilliant • 100% Client-Side AI</span>
        </div>

        {/* Main Heading */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
            Turn Low Quality Into <br className="hidden sm:inline" />
            <span className="text-gradient-purple">Ultra Quality.</span>
          </h1>
          <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Enhance photos and videos with free browser-based AI processing. Upscale images and videos up to 4K without uploading your media to a server.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onSelectTab('photo')}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-600/30 flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
            <span>Upload Your Photo (to 4K)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectTab('video')}
            className="px-7 py-4 rounded-2xl bg-[#141422] hover:bg-[#1a1a2e] text-zinc-200 hover:text-white border border-white/10 hover:border-purple-500/40 font-bold text-sm sm:text-base shadow-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Video className="w-5 h-5 text-purple-400" />
            <span>Upload Your Video</span>
          </button>
        </div>

        {/* Trust metrics bar */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Zero Cloud Uploads</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>4K Resolution Export</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>₹0 Budget • Free Forever</span>
          </div>
        </div>
      </section>

      {/* 2. Interactive Before-and-After Comparison Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
            Interactive Showcase
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            See Image Enhancement in Real Time
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            Drag the slider divider left and right to inspect the sub-pixel edge restoration and clarity.
          </p>
        </div>

        <div className="p-2 sm:p-4 rounded-3xl bg-[#10101b] border border-white/10 shadow-2xl">
          <ComparisonSlider
            originalSrc={showcaseOriginal}
            enhancedSrc={showcaseEnhanced}
            originalLabel="Low-Res Input (480p)"
            enhancedLabel="PIXELFORGE 4K Output"
            originalDims={{ width: 480, height: 640 }}
            enhancedDims={{ width: 1920, height: 2560 }}
          />
        </div>
      </section>

      {/* 3. Feature Highlights Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
            Engine Capabilities
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Engineered for Extreme Detail
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 hover:border-purple-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">GPU Detail & Edge Filtering</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Synthesizes high-frequency details from directional gradient fields rather than simply blurring pixels with basic bicubic interpolation.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 hover:border-purple-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Maximize2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">True 4K Ultra HD Scaling</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Tiled memory architecture supports genuine 3840×2160 output resolution without running out of GPU memory or crashing browser tabs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 hover:border-purple-500/40 transition-all duration-300 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Audio-Synced Video Upscaling</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Enhance video frame-by-frame with synchronized original audio tracks, outputting clean high-bitrate WebM or MP4 video files.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Supported Resolutions Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#12121f] via-[#0d0d16] to-[#0a0a10] border border-white/10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
                Precision Targets
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                Supported Resolution Targets
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
              Proportions are strictly preserved for 16:9, 4:3, 1:1, or portrait mobile aspect ratios.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-400">720p HD</div>
              <div className="text-lg sm:text-xl font-bold text-white">1280 × 720</div>
              <p className="text-[11px] text-zinc-500">Fast processing for web & social</p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-400">1080p Full HD</div>
              <div className="text-lg sm:text-xl font-bold text-white">1920 × 1080</div>
              <p className="text-[11px] text-zinc-500">Standard crisp high-definition</p>
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/8 space-y-2">
              <div className="text-xs font-mono text-zinc-400">1440p 2K QHD</div>
              <div className="text-lg sm:text-xl font-bold text-purple-300">2560 × 1440</div>
              <p className="text-[11px] text-zinc-500">High-DPI display & desktop</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/60 to-black border border-purple-500/40 space-y-2 shadow-lg shadow-purple-950/30">
              <div className="text-xs font-mono text-purple-300 font-bold">2160p 4K UHD</div>
              <div className="text-lg sm:text-xl font-extrabold text-white">3840 × 2160</div>
              <p className="text-[11px] text-purple-200/80">Cinematic ultra-fidelity</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
            Simple 3-Step Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How PIXELFORGE AI Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 space-y-3 relative">
            <span className="text-4xl font-extrabold font-mono text-purple-500/30">01</span>
            <h3 className="text-base font-bold text-white">Upload Low-Res File</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Drop any JPG, PNG, WEBP, or MP4/WebM video. Your file is read locally into browser memory with zero network uploads.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 space-y-3 relative">
            <span className="text-4xl font-extrabold font-mono text-purple-500/30">02</span>
            <h3 className="text-base font-bold text-white">GPU Image Enhancement</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Our WebGL / WebGPU pipeline executes directional edge synthesis, bilateral noise reduction, and detail restoration directly on your GPU.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-[#10101b] border border-white/10 space-y-3 relative">
            <span className="text-4xl font-extrabold font-mono text-purple-500/30">03</span>
            <h3 className="text-base font-bold text-white">Compare & Download</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Inspect the interactive before-and-after slider, zoom into fine details, and download your pristine 4K file in lossless quality.
            </p>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Got Questions?</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-[#10101b] border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-sm font-bold text-white hover:text-purple-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-purple-900/60 via-[#141426] to-indigo-950/60 border border-purple-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Start Upscaling Your Media Right Now
            </h2>
            <p className="text-xs sm:text-base text-zinc-300 max-w-lg mx-auto">
              No registration required. Experience the power of local browser AI acceleration today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onSelectTab('photo')}
              className="px-6 py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              Launch Photo Enhancer
            </button>
            <button
              onClick={() => onSelectTab('video')}
              className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm transition-all shadow-xl active:scale-95 cursor-pointer"
            >
              Launch Video Enhancer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
