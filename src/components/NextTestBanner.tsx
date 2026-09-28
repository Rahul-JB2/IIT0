import React, { useState } from 'react';
import { TestSchedule, UserStudyState } from '../types/jee';
import { calculateTestReadiness, getDaysDifference } from '../utils/goalGenerator';
import { Calendar, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface NextTestBannerProps {
  test: TestSchedule;
  currentDate: string;
  chapterProgress: UserStudyState['chapterProgress'];
  onOpenPreTestDrill: () => void;
  onOpenTestPlanner: () => void;
}

export const NextTestBanner: React.FC<NextTestBannerProps> = ({
  test,
  currentDate,
  chapterProgress,
  onOpenPreTestDrill,
  onOpenTestPlanner,
}) => {
  const [isSyllabusExpanded, setIsSyllabusExpanded] = useState(false);
  const daysLeft = getDaysDifference(currentDate, test.date);
  const readiness = calculateTestReadiness(test, chapterProgress);

  const isOneDayBefore = daysLeft === 1;
  const isTestDay = daysLeft === 0;
  const isOverdue = daysLeft < 0;

  // Format date readable: "Sun, 4 Oct"
  const formattedDate = new Date(test.date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isOneDayBefore || isTestDay
          ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-500/10'
          : 'bg-slate-900/70 border-slate-800'
      } p-3 sm:p-4 mb-3 sm:mb-4`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Test Identification & Urgency */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-400 text-xs shrink-0">
            PT-{test.testNumber}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                {test.name}
              </span>

              {isTestDay ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-1.5 py-0.2 rounded-full animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  TODAY
                </span>
              ) : isOneDayBefore ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-600/80 px-1.5 py-0.2 rounded-full animate-pulse">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  1-DAY BLITZ
                </span>
              ) : isOverdue ? (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                  Passed
                </span>
              ) : (
                <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded-full">
                  {daysLeft}d left
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
              <span>{formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span>{test.pattern}</span>
            </div>
          </div>
        </div>

        {/* Right: Compact Readiness Gauge & Actions */}
        <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
          {/* Mini Readiness Gauge */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl px-2.5 py-1">
            <div className="w-14 sm:w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(5, readiness.percentage))}%` }}
              />
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 tabular-nums">
              {readiness.percentage}%
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenPreTestDrill}
              className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition flex items-center gap-1 active:scale-95 shrink-0"
              title="Open past papers & rapid formula drills"
            >
              <Sparkles className="w-3 h-3" />
              <span>Blitz</span>
            </button>

            <button
              onClick={() => setIsSyllabusExpanded(!isSyllabusExpanded)}
              className="px-2 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1 active:scale-95 shrink-0"
              title="Toggle chapter syllabus list"
            >
              <span>Syllabus</span>
              {isSyllabusExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Syllabus Detail Drawer */}
      {isSyllabusExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
            <span className="font-semibold text-sky-400 text-[11px] block">Physics Syllabus</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">{test.physicsSyllabus}</p>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
            <span className="font-semibold text-emerald-400 text-[11px] block">Chemistry Syllabus</span>
            <div className="space-y-0.5 text-slate-300 text-[11px] leading-relaxed">
              <p><strong className="text-slate-200">P-Chem:</strong> {test.pChemSyllabus}</p>
              {test.iChemSyllabus && (
                <p><strong className="text-slate-200">I-Chem:</strong> {test.iChemSyllabus}</p>
              )}
              {test.oChemSyllabus && (
                <p><strong className="text-slate-200">O-Chem:</strong> {test.oChemSyllabus}</p>
              )}
            </div>
          </div>

          <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80 space-y-1">
            <span className="font-semibold text-amber-400 text-[11px] block">Mathematics Syllabus</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">{test.mathSyllabus}</p>
            {test.advSpecific && (
              <div className="mt-1 pt-1 border-t border-slate-800/60 text-[10px] text-amber-300/90">
                <strong>Advanced:</strong> {test.advSpecific}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
