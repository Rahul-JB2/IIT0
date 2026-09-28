import React, { useState, useEffect } from 'react';
import { Atom, ShieldCheck } from 'lucide-react';

interface AndroidSplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export const AndroidSplashScreen: React.FC<AndroidSplashScreenProps> = ({
  onFinish,
  minDurationMs = 850,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, minDurationMs);

    const closeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onFinish) onFinish();
    }, minDurationMs + 300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(closeTimer);
    };
  }, [minDurationMs, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      aria-label="App Splash Launch Screen"
      className={`fixed inset-0 z-50 bg-[#070b14] flex flex-col items-center justify-between p-6 select-none transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top spacing respecting real device status bar */}
      <div className="w-full pt-4" />

      {/* Center: App Icon and Title */}
      <div className="flex flex-col items-center text-center space-y-5 -mt-6">
        {/* Animated App Emblem */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-[2px] shadow-2xl shadow-amber-500/30 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center p-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent" />
              <Atom className="w-12 h-12 text-amber-400 stroke-[1.8] animate-spin" style={{ animationDuration: '8s' }} />
              <div className="mt-1 text-[11px] font-black text-amber-300 tracking-wider font-mono">
                S-50
              </div>
            </div>
          </div>
          {/* Subtle glow ring */}
          <div className="absolute -inset-2 bg-amber-400/20 rounded-3xl blur-xl -z-10 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>JEE Super-50</span>
            <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              2025-27
            </span>
          </h1>
          <p className="text-xs font-medium text-slate-400">
            BSEB Super-50 Master Edition
          </p>
        </div>

        {/* Android Material Indeterminate Loading Bar */}
        <div className="w-48 space-y-2 pt-4">
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 rounded-full animate-indeterminate" />
          </div>
          <p className="text-[10px] text-slate-500 font-mono tracking-wide">
            Loading Offline Matrix & Tests...
          </p>
        </div>
      </div>

      {/* Footer: Offline Ready */}
      <div className="flex flex-col items-center gap-2 pb-6 text-center">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Offline Engine Ready</span>
        </div>
      </div>
    </div>
  );
};
