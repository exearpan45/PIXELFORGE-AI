import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Lock,
  Layers,
  Sparkles,
  Zap,
  Globe,
  CheckCircle2,
  XCircle,
  HelpCircle,
  HardDrive,
} from 'lucide-react';
import { NavigationTab } from '../types';

interface AboutPageProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onSelectTab }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero statement */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Strict Zero-Upload Architecture</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Super-Resolution Engineered for Absolute Privacy.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          PIXELFORGE AI was built on a single uncompromising principle: high-performance AI media enhancement without surrendering your private photos and videos to third-party cloud servers.
        </p>
      </div>

      {/* Primary Privacy Box */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#10101d] to-cyan-950/30 border border-purple-500/30 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Our Formal Privacy Pledge</h2>
            <p className="text-xs text-purple-300/80">Zero telemetry • Zero cloud processing • Zero tracking</p>
          </div>
        </div>

        <blockquote className="text-sm sm:text-base italic font-medium text-zinc-200 border-l-2 border-purple-400 pl-4 py-1">
          "Your media stays on your device. PIXELFORGE AI processes your files locally and does not upload them to a processing server."
        </blockquote>

        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          When you upload an image or video, all mathematical convolution kernels, bilateral edge filters, and sub-pixel texture synthesis algorithms run entirely within your device's web browser using WebGPU and WebGL 2.0 graphics memory. Network requests to external APIs are nonexistent.
        </p>
      </div>

      {/* Comparison: PIXELFORGE vs Cloud Upscalers */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white text-center">How We Compare to Cloud Upscalers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse rounded-2xl overflow-hidden bg-[#10101b] border border-white/10">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-zinc-300">
                <th className="p-4 font-semibold">Feature / Guarantee</th>
                <th className="p-4 font-semibold text-purple-300">PIXELFORGE AI</th>
                <th className="p-4 font-semibold text-zinc-400">Typical Cloud Services</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300">
              <tr>
                <td className="p-4 font-medium text-white">Where media is processed</td>
                <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> 100% on your device (Client-Side)
                </td>
                <td className="p-4 text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" /> Remote third-party servers
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Cost & Subscriptions</td>
                <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> ₹0 / $0 Free Forever
                </td>
                <td className="p-4 text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" /> $10 - $50 / month credits
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Server Queue & Waiting</td>
                <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Zero waiting • Instant execution
                </td>
                <td className="p-4 text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" /> Throttled queues & rate limits
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Watermarks & Locks</td>
                <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Clean lossless downloads
                </td>
                <td className="p-4 text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 shrink-0" /> Watermarked unless paid
                </td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Data Retention Policy</td>
                <td className="p-4 text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Nothing stored on remote servers
                </td>
                <td className="p-4 text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 shrink-0" /> Often logged or used for training
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Technical Architecture Cards */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white text-center">Under the Hood: Technical Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#10101b] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Edge-Adaptive Super-Resolution</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Computes directional edge gradient fields and multi-frequency detail reconstruction to restore crisp diagonal lines and intricate textures with zero staircasing or artificial blur.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#10101b] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">Overlapping Tile Blending</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              To eliminate GPU texture size limits and prevent mobile browser crashes when generating massive 4K (3840×2160) canvas outputs, images are processed in tiles with overlap borders and seam-free blending.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#10101b] border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white">IndexedDB Local Persistence</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Project metadata, resolution targets, and thumbnail previews are cached inside your device's private IndexedDB database. You have full control to clear history at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="p-8 rounded-3xl bg-[#10101b] border border-white/10 text-center space-y-4">
        <h3 className="text-lg sm:text-xl font-bold text-white">Ready to elevate your photos and videos?</h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Start upscaling right now. No signup, no API keys, and 100% free.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onSelectTab('photo')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
          >
            Open Photo Enhancer (4K)
          </button>
          <button
            onClick={() => onSelectTab('video')}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all"
          >
            Open Video Enhancer
          </button>
        </div>
      </div>
    </div>
  );
};
