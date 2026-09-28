import React from 'react';
import {
  Home,
  CalendarCheck,
  Award,
  Sparkles,
  User,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPreTestActive: boolean;
  userEmail?: string | null;
  userPhoto?: string | null;
  isCloudSynced: boolean;
  onOpenAssistant?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  isPreTestActive,
  onOpenAssistant,
}) => {
  // Mobile Android 5 Main Tabs (Home, Tests, Gemini, Scores, Profile)
  const tabs = [
    {
      id: 'daily-goals',
      label: 'Home',
      icon: Home,
      badge: null,
    },
    {
      id: 'test-planner',
      label: 'Tests',
      icon: CalendarCheck,
      badge: isPreTestActive ? '1D' : null,
    },
    {
      id: 'gemini-hub',
      label: 'Gemini',
      icon: Sparkles,
      badge: 'AI',
      isAssistant: true,
    },
    {
      id: 'test-scores',
      label: 'Scores',
      icon: Award,
      badge: null,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  const handleTabClick = (tabId: string) => {
    // Subtle Android haptic feedback
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch (e) {
        // Ignore if vibrations not supported
      }
    }
    setActiveTab(tabId);
  };

  return (
    <nav
      aria-label="Android Bottom Navigation Bar"
      className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 shadow-2xl safe-area-bottom select-none"
    >
      <div className="max-w-md sm:max-w-lg mx-auto px-3">
        <div className="flex items-center justify-around h-15 pt-1.5">
          {tabs.map((tab) => {
            const isGemini = tab.isAssistant;
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 active:scale-95 group focus:outline-none`}
              >
                {/* Material 3 Active Pill Container */}
                <div
                  className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                    isActive
                      ? isGemini
                        ? 'bg-gradient-to-r from-amber-500/25 to-sky-500/25 text-amber-300 ring-1 ring-amber-400/50'
                        : 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform ${
                      isActive ? 'scale-105 stroke-[2.4]' : 'stroke-[1.8]'
                    }`}
                  />

                  {/* Badge */}
                  {tab.badge && (
                    <span
                      className={`absolute -top-1 -right-1 text-[8px] font-bold font-mono px-1 rounded-full text-white ${
                        isGemini
                          ? 'bg-gradient-to-r from-sky-500 to-amber-500 shadow-sm'
                          : 'bg-rose-500 animate-pulse'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[10px] mt-0.5 tracking-tight font-medium ${
                    isActive
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
