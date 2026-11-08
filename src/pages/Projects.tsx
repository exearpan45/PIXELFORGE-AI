import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Image as ImageIcon,
  Video,
  Trash2,
  Download,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import { NavigationTab, ProjectRecord } from '../types';
import { getProjects, deleteProject, clearAllProjects } from '../services/storage';

interface ProjectsPageProps {
  onSelectTab: (tab: NavigationTab) => void;
  onNotify: (type: 'success' | 'warning' | 'error' | 'info', title: string, message?: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onSelectTab, onNotify }) => {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectRecord | null>(null);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const items = await getProjects();
      setProjects(items);
    } catch {
      onNotify('error', 'Storage Error', 'Could not read local project database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      onNotify('info', 'Project Removed', 'Deleted record from local IndexedDB.');
    } catch {
      onNotify('error', 'Delete Failed', 'Failed to remove project.');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all local project records?')) return;
    try {
      await clearAllProjects();
      setProjects([]);
      setSelectedProject(null);
      onNotify('success', 'History Cleared', 'All local records deleted.');
    } catch {
      onNotify('error', 'Clear Failed', 'Failed to clear records.');
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
              IndexedDB Storage
            </span>
            <span className="text-zinc-500 text-xs">• 100% Private to your device</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            My Projects & History
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Browse and inspect your recent client-side upscaled photos and video projects.
          </p>
        </div>

        {projects.length > 0 && (
          <button
            onClick={handleClearAll}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Projects</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-500">Loading your project library...</div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl bg-[#10101b] border border-white/10 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FolderArchive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Projects Saved Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Enhance an image or video in PIXELFORGE AI and it will automatically be archived in your local browser history.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('photo')}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upscale a Photo</span>
            </button>
            <button
              onClick={() => onSelectTab('video')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Upscale a Video</span>
            </button>
          </div>
        </div>
      ) : (
        /* Project Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedProject(item)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-[#10101b] border border-white/10 hover:border-purple-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Thumbnail or Video icon header */}
              <div className="relative aspect-16/10 bg-black/60 overflow-hidden flex items-center justify-center">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.originalFileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    {item.type === 'video' ? <Video className="w-10 h-10 text-purple-400" /> : <ImageIcon className="w-10 h-10" />}
                    <span className="text-xs font-mono">{item.type.toUpperCase()}</span>
                  </div>
                )}

                {/* Badge for resolution */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-purple-950/85 backdrop-blur-md border border-purple-500/40 text-[10px] font-bold text-purple-200">
                  {item.settings.resolution.toUpperCase()} ({item.targetWidth}×{item.targetHeight})
                </div>

                {/* Type Icon Badge */}
                <div className="absolute top-3 right-3 p-1.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-zinc-300">
                  {item.type === 'video' ? <Video className="w-3.5 h-3.5" /> : <ImageIcon className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Content info */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white truncate flex-1" title={item.originalFileName}>
                    {item.originalFileName}
                  </h4>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="text-zinc-500 hover:text-rose-400 p-1 -mr-1 rounded-lg transition-colors"
                    title="Delete project record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                  <div>
                    <span className="text-zinc-600 block text-[9px] uppercase">Original</span>
                    <span>{item.originalWidth}×{item.originalHeight}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[9px] uppercase">Enhanced</span>
                    <span className="text-purple-300 font-semibold">{item.targetWidth}×{item.targetHeight}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{formatDate(item.createdAt)}</span>
                  <span>{formatBytes(item.outputSizeBytes || item.originalSizeBytes)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0f0f18] border border-white/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  {selectedProject.type === 'video' ? <Video className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-[280px]">
                    {selectedProject.originalFileName}
                  </h3>
                  <p className="text-[11px] text-zinc-400">Project Metadata Record</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {selectedProject.thumbnailUrl && (
              <div className="relative aspect-16/10 rounded-xl overflow-hidden bg-black/50 border border-white/8">
                <img
                  src={selectedProject.thumbnailUrl}
                  alt={selectedProject.originalFileName}
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500">Original Dimensions:</span>
                <span className="font-mono text-zinc-300">{selectedProject.originalWidth} × {selectedProject.originalHeight} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Enhanced 4K Target:</span>
                <span className="font-mono text-purple-300 font-bold">{selectedProject.targetWidth} × {selectedProject.targetHeight} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Detail Restoration:</span>
                <span className="font-mono text-zinc-300">{selectedProject.settings.detailRestoration}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Sharpening & Clarity:</span>
                <span className="font-mono text-zinc-300">{selectedProject.settings.sharpening}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Noise Reduction:</span>
                <span className="font-mono text-zinc-300">{selectedProject.settings.noiseReduction}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Created:</span>
                <span className="font-mono text-zinc-400">{formatDate(selectedProject.createdAt)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={(e) => handleDelete(selectedProject.id, e)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium"
              >
                Delete Record
              </button>
              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
