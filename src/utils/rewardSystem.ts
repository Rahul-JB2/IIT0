import { MasteryReward, ActiveRewardPass } from '../types/jee';

export const REWARDS_CATALOG: MasteryReward[] = [
  {
    id: 'reward-gemini-mock',
    title: 'Gemini Mock Deep-Dive Summary',
    description: 'Unlock personalized AI forensic diagnosis of your mock tests with trap warnings & 7-day action plan.',
    costPoints: 50,
    type: 'gemini_mock_summary',
    durationMinutes: 0,
    icon: 'sparkles',
    badgeText: '✨ AI Deep-Dive',
  },
  {
    id: 'reward-pocket-fm',
    title: 'Pocket FM Story Pass (15m)',
    description: 'Listen to your favourite audiobook or audio story episode on Pocket FM guilt-free during study break.',
    costPoints: 40,
    type: 'pocket_fm',
    durationMinutes: 15,
    icon: 'headphones',
    badgeText: '🎧 15 Min Story',
  },
  {
    id: 'reward-pocket-fm-30',
    title: 'Pocket FM Extended Pass (30m)',
    description: 'Extended 30-minute immersive audio story session on Pocket FM after completing tough goals.',
    costPoints: 75,
    type: 'pocket_fm',
    durationMinutes: 30,
    icon: 'headphones',
    badgeText: '🎧 30 Min Story',
  },
  {
    id: 'reward-youtube',
    title: 'YouTube Break Pass (15m)',
    description: 'Watch video songs, educational documentaries, or fun clips on YouTube without lockdown.',
    costPoints: 50,
    type: 'youtube',
    durationMinutes: 15,
    icon: 'play',
    badgeText: '📺 15 Min YouTube',
  },
  {
    id: 'reward-gaming',
    title: 'Phone Gaming Pass (20m)',
    description: 'Unlocks phone games (BGMI, Free Fire, Chess, etc.) for a scheduled 20-minute refreshment match.',
    costPoints: 70,
    type: 'game',
    durationMinutes: 20,
    icon: 'gamepad-2',
    badgeText: '🎮 20 Min Game Time',
  },
  {
    id: 'reward-chrome',
    title: 'Google Chrome Web Pass (15m)',
    description: '15-minute unblocked research or browsing window in Chrome.',
    costPoints: 30,
    type: 'chrome',
    durationMinutes: 15,
    icon: 'globe',
    badgeText: '🌐 15 Min Web',
  },
];

/**
 * Multiplier based on current study streak
 */
export function getStreakMultiplier(streak: number = 1): number {
  if (streak >= 14) return 2.0;
  if (streak >= 7) return 1.5;
  if (streak >= 3) return 1.25;
  return 1.0;
}

/**
 * Calculates user rank level from total JEE Mastery Points
 */
export function getAspirantLevel(points: number = 0) {
  if (points >= 1000) {
    return {
      level: 5,
      title: 'JEE Advanced Grandmaster',
      badge: '👑 Level 5',
      nextThreshold: 2000,
      progressPct: Math.min(100, Math.round(((points - 1000) / 1000) * 100)),
      color: 'from-amber-400 via-orange-500 to-rose-500',
    };
  }
  if (points >= 600) {
    return {
      level: 4,
      title: 'IITian in the Making',
      badge: '🔥 Level 4',
      nextThreshold: 1000,
      progressPct: Math.round(((points - 600) / 400) * 100),
      color: 'from-purple-400 to-indigo-500',
    };
  }
  if (points >= 300) {
    return {
      level: 3,
      title: 'AIR Top 1000 Challenger',
      badge: '⚡ Level 3',
      nextThreshold: 600,
      progressPct: Math.round(((points - 300) / 300) * 100),
      color: 'from-sky-400 to-blue-500',
    };
  }
  if (points >= 100) {
    return {
      level: 2,
      title: 'Super-50 Contender',
      badge: '⚔️ Level 2',
      nextThreshold: 300,
      progressPct: Math.round(((points - 100) / 200) * 100),
      color: 'from-emerald-400 to-teal-500',
    };
  }
  return {
    level: 1,
    title: 'Foundation Aspirant',
    badge: '🌱 Level 1',
    nextThreshold: 100,
    progressPct: Math.round((points / 100) * 100),
    color: 'from-slate-400 to-slate-200',
  };
}

/**
 * Points awarded for completing a single milestone
 */
export function calculateMilestonePoints(streak: number = 1): number {
  return Math.round(25 * getStreakMultiplier(streak));
}

/**
 * Bonus points for finishing all 3 daily PCM triad goals
 */
export function calculateTriadBonus(streak: number = 1): number {
  return Math.round(100 * getStreakMultiplier(streak));
}

/**
 * Points awarded for logging mock test score
 */
export function calculateMockTestPoints(): number {
  return 150;
}

/**
 * Creates an active reward pass
 */
export function activateRewardPass(reward: MasteryReward): ActiveRewardPass {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (reward.durationMinutes || 15) * 60 * 1000);

  return {
    id: `pass-${Date.now()}`,
    rewardId: reward.id,
    title: reward.title,
    type: reward.type,
    durationMinutes: reward.durationMinutes,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    remainingSeconds: (reward.durationMinutes || 15) * 60,
    appName:
      reward.type === 'pocket_fm'
        ? 'Pocket FM'
        : reward.type === 'youtube'
        ? 'YouTube'
        : reward.type === 'game'
        ? 'Phone Games'
        : reward.type === 'chrome'
        ? 'Google Chrome'
        : 'Gemini AI',
  };
}

/**
 * Checks if a specific pass type is currently active and unexpired
 */
export function isPassActive(
  passes: ActiveRewardPass[] = [],
  passType: 'pocket_fm' | 'youtube' | 'game' | 'chrome' | 'gemini_mock_summary'
): ActiveRewardPass | null {
  const now = Date.now();
  const valid = passes.find(
    (p) => p.type === passType && new Date(p.expiresAt).getTime() > now
  );
  return valid || null;
}

/**
 * Recalculates remaining seconds for all active passes and removes expired ones
 */
export function pruneAndTickPasses(passes: ActiveRewardPass[] = []): ActiveRewardPass[] {
  const now = Date.now();
  return passes
    .map((p) => {
      const remainingMs = new Date(p.expiresAt).getTime() - now;
      const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
      return {
        ...p,
        remainingSeconds,
      };
    })
    .filter((p) => p.remainingSeconds > 0);
}
