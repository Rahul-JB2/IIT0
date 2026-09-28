import React, { useState } from 'react';
import {
  Menu,
  X,
  Flame,
  Clock,
  RotateCcw,
  CalendarDays,
  Grid3X3,
  CalendarCheck,
  Award,
  Zap,
  Shield,
  User,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentDate: string;
  setCurrentDate: (date: string) => void;
  streak: number;
  totalStudyHours: number;
  onReset: () => void;
  userEmail?: string | null;
  isCloudSynced?: boolean;
  onOpenAssistant?: () => void;
  masteryPoints?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentDate,
  setCurrentDate,
  streak,
  totalStudyHours,
  onReset,
  userEmail,
  isCloudSynced,
  onOpenAssistant,
  masteryPoints = 180,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const menuItems = [
    { id: 'daily-goals', label: 'Daily PCM Goals (Home)', icon: CalendarDays },
    { id: 'chapter-matrix', label: '6-Milestone Chapter Matrix', icon: Grid3X3 },
    { id: 'test-planner', label: 'Super-50 Test Series Planner', icon: CalendarCheck },
    { id: 'gemini-hub', label: 'Gemini AI Hub & Mock Deep-Dive', icon: Sparkles },
    { id: 'test-scores', label: 'Analytics & Scorecard', icon: Award },
    { id: 'pre-test-mode', label: 'Pre-Test 1-Day Blitz Drill', icon: Zap },
    { id: 'study-guard', label: 'Regain Digital Detox Guard', icon: Shield },
    { id: 'profile', label: 'Student Profile & Reward Store', icon: User },
  ];

  const advanceDay = (days: number) => {
    const current = new Date(currentDate + 'T00:00:00');
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSelectTab = (tabId: string) => {
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(8); } catch (e) {}
    }
    setActiveTab(tabId);
    setIsDrawerOpen(false);
  };

  const formattedDateShort = new Date(currentDate + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      {/* Android Material 3 Top App Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 w-full max-w-full overflow-hidden select-none">
        <div className="w-full px-3 sm:px-5">
          <div className="flex items-center justify-between h-13 sm:h-14 gap-2">
            
            {/* Left: Material Navigation Icon (Hamburger) + Title */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:border-amber-500/50 flex items-center justify-center text-slate-200 hover:text-amber-400 active:scale-95 transition-all shadow-sm focus:outline-none shrink-0"
                title="Open Android App Menu"
                aria-label="Open Android App Menu"
              >
                <Menu className="w-4 h-4 stroke-[2.2]" />
              </button>

              <button
                onClick={() => handleSelectTab('daily-goals')}
                className="text-left font-bold text-sm tracking-tight text-white hover:text-amber-400 transition-colors truncate flex items-center gap-1.5 focus:outline-none"
              >
                <span className="truncate">JEE Super-50</span>
                <span className="hidden sm:inline text-[10px] font-mono text-amber-400 font-normal bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-800/40 shrink-0">
                  2025-27
                </span>
              </button>
            </div>

            {/* Right: Quick Action Chips (Never wraps or overflows) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {/* Simulated Date Quick Pill */}
              <button
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-amber-500/40 active:scale-95 transition"
                title="Change Study Date"
              >
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>{formattedDateShort}</span>
              </button>

              {/* Streak pill */}
              <div
                className="flex items-center gap-1 text-[11px] text-amber-400 bg-slate-900 border border-slate-800 rounded-full px-2 py-1 font-mono font-bold tabular-nums"
                title={`${streak}-day study streak`}
              >
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                <span>{streak}d</span>
              </div>

              {/* JEE Mastery Points (JMP) Balance Badge */}
              <button
                onClick={() => handleSelectTab('profile')}
                className="flex items-center gap-1 px-2 py-1 bg-amber-950/70 border border-amber-500/40 rounded-full text-amber-300 font-mono text-[11px] font-bold hover:bg-amber-900/60 active:scale-95 transition shadow-sm"
                title="JEE Mastery Points balance (Redeem for break passes)"
              >
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{masteryPoints}</span>
              </button>

              {/* Gemini Trigger Button */}
              {onOpenAssistant && (
                <button
                  onClick={onOpenAssistant}
                  title="Open Gemini AI Assistant"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-sky-500/30 to-amber-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 hover:border-amber-300 active:scale-90 transition-all shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Date Stepper Dropdown Bar (Slide-down drawer when user taps date) */}
        {isDatePickerOpen && (
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-top-2 duration-150">
            <span className="text-[11px] text-slate-400 font-mono">Simulated Date:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => advanceDay(-1)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Previous Day (-1d)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  setCurrentDate(e.target.value);
                  setIsDatePickerOpen(false);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs px-2 py-0.5 rounded font-mono focus:outline-none"
              />
              <button
                onClick={() => advanceDay(1)}
                className="p-1 rounded bg-slate-800 text-amber-400 hover:text-amber-300 font-bold"
                title="Next Day (+1d)"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsDatePickerOpen(false)}
                className="ml-2 text-[10px] text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Slide-out Android Material Navigation Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Scrim / Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel (Android Material 3 Surface) */}
          <div className="relative flex-1 flex flex-col max-w-[280px] sm:max-w-xs w-full bg-slate-950 border-r border-slate-800/80 shadow-2xl rounded-r-3xl overflow-hidden animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header with Android App Branding */}
            <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-300 p-[1.5px] shadow-sm">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-amber-400 font-mono text-xs">
                    50
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    JEE Super-50
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Android SDK App 2025-27
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Status Pill */}
            <div className="p-3 mx-3 mt-3 bg-slate-900/80 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Sync Status</span>
                <span className="font-mono text-emerald-400 font-semibold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {isCloudSynced ? 'Firebase Cloud' : 'Local Storage'}
                </span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] truncate mt-1">
                {userEmail || 'Aspirant (Super-50)'}
              </p>
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Total Study:</span>
                <span className="text-sky-400 font-bold">{totalStudyHours.toFixed(1)} hrs</span>
              </div>
            </div>

            {/* Navigation Links with Material Pill Active States */}
            <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950 stroke-[2.4]' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-800/80 space-y-1.5 text-xs bg-slate-950">
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  onReset();
                }}
                className="w-full py-2 px-3 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl text-left flex items-center gap-2 transition-colors text-[11px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset To Default Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
