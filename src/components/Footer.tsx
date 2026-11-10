import React from 'react';
import { Sparkles, Shield, Cpu, Lock, Github, Heart } from 'lucide-react';
import { NavigationTab } from '../types';

interface FooterProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="border-t border-white/8 bg-[#06060a] text-zinc-400 text-xs mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Privacy Banner callout */}
        <div className="mb-10 p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-[#10101d] to-cyan-950/40 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">
                100% Client-Side Privacy Guarantee
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                "Your media stays on your device. PIXELFORGE AI processes your files locally and does not upload them to a processing server."
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 shrink-0">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/40 border border-white/10">
              <Cpu className="w-3.5 h-3.5 text-purple-400" /> Browser-Accelerated When Available
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-black/40 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> ₹0 Budget • Zero Server
            </span>
          </div>
        </div>

        {/* 4 Columns layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-white tracking-wider">PIXELFORGE AI</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Browser-based image and video enhancement tools with device-aware processing modes and local file handling.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Navigation</h5>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onSelectTab('photo')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Photo Upscaler (to 4K)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('video')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Video Enhancer
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('projects')}
                  className="hover:text-purple-400 transition-colors"
                >
                  My Projects History
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTab('about')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Privacy & Architecture
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Supported Output */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Supported Formats</h5>
            <p className="text-xs text-zinc-400">Images: JPG, PNG, WEBP, BMP, AVIF</p>
            <p className="text-xs text-zinc-400">Videos: MP4, WebM, MOV</p>
            <p className="text-xs text-zinc-400">Target Scales: 2x, 4x, 1080p, 1440p (2K), 2160p (4K)</p>
          </div>

          {/* Col 4: Studio Highlights */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold uppercase tracking-wider text-white">Studio Highlights</h5>
            <p className="text-xs text-zinc-400">100% Private to Your Device</p>
            <p className="text-xs text-zinc-400">Zero Cloud File Uploads</p>
            <p className="text-xs text-zinc-400">High-Resolution Export Options (Device-Dependent)</p>
            <p className="text-xs text-zinc-400">No Subscriptions or Watermarks</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} PIXELFORGE AI. Free open-source local processing.</p>
          <div className="flex items-center gap-1 text-zinc-400">
            <span>Built for high-performance creative workflows</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
