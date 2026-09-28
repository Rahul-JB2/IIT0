import { ChapterProgress, UserStudyState } from '../types/jee';
import { ALL_CHAPTERS } from '../data/super50Data';

// Incremented version key to purge all previous dummy/mock seed data
const STORAGE_KEY = 'bseb_super50_jee_tracker_v3';

export function getDefaultInitialState(): UserStudyState {
  // Completely clean initial chapters progress map (0 milestones completed, fresh start)
  const chapterProgress: Record<string, ChapterProgress> = {};

  ALL_CHAPTERS.forEach((ch) => {
    chapterProgress[ch.id] = {
      theory: false,
      conclusion1Page: false,
      mathongo: false,
      moduleEx2: false,
      eklavya: false,
      prevPartTest: false,
      mathongoSolved: 0,
      moduleEx2Solved: 0,
      eklavyaSolved: 0,
      confidenceRating: 1,
    };
  });

  return {
    currentSimulatedDate: '2026-09-27',
    chapterProgress,
    dailyPlans: {},
    mockResults: [],
    dailyStreak: 0,
    lastActiveDate: '2026-09-27',
    studyHoursLoggedTotal: 0,
    dailyStudyHours: {},
    dailyQuestionsSolved: {},
    unlockedBadgeIds: [],
    targetDailyStudyHours: 8.0,
    masteryPoints: 0,
    activeRewardPasses: [],
    unlockedMockSummaryIds: [],
    energyProfile: {
      peakAlertSlot: 'morning',
      prioritizeHardestInPeakHours: true,
      subjectEnergy: {
        Physics: 'High',
        Chemistry: 'Medium',
        Math: 'High',
      },
    },
    quizHistory: [],
    focusLogs: [],
  };
}

export function loadUserStudyState(): UserStudyState {
  if (typeof window === 'undefined') return getDefaultInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getDefaultInitialState();
      saveUserStudyState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as UserStudyState;
    // ensure any newly added chapters are present in chapterProgress
    ALL_CHAPTERS.forEach((ch) => {
      if (!parsed.chapterProgress[ch.id]) {
        parsed.chapterProgress[ch.id] = {
          theory: false,
          conclusion1Page: false,
          mathongo: false,
          moduleEx2: false,
          eklavya: false,
          prevPartTest: false,
          mathongoSolved: 0,
          moduleEx2Solved: 0,
          eklavyaSolved: 0,
          confidenceRating: 1,
        };
      }
    });
    if (parsed.masteryPoints === undefined) {
      parsed.masteryPoints = 0;
    }
    if (!parsed.activeRewardPasses) {
      parsed.activeRewardPasses = [];
    }
    if (!parsed.unlockedMockSummaryIds) {
      parsed.unlockedMockSummaryIds = [];
    }
    if (!parsed.energyProfile) {
      parsed.energyProfile = {
        peakAlertSlot: 'morning',
        prioritizeHardestInPeakHours: true,
        subjectEnergy: {
          Physics: 'High',
          Chemistry: 'Medium',
          Math: 'High',
        },
      };
    }
    if (!parsed.targetDailyStudyHours) {
      parsed.targetDailyStudyHours = 8.0;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load study state:', err);
    return getDefaultInitialState();
  }
}

export function saveUserStudyState(state: UserStudyState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to persist study state:', err);
  }
}
