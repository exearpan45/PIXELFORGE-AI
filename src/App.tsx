import React, { useState, useEffect } from 'react';
import { NavigationTab, HardwareInfo, AppPreferences } from './types';
import { detectHardwareCapabilities } from './services/hardware';
import { getPreferences, savePreferences } from './services/storage';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SettingsModal } from './pages/SettingsModal';
import { HomePage } from './pages/Home';
import { PhotoEnhancer } from './pages/PhotoEnhancer';
import { VideoEnhancer } from './pages/VideoEnhancer';
import { ProjectsPage } from './pages/Projects';
import { AboutPage } from './pages/About';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [preferences, setPreferences] = useState<AppPreferences>(getPreferences());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    // Detect hardware on initial load
    detectHardwareCapabilities().then((info) => {
      setHardware(info);
      // If low-end device detected, adjust tile size automatically if not set
      if (info.isLowEndDevice && preferences.tileSize > 256) {
        const updated: AppPreferences = { ...preferences, lowMemoryMode: true, tileSize: 256 };
        setPreferences(updated);
        savePreferences(updated);
      }
    });
  }, []);

  const addToast = (
    type: 'success' | 'warning' | 'error' | 'info',
    title: string,
    message?: string
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdatePreferences = (updated: AppPreferences) => {
    setPreferences(updated);
    savePreferences(updated);
    addToast('success', 'Preferences Updated', 'Settings applied successfully.');
  };

  // Scroll to top on tab change
  const handleSelectTab = (tab: NavigationTab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#08080d] text-[#f3f4f6]">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hardware={hardware}
      />

      {/* Main Tab View */}
      <main className="flex-1">
        {currentTab === 'home' && <HomePage onSelectTab={handleSelectTab} />}
        {currentTab === 'photo' && (
          <PhotoEnhancer preferences={preferences} onNotify={addToast} />
        )}
        {currentTab === 'video' && (
          <VideoEnhancer preferences={preferences} onNotify={addToast} />
        )}
        {currentTab === 'projects' && (
          <ProjectsPage onSelectTab={handleSelectTab} onNotify={addToast} />
        )}
        {currentTab === 'about' && <AboutPage onSelectTab={handleSelectTab} />}
      </main>

      {/* Footer */}
      <Footer onSelectTab={handleSelectTab} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        hardware={hardware}
        onHistoryCleared={() => {
          addToast('success', 'History Cleared', 'All local records deleted from database.');
        }}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
