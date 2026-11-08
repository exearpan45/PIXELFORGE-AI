import React, { useState } from 'react';
import { X, Sliders, Cpu, HardDrive, ShieldCheck, Trash2, Check, RefreshCw } from 'lucide-react';
import { AppPreferences, HardwareInfo, ResolutionTarget } from '../types';
import { clearAllProjects } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: AppPreferences;
  onUpdatePreferences: (prefs: AppPreferences) => void;
  hardware: HardwareInfo | null;
  onHistoryCleared?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  hardware,
  onHistoryCleared,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await clearAllProjects();
      setShowClearConfirm(false);
      if (onHistoryCleared) onHistoryCleared();
    } finally {
      setClearing(false);
    }
  };

  const resolutions: { id: ResolutionTarget; label: string; desc: string }[] = [
    { id: '2x', label: '2x Upscale', desc: 'Double resolution' },
    { id: '4x', label: '4x Upscale', desc: 'Quadruple resolution' },
    { id: '1080p', label: '1080p Full HD', desc: '1920 × 1080' },
    { id: '1440p', label: '1440p 2K QHD', desc: '2560 × 1440' },
    { id: '4k', label: '2160p 4K UHD', desc: '3840 × 2160 ultra quality' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0f0f18] border border-white/10 shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Studio Settings & Hardware</h3>
              <p className="text-xs text-zinc-400">Configure client-side AI engine & device memory options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: GPU & Hardware Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Detected Hardware Acceleration
          </h4>
          <div className="p-4 rounded-2xl bg-black/40 border border-white/8 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">WebGPU Status:</span>
              <span className={`font-mono font-medium ${hardware?.hasWebGPU ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hardware?.hasWebGPU ? 'Enabled & Ready' : 'Unavailable in this browser'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">WebGL 2.0 Pipeline:</span>
              <span className="font-mono text-emerald-400 font-medium">Active (Hardware Accelerated)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">GPU Device / Renderer:</span>
              <span className="font-mono text-zinc-300 truncate max-w-[240px]">
                {hardware?.webglRenderer || 'Integrated GPU'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Max Texture Size:</span>
              <span className="font-mono text-zinc-300">{hardware?.maxTextureSize || 4096}px</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">CPU Thread Concurrency:</span>
              <span className="font-mono text-zinc-300">{hardware?.hardwareConcurrency || 4} cores</span>
            </div>
          </div>
        </div>

        {/* Section 2: Default Target Resolution */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Default Upscale Resolution
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {resolutions.map((res) => {
              const selected = preferences.defaultResolution === res.id;
              return (
                <button
                  key={res.id}
                  onClick={() =>
                    onUpdatePreferences({ ...preferences, defaultResolution: res.id })
                  }
                  className={`flex items-start justify-between p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'bg-purple-600/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-black/30 border-white/8 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold ${selected ? 'text-purple-300' : 'text-white'}`}>
                      {res.label}
                    </p>
                    <p className="text-[11px] text-zinc-400">{res.desc}</p>
                  </div>
                  {selected && <Check className="w-4 h-4 text-purple-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Tile Processing Size */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              GPU Tile Size
            </label>
            <span className="text-[11px] text-purple-400 font-mono">{preferences.tileSize} × {preferences.tileSize} px</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([128, 256, 512, 1024] as const).map((size) => (
              <button
                key={size}
                onClick={() => onUpdatePreferences({ ...preferences, tileSize: size })}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                  preferences.tileSize === size
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-black/30 border-white/8 hover:border-white/20 text-zinc-300'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
          <p className="text-[11px] text-zinc-400">
            Smaller tile sizes (128-256px) use less GPU memory and prevent browser tab crashes on phones or integrated graphics. 512px gives fastest throughput.
          </p>
        </div>

        {/* Section 4: Low-Memory Mode */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/8 flex items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white">Low-Memory Mode</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Optimizes memory release between frames and tiles for older laptops and mobile devices.
            </p>
          </div>
          <button
            onClick={() =>
              onUpdatePreferences({
                ...preferences,
                lowMemoryMode: !preferences.lowMemoryMode,
                tileSize: !preferences.lowMemoryMode ? 256 : preferences.tileSize,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              preferences.lowMemoryMode ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                preferences.lowMemoryMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Section 5: Local Storage & History Management */}
        <div className="space-y-3 pt-2 border-t border-white/8">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Local IndexedDB Storage
          </h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-white/8">
            <div>
              <p className="text-xs font-semibold text-white">Project History Cache</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Saved locally inside your browser database. Nothing is sent to servers.
              </p>
            </div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearHistory}
                  disabled={clearing}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {clearing ? 'Clearing...' : 'Yes, Delete All'}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
