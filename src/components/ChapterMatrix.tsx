import React, { useState, useMemo } from 'react';
import { Chapter, MilestoneKey, MILESTONES, SubjectType, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from '../data/super50Data';
import {
  Search,
  Check,
  Star,
  BookOpen,
  ChevronRight,
  FileText,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ChapterMatrixProps {
  chapterProgress: UserStudyState['chapterProgress'];
  onToggleMilestone: (chapterId: string, milestoneKey: MilestoneKey) => void;
  onOpenChapterDetail: (chapter: Chapter) => void;
  highlightTestNumber?: number;
}

export const ChapterMatrix: React.FC<ChapterMatrixProps> = ({
  chapterProgress,
  onToggleMilestone,
  onOpenChapterDetail,
  highlightTestNumber,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<'All' | 'Physics' | 'Physical' | 'Inorganic' | 'Organic' | 'Math'>('All');
  const [testFilter, setTestFilter] = useState<number | 'All'>(highlightTestNumber || 'All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  // Filtered chapters calculation
  const filteredChapters = useMemo(() => {
    return ALL_CHAPTERS.filter((ch) => {
      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = ch.name.toLowerCase().includes(query);
        const matchesTopics = ch.keyTopics?.some((t) => t.toLowerCase().includes(query));
        if (!matchesName && !matchesTopics) return false;
      }

      // Subject filter
      if (subjectFilter !== 'All') {
        if (subjectFilter === 'Physics' && ch.subject !== 'Physics') return false;
        if (subjectFilter === 'Math' && ch.subject !== 'Math') return false;
        if (subjectFilter === 'Physical' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Physical')) return false;
        if (subjectFilter === 'Inorganic' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Inorganic')) return false;
        if (subjectFilter === 'Organic' && (ch.subject !== 'Chemistry' || ch.chemBranch !== 'Organic')) return false;
      }

      // Test filter
      if (testFilter !== 'All') {
        if (!ch.partTestIds.includes(testFilter as number)) return false;
      }

      // Status filter
      if (statusFilter !== 'All') {
        const prog = chapterProgress[ch.id];
        const doneCount = prog
          ? (prog.theory ? 1 : 0) +
            (prog.conclusion1Page ? 1 : 0) +
            (prog.mathongo ? 1 : 0) +
            (prog.moduleEx2 ? 1 : 0) +
            (prog.eklavya ? 1 : 0) +
            (prog.prevPartTest ? 1 : 0)
          : 0;
        if (statusFilter === 'Completed' && doneCount < 6) return false;
        if (statusFilter === 'Pending' && doneCount === 6) return false;
      }

      return true;
    });
  }, [searchQuery, subjectFilter, testFilter, statusFilter, chapterProgress]);

  // Overall statistics for the current filter
  const stats = useMemo(() => {
    let totalMilestones = filteredChapters.length * 6;
    let completedMilestones = 0;

    filteredChapters.forEach((ch) => {
      const prog = chapterProgress[ch.id];
      if (prog) {
        if (prog.theory) completedMilestones++;
        if (prog.conclusion1Page) completedMilestones++;
        if (prog.mathongo) completedMilestones++;
        if (prog.moduleEx2) completedMilestones++;
        if (prog.eklavya) completedMilestones++;
        if (prog.prevPartTest) completedMilestones++;
      }
    });

    const percent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
    return { totalMilestones, completedMilestones, percent };
  }, [filteredChapters, chapterProgress]);

  const handleMilestoneTap = (chapterId: string, milestoneKey: MilestoneKey) => {
    if (window.navigator?.vibrate) {
      try { window.navigator.vibrate(10); } catch (e) {}
    }
    onToggleMilestone(chapterId, milestoneKey);
  };

  const getSubjectBadge = (ch: Chapter) => {
    if (ch.subject === 'Physics') {
      return <span className="text-[11px] text-sky-400 font-semibold bg-sky-950/60 border border-sky-800/60 px-1.5 py-0.5 rounded">Physics</span>;
    }
    if (ch.subject === 'Math') {
      return <span className="text-[11px] text-amber-400 font-semibold bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">Mathematics</span>;
    }
    return (
      <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
        Chem · {ch.chemBranch}
      </span>
    );
  };

  const milestoneShortLabels: { key: MilestoneKey; label: string; short: string }[] = [
    { key: 'theory', label: 'Theory Notes', short: 'Theory' },
    { key: 'conclusion1Page', label: '1-Page Summary', short: '1-Page' },
    { key: 'mathongo', label: 'MathonGo Concept', short: 'MathonGo' },
    { key: 'moduleEx2', label: 'Module Ex-2', short: 'Ex-2' },
    { key: 'eklavya', label: 'EKLAVYA Batch', short: 'Eklavya' },
    { key: 'prevPartTest', label: 'Prev Part Test', short: 'Prev PT' },
  ];

  return (
    <div className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header and Filter Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
        
        {/* Top Summary Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-amber-400">PCM 6-Milestone Matrix</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">Offline Chapter Tracker</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mt-0.5 truncate">
              Chapter Milestone Tracker
            </h2>
          </div>

          {/* Mode Switcher + Progress */}
          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs font-mono">
            {/* View Mode Toggle: Android Cards vs Table */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                  viewMode === 'cards'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Android Mobile Card View (Recommended)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition ${
                  viewMode === 'table'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table Sheet View"
              >
                <List className="w-3.5 h-3.5" />
                <span>Sheet</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-amber-400 font-bold text-xs tabular-nums">
                  {stats.completedMilestones}/{stats.totalMilestones} ({stats.percent}%)
                </span>
              </div>
              <div className="w-16 sm:w-20 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="space-y-2.5 pt-0.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapters, mechanics, calculus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          {/* Subject Filter Chips (Native Android Material Chip Carousel) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(
              [
                { id: 'All', label: 'All' },
                { id: 'Physics', label: 'Physics' },
                { id: 'Physical', label: 'Physical' },
                { id: 'Inorganic', label: 'Inorganic' },
                { id: 'Organic', label: 'Organic' },
                { id: 'Math', label: 'Math' },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectFilter(s.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  subjectFilter === s.id
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Test & Status dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-sans truncate"
            >
              <option value="All">All Tests (PT 1-8)</option>
              {ALL_TESTS.filter((t) => t.type === 'part').map((t) => (
                <option key={t.id} value={t.testNumber}>
                  {t.name} (PT-{t.testNumber})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500 font-sans"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Mastered (6/6)</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: NATIVE ANDROID MOBILE CARDS (DEFAULT) */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredChapters.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              No chapters match your search or filter.
            </div>
          ) : (
            filteredChapters.map((ch) => {
              const prog = chapterProgress[ch.id] || {
                theory: false,
                conclusion1Page: false,
                mathongo: false,
                moduleEx2: false,
                eklavya: false,
                prevPartTest: false,
              };

              const doneCount =
                (prog.theory ? 1 : 0) +
                (prog.conclusion1Page ? 1 : 0) +
                (prog.mathongo ? 1 : 0) +
                (prog.moduleEx2 ? 1 : 0) +
                (prog.eklavya ? 1 : 0) +
                (prog.prevPartTest ? 1 : 0);

              const percent = Math.round((doneCount / 6) * 100);
              const isMastered = doneCount === 6;

              return (
                <div
                  key={ch.id}
                  className={`bg-slate-900/70 border rounded-2xl p-4 transition-all ${
                    isMastered
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  {/* Top: Badges & Chapter Title */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getSubjectBadge(ch)}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          PT-{ch.introducedInTest}
                        </span>
                        {ch.isAdvOnly && (
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-950/80 border border-rose-800/60 px-1.5 py-0.2 rounded">
                            ADV ONLY
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenChapterDetail(ch)}
                        className="text-left font-bold text-white text-sm hover:text-amber-400 transition-colors line-clamp-2 block"
                      >
                        {ch.name}
                      </button>
                    </div>

                    {/* Progress Badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isMastered
                            ? 'bg-emerald-950 border-emerald-500/60 text-emerald-300'
                            : doneCount > 0
                            ? 'bg-amber-950 border-amber-500/50 text-amber-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {doneCount}/6
                      </span>
                    </div>
                  </div>

                  {/* 6 Milestones Touch Grid (Android Touch Target Buttons) */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                    {milestoneShortLabels.map((m) => {
                      const isDone = !!prog[m.key];
                      return (
                        <button
                          key={m.key}
                          onClick={() => handleMilestoneTap(ch.id, m.key)}
                          className={`py-2 px-1 rounded-xl text-[10px] font-mono font-semibold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
                            isDone
                              ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-sm'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                          title={`Toggle ${m.label}`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center ${
                              isDone ? 'bg-emerald-400 text-slate-950' : 'border border-slate-700'
                            }`}
                          >
                            {isDone && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate w-full text-center">{m.short}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Action: Open 1-Page Summary */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-mono text-[10px]">
                      {ch.keyTopics?.slice(0, 2).join(' · ')}
                    </span>
                    <button
                      onClick={() => onOpenChapterDetail(ch)}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 active:scale-95 transition"
                    >
                      <FileText className="w-3 h-3" />
                      <span>1-Page Summary & Notes</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW MODE 2: TABLE SHEET (STRICTLY CONTAINED, NO WINDOW OVERFLOW) */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-medium">
                  <th className="py-3 px-4 min-w-[180px]">Chapter</th>
                  <th className="py-3 px-2 text-center w-16">Theory</th>
                  <th className="py-3 px-2 text-center w-20">1-Page</th>
                  <th className="py-3 px-2 text-center w-20">MathonGo</th>
                  <th className="py-3 px-2 text-center w-16">Ex-2</th>
                  <th className="py-3 px-2 text-center w-18">Eklavya</th>
                  <th className="py-3 px-2 text-center w-20">Prev PT</th>
                  <th className="py-3 px-4 text-center w-20">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredChapters.map((ch) => {
                  const prog = chapterProgress[ch.id] || {
                    theory: false,
                    conclusion1Page: false,
                    mathongo: false,
                    moduleEx2: false,
                    eklavya: false,
                    prevPartTest: false,
                  };

                  const doneCount =
                    (prog.theory ? 1 : 0) +
                    (prog.conclusion1Page ? 1 : 0) +
                    (prog.mathongo ? 1 : 0) +
                    (prog.moduleEx2 ? 1 : 0) +
                    (prog.eklavya ? 1 : 0) +
                    (prog.prevPartTest ? 1 : 0);

                  return (
                    <tr key={ch.id} className="hover:bg-slate-850/40 transition-colors">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onOpenChapterDetail(ch)}
                          className="font-semibold text-white hover:text-amber-400 text-left block text-xs"
                        >
                          {ch.name}
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">PT-{ch.introducedInTest}</span>
                      </td>

                      {milestoneShortLabels.map((m) => {
                        const isDone = !!prog[m.key];
                        return (
                          <td key={m.key} className="py-3 px-2 text-center">
                            <button
                              onClick={() => handleMilestoneTap(ch.id, m.key)}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center border transition-all active:scale-95 ${
                                isDone
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-transparent'
                              }`}
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                        {doneCount}/6
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
