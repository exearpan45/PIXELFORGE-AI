import React, { useState } from 'react';
import { Sparkles, Image as ImageIcon, Video, FolderArchive, Info, Settings, Cpu, ShieldCheck, Menu, X } from 'lucide-react';
import { NavigationTab, HardwareInfo } from '../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenSettings: () => void;
  hardware: HardwareInfo | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  hardware,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: NavigationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Sparkles },
    { id: 'photo', label: 'Photo Enhancer', icon: ImageIcon },
    { id: 'video', label: 'Video Enhancer', icon: Video },
    { id: 'projects', label: 'My Projects', icon: FolderArchive },
    { id: 'about', label: 'About', icon: Info },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/8 bg-[#09090e]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all">
            <div className="w-full h-full bg-[#0d0d16] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-zinc-200 to-purple-300 bg-clip-text text-transparent">
                PIXELFORGE
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-600/30 text-purple-300 border border-purple-500/30">
                AI
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 -mt-0.5 hidden sm:block tracking-wide">
              From blurry to brilliant.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? 'bg-purple-600/90 text-white shadow-md shadow-purple-600/25 border border-purple-400/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status & Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Privacy badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-[11px] text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">100% Private (On-Device)</span>
          </div>

          {/* Hardware acceleration badge */}
          {hardware && (
            <div
              title="Hardware acceleration active for real-time 4K rendering"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-zinc-300 cursor-help"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="max-w-[130px] truncate">
                Hardware Accelerated
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
            title="Settings & Storage"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c0c14] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
