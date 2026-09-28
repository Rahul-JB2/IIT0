import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  Chapter,
  ChapterProgress,
  DailyPlan,
  MilestoneKey,
  MockTestResult,
  TestSchedule,
  UserStudyState,
  SubjectType,
  FocusSessionLog,
  UserEnergyProfile,
} from './types/jee';
import { ALL_CHAPTERS, ALL_TESTS } from './data/super50Data';
import { getDefaultInitialState, loadUserStudyState, saveUserStudyState } from './utils/storage';
import { generateDailyPCMPlan, getUpcomingTest } from './utils/goalGenerator';
import { checkTheorySummaryViolations } from './utils/punishmentSystem';
import {
  auth,
  testConnection,
  saveChapterProgress,
  getAllChapterProgress,
  saveDailyPlan,
  getAllDailyPlans,
  saveMockTestResult,
  deleteMockTestResult,
  getAllMockResults,
  saveUserProfile,
} from './services/firebase';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { NextTestBanner } from './components/NextTestBanner';
import { DailyPCMGoals } from './components/DailyPCMGoals';
import { ChapterMatrix } from './components/ChapterMatrix';
import { ChapterDetailModal } from './components/ChapterDetailModal';
import { TestPlannerView } from './components/TestPlannerView';
import { TestScoreTracker } from './components/TestScoreTracker';
import { OneDayBeforeTestMode } from './components/OneDayBeforeTestMode';
import { StrategyCoach } from './components/StrategyCoach';
import { ProfileView } from './components/ProfileView';
import { RegainStudyGuard } from './components/RegainStudyGuard';
import { GeminiAssistantModal } from './components/GeminiAssistantModal';
import { GeminiHubView } from './components/GeminiHubView';
import { RewardStoreModal } from './components/RewardStoreModal';
import { AndroidBlockOverlayModal } from './components/AndroidBlockOverlayModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AndroidSplashScreen } from './components/AndroidSplashScreen';
import { BlockedAppConfig, MasteryReward } from './types/jee';
import {
  activateRewardPass,
  calculateMilestonePoints,
  calculateTriadBonus,
  calculateMockTestPoints,
} from './utils/rewardSystem';
import { attemptLaunchOrIntercept } from './utils/androidPermissions';
import { playChimeSound } from './utils/audioAlert';
import { Sparkles, Bot } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<UserStudyState>(() => loadUserStudyState());
  const [activeTab, setActiveTab] = useState<string>('daily-goals');
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Android Native App Splash Screen & Frame State
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !sessionStorage.getItem('super50_splash_shown');
  });
  const [appFrameMode, setAppFrameMode] = useState<'mobile' | 'expanded'>(() => {
    return (localStorage.getItem('super50_app_frame_mode') as 'mobile' | 'expanded') || 'mobile';
  });
  
  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Chapter detail modal state
  const [selectedChapterForModal, setSelectedChapterForModal] = useState<Chapter | null>(null);

  // Preselected test for logger modal or matrix filter
  const [highlightTestNumber, setHighlightTestNumber] = useState<number | undefined>(undefined);
  const [preselectedTestForScore, setPreselectedTestForScore] = useState<TestSchedule | null>(null);

  // Rewards Store & Android App Blocker Overlay Modals
  const [isRewardStoreOpen, setIsRewardStoreOpen] = useState<boolean>(false);
  const [blockedAppForModal, setBlockedAppForModal] = useState<BlockedAppConfig | null>(null);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState<boolean>(false);

  // Active Reward Passes Ticking Timer (Counts down second-by-second)
  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        if (!prev.activeRewardPasses || prev.activeRewardPasses.length === 0) return prev;
        const now = Date.now();
        let anyExpired = false;

        const updated = prev.activeRewardPasses
          .map((pass) => {
            const remMs = new Date(pass.expiresAt).getTime() - now;
            const remainingSeconds = Math.max(0, Math.floor(remMs / 1000));
            if (remainingSeconds === 0 && pass.remainingSeconds > 0) {
              anyExpired = true;
            }
            return {
              ...pass,
              remainingSeconds,
            };
          })
          .filter((p) => p.remainingSeconds > 0);

        if (anyExpired) {
          playChimeSound();
        }

        if (updated.length !== prev.activeRewardPasses.length) {
          return {
            ...prev,
            activeRewardPasses: updated,
          };
        }
        return {
          ...prev,
          activeRewardPasses: updated,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check 1-Page Summary deadline violations for Punishment Lockdown System
  const overdueViolations = useMemo(
    () => checkTheorySummaryViolations(state.chapterProgress, state.currentSimulatedDate),
    [state.chapterProgress, state.currentSimulatedDate]
  );

  // Test Firebase connection on mount as specified by SKILL.md
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load cloud data from Firestore
        await pullFromFirestore(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Pull all data from Firestore into local state
  const pullFromFirestore = async (userId: string) => {
    setIsSyncing(true);
    try {
      const [cloudChapters, cloudPlans, cloudMocks] = await Promise.all([
        getAllChapterProgress(userId),
        getAllDailyPlans(userId),
        getAllMockResults(userId),
      ]);

      setState((prev) => {
        const mergedChapters = { ...prev.chapterProgress };
        // Merge cloud chapters
        Object.entries(cloudChapters).forEach(([chId, prog]) => {
          mergedChapters[chId] = {
            ...(mergedChapters[chId] || {}),
            ...prog,
          };
        });

        const mergedPlans = { ...prev.dailyPlans, ...cloudPlans };
        const mergedMocks = cloudMocks.length > 0 ? cloudMocks : prev.mockResults;

        const newState: UserStudyState = {
          ...prev,
          chapterProgress: mergedChapters,
          dailyPlans: mergedPlans,
          mockResults: mergedMocks,
        };

        saveUserStudyState(newState);
        return newState;
      });

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Could not sync from Firestore, keeping local state:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Push local state to Firestore
  const pushToFirestore = useCallback(async (userId: string, targetState: UserStudyState) => {
    setIsSyncing(true);
    try {
      // Sync all modified chapters
      const chapterPromises = Object.entries(targetState.chapterProgress).map(([chId, prog]) =>
        saveChapterProgress(userId, chId, prog)
      );

      // Sync active daily plan
      const today = targetState.currentSimulatedDate;
      const todayPlan = targetState.dailyPlans[today];
      const planPromise = todayPlan ? saveDailyPlan(userId, todayPlan) : Promise.resolve();

      // Sync user profile stats
      const userProfilePromise = saveUserProfile(userId, {
        dailyStreak: targetState.dailyStreak,
        totalStudyHours: targetState.studyHoursLoggedTotal,
      });

      await Promise.all([...chapterPromises, planPromise, userProfilePromise]);

      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.warn('Failed to push to Firestore:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Persist state updates to localStorage whenever state changes
  useEffect(() => {
    saveUserStudyState(state);
  }, [state]);

  // Ensure current date's plan exists
  const currentPlan = useMemo(() => {
    const today = state.currentSimulatedDate;
    if (state.dailyPlans[today]) {
      return state.dailyPlans[today];
    }
    return generateDailyPCMPlan(state, today);
  }, [state.currentSimulatedDate, state.dailyPlans, state.chapterProgress, state.mockResults]);

  // Sync plan if not yet in state
  useEffect(() => {
    const today = state.currentSimulatedDate;
    if (!state.dailyPlans[today]) {
      setState((prev) => ({
        ...prev,
        dailyPlans: {
          ...prev.dailyPlans,
          [today]: currentPlan,
        },
      }));
    }
  }, [currentPlan, state.currentSimulatedDate, state.dailyPlans]);

  // Handler: toggle milestone in both chapterProgress and daily plan
  const handleToggleMilestone = (chapterId: string, milestoneKey: MilestoneKey, explicitStatus?: boolean) => {
    setState((prev) => {
      const currentVal = !!prev.chapterProgress[chapterId]?.[milestoneKey];
      const newVal = explicitStatus !== undefined ? explicitStatus : !currentVal;

      let pointsEarned = 0;
      if (newVal) {
        pointsEarned += calculateMilestonePoints(prev.dailyStreak);
      }

      const updatedChapterProg = {
        ...(prev.chapterProgress[chapterId] || {
          theory: false,
          conclusion1Page: false,
          mathongo: false,
          moduleEx2: false,
          eklavya: false,
          prevPartTest: false,
        }),
        [milestoneKey]: newVal,
        ...(milestoneKey === 'theory' && newVal ? { theoryCompletedDate: prev.currentSimulatedDate } : {}),
        ...(milestoneKey === 'conclusion1Page' && newVal ? { conclusion1PageCompletedDate: prev.currentSimulatedDate } : {}),
        lastUpdated: new Date().toISOString(),
      };

      const updatedProgress = {
        ...prev.chapterProgress,
        [chapterId]: updatedChapterProg,
      };

      // Also update daily plan goal item if it exists
      const today = prev.currentSimulatedDate;
      const todayPlan = prev.dailyPlans[today];
      let updatedDailyPlans = prev.dailyPlans;

      if (todayPlan) {
        const updatedGoals = todayPlan.goals.map((g) => {
          if (g.chapterId === chapterId && g.milestoneKey === milestoneKey) {
            return {
              ...g,
              completed: newVal,
              completedAt: newVal ? new Date().toISOString() : undefined,
            };
          }
          return g;
        });

        // Check if all 3 goals are now completed for triad bonus
        const doneCount = updatedGoals.filter((g) => g.completed).length;
        if (newVal && doneCount === 3) {
          pointsEarned += calculateTriadBonus(prev.dailyStreak);
        }

        const newTodayPlan = {
          ...todayPlan,
          goals: updatedGoals,
          totalStudyMinutes: updatedGoals.reduce((acc, g) => acc + (g.completed ? g.targetMinutes : 0), 0),
        };

        updatedDailyPlans = {
          ...prev.dailyPlans,
          [today]: newTodayPlan,
        };

        // Push to Firebase if user is logged in
        if (currentUser) {
          saveDailyPlan(currentUser.uid, newTodayPlan).catch(console.error);
        }
      }

      // Push chapter to Firebase if user is logged in
      if (currentUser) {
        saveChapterProgress(currentUser.uid, chapterId, updatedChapterProg).catch(console.error);
      }

      return {
        ...prev,
        masteryPoints: (prev.masteryPoints ?? 180) + pointsEarned,
        chapterProgress: updatedProgress,
        dailyPlans: updatedDailyPlans,
      };
    });
  };

  // Reward Store redemption
  const handleRedeemReward = (reward: MasteryReward) => {
    setState((prev) => {
      const currentPts = prev.masteryPoints ?? 180;
      if (currentPts < reward.costPoints) return prev;

      const newPts = currentPts - reward.costPoints;

      if (reward.type === 'gemini_mock_summary') {
        const nextUnlocked = Array.from(new Set([...(prev.unlockedMockSummaryIds || ['pt-1']), 'pt-1', 'pt-2']));
        return {
          ...prev,
          masteryPoints: newPts,
          unlockedMockSummaryIds: nextUnlocked,
        };
      }

      const newPass = activateRewardPass(reward);
      const activePasses = [newPass, ...(prev.activeRewardPasses || [])];

      return {
        ...prev,
        masteryPoints: newPts,
        activeRewardPasses: activePasses,
      };
    });
  };

  // Unlock deep-dive for a specific test with 50 JMP
  const handleRedeemDeepDiveForTest = (testId: string) => {
    setState((prev) => {
      const currentPts = prev.masteryPoints ?? 180;
      if (currentPts < 50) return prev;

      const newPts = currentPts - 50;
      const nextUnlocked = Array.from(new Set([...(prev.unlockedMockSummaryIds || ['pt-1']), testId]));

      return {
        ...prev,
        masteryPoints: newPts,
        unlockedMockSummaryIds: nextUnlocked,
      };
    });
  };

  // Simulate restricted app launch or intercept with Study Guard overlay
  const handleSimulateAppLaunch = (app: BlockedAppConfig) => {
    attemptLaunchOrIntercept(app, state.activeRewardPasses || [], (blockedApp) => {
      setBlockedAppForModal(blockedApp);
      setIsBlockModalOpen(true);
    });
  };

  // Toggle Android system permissions
  const handleToggleAndroidPermission = (permId: string, granted: boolean) => {
    setState((prev) => ({
      ...prev,
      androidPermissions: {
        ...(prev.androidPermissions || {
          usage_stats: true,
          overlay: true,
          accessibility: true,
          query_packages: true,
          exact_alarm: true,
          notifications: true,
          dnd_policy: true,
          battery_opt: true,
        }),
        [permId]: granted,
      },
    }));
  };

  // Handler: Regenerate today's PCM plan
  const handleRegeneratePlan = () => {
    const freshPlan = generateDailyPCMPlan(state, state.currentSimulatedDate);
    setState((prev) => ({
      ...prev,
      dailyPlans: {
        ...prev.dailyPlans,
        [state.currentSimulatedDate]: freshPlan,
      },
    }));

    if (currentUser) {
      saveDailyPlan(currentUser.uid, freshPlan).catch(console.error);
    }
  };

  // Handler: Swap chapter in daily goal
  const handleSwapChapter = (goalId: string, newChapterId: string) => {
    const newChapter = ALL_CHAPTERS.find((c) => c.id === newChapterId);
    if (!newChapter) return;

    setState((prev) => {
      const today = prev.currentSimulatedDate;
      const curPlan = prev.dailyPlans[today];
      if (!curPlan) return prev;

      const updatedGoals = curPlan.goals.map((g) => {
        if (g.id === goalId) {
          const isDone = !!prev.chapterProgress[newChapter.id]?.[g.milestoneKey];
          return {
            ...g,
            chapterId: newChapter.id,
            chapterName: newChapter.name,
            chemBranch: newChapter.chemBranch,
            milestoneTitle: `${g.milestoneKey} - ${newChapter.name}`,
            completed: isDone,
          };
        }
        return g;
      });

      const updatedPlan = {
        ...curPlan,
        goals: updatedGoals,
      };

      if (currentUser) {
        saveDailyPlan(currentUser.uid, updatedPlan).catch(console.error);
      }

      return {
        ...prev,
        dailyPlans: {
          ...prev.dailyPlans,
          [today]: updatedPlan,
        },
      };
    });
  };

  // Handler: Change milestone in daily goal
  const handleChangeMilestone = (goalId: string, newMilestoneKey: MilestoneKey) => {
    setState((prev) => {
      const today = prev.currentSimulatedDate;
      const curPlan = prev.dailyPlans[today];
      if (!curPlan) return prev;

      const updatedGoals = curPlan.goals.map((g) => {
        if (g.id === goalId) {
          const isDone = !!prev.chapterProgress[g.chapterId]?.[newMilestoneKey];
          return {
            ...g,
            milestoneKey: newMilestoneKey,
            milestoneTitle: `${newMilestoneKey} - ${g.chapterName}`,
            completed: isDone,
          };
        }
        return g;
      });

      const updatedPlan = {
        ...curPlan,
        goals: updatedGoals,
      };

      if (currentUser) {
        saveDailyPlan(currentUser.uid, updatedPlan).catch(console.error);
      }

      return {
        ...prev,
        dailyPlans: {
          ...prev.dailyPlans,
          [today]: updatedPlan,
        },
      };
    });
  };

  // Handler: Update energy profile & alert hours prioritization
  const handleUpdateEnergyProfile = (newProfile: UserEnergyProfile) => {
    setState((prev) => {
      const updatedState = {
        ...prev,
        energyProfile: newProfile,
      };
      // Regenerate today's plan with new energy settings and hardest chapter prioritization
      const today = prev.currentSimulatedDate;
      const newPlan = generateDailyPCMPlan(updatedState, today);
      const updatedWithPlan = {
        ...updatedState,
        dailyPlans: {
          ...prev.dailyPlans,
          [today]: newPlan,
        },
      };

      if (currentUser) {
        saveDailyPlan(currentUser.uid, newPlan).catch(console.error);
      }

      return updatedWithPlan;
    });
  };

  // Handler: Log study minutes
  const handleLogStudyMinutes = (mins: number) => {
    if (mins <= 0) return;
    setState((prev) => {
      const newTotal = prev.studyHoursLoggedTotal + mins / 60;
      const today = prev.currentSimulatedDate;
      const prevHoursToday = prev.dailyStudyHours?.[today] ?? 0;
      const updatedHoursToday = Number((prevHoursToday + mins / 60).toFixed(2));
      const hoursPoints = Math.round((mins / 60) * 20);

      if (currentUser) {
        saveUserProfile(currentUser.uid, { totalStudyHours: newTotal }).catch(console.error);
      }
      return {
        ...prev,
        masteryPoints: (prev.masteryPoints ?? 180) + hoursPoints,
        studyHoursLoggedTotal: newTotal,
        dailyStudyHours: {
          ...(prev.dailyStudyHours || {}),
          [today]: updatedHoursToday,
        },
      };
    });
  };

  // Handler: Update daily hours directly
  const handleUpdateDailyHours = (newHours: number) => {
    setState((prev) => {
      const today = prev.currentSimulatedDate;
      const prevHoursForToday = prev.dailyStudyHours?.[today] ?? 0;
      const hourDiff = newHours - prevHoursForToday;
      const newTotal = Math.max(0, Number((prev.studyHoursLoggedTotal + hourDiff).toFixed(2)));

      if (currentUser) {
        saveUserProfile(currentUser.uid, { totalStudyHours: newTotal }).catch(console.error);
      }

      return {
        ...prev,
        studyHoursLoggedTotal: newTotal,
        dailyStudyHours: {
          ...(prev.dailyStudyHours || {}),
          [today]: newHours,
        },
      };
    });
  };

  // Handler: Update customizable target daily study hours (total time must be completed)
  const handleUpdateTargetDailyHours = (newTarget: number) => {
    setState((prev) => {
      const updated = {
        ...prev,
        targetDailyStudyHours: Math.max(1, Math.min(18, newTarget)),
      };
      saveUserStudyState(updated);
      return updated;
    });
  };

  // Handler: Add practice questions count
  const handleAddQuestions = (subject: SubjectType, count: number) => {
    setState((prev) => {
      const today = prev.currentSimulatedDate;
      const currentLog = prev.dailyQuestionsSolved?.[today] ?? { total: 0, physics: 0, chemistry: 0, math: 0 };
      const updatedLog = {
        ...currentLog,
        total: currentLog.total + count,
        physics: currentLog.physics + (subject === 'Physics' ? count : 0),
        chemistry: currentLog.chemistry + (subject === 'Chemistry' ? count : 0),
        math: currentLog.math + (subject === 'Math' ? count : 0),
      };
      const quesPoints = Math.max(1, Math.floor(count / 2));

      return {
        ...prev,
        masteryPoints: (prev.masteryPoints ?? 180) + quesPoints,
        dailyQuestionsSolved: {
          ...(prev.dailyQuestionsSolved || {}),
          [today]: updatedLog,
        },
      };
    });
  };

  // Handler: Save chapter modal updates
  const handleSaveChapterProgress = (chapterId: string, updates: Partial<ChapterProgress>) => {
    setState((prev) => {
      const updatedChapterProg = {
        ...(prev.chapterProgress[chapterId] || {
          theory: false,
          conclusion1Page: false,
          mathongo: false,
          moduleEx2: false,
          eklavya: false,
          prevPartTest: false,
        }),
        ...updates,
      };

      if (currentUser) {
        saveChapterProgress(currentUser.uid, chapterId, updatedChapterProg).catch(console.error);
      }

      return {
        ...prev,
        chapterProgress: {
          ...prev.chapterProgress,
          [chapterId]: updatedChapterProg,
        },
      };
    });
  };

  // Handler: Log mock test result
  const handleSaveMockResult = (result: MockTestResult) => {
    setState((prev) => ({
      ...prev,
      masteryPoints: (prev.masteryPoints ?? 180) + calculateMockTestPoints(),
      mockResults: [result, ...prev.mockResults],
    }));

    if (currentUser) {
      saveMockTestResult(currentUser.uid, result).catch(console.error);
    }
  };

  // Handler: Delete mock test result
  const handleDeleteMockResult = (id: string) => {
    setState((prev) => ({
      ...prev,
      mockResults: prev.mockResults.filter((r) => r.id !== id),
    }));

    if (currentUser) {
      deleteMockTestResult(currentUser.uid, id).catch(console.error);
    }
  };

  // Manual Cloud Sync trigger
  const handleManualSync = async () => {
    if (currentUser) {
      await pushToFirestore(currentUser.uid, state);
      await pullFromFirestore(currentUser.uid);
    }
  };

  // Reset to default seed
  const handleResetData = () => {
    if (window.confirm('Reset all JEE Super-50 preparation data back to initial template?')) {
      const initial = getDefaultInitialState();
      setState(initial);
      saveUserStudyState(initial);
      if (currentUser) {
        pushToFirestore(currentUser.uid, initial);
      }
    }
  };

  // Handler: Add focus session log
  const handleAddFocusLog = (log: FocusSessionLog) => {
    setState((prev) => ({
      ...prev,
      focusLogs: [log, ...(prev.focusLogs || [])],
    }));
  };

  // Next upcoming test
  const upcomingTestInfo = getUpcomingTest(state.currentSimulatedDate);
  const nextTest = upcomingTestInfo?.test || ALL_TESTS[0];
  const isOneDayBeforeTest = upcomingTestInfo?.daysRemaining === 1 || upcomingTestInfo?.daysRemaining === 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200 overflow-x-hidden">
      
      {/* Android 14/15 App Launch Splash Screen */}
      {showSplash && (
        <AndroidSplashScreen
          minDurationMs={850}
          onFinish={() => {
            setShowSplash(false);
            sessionStorage.setItem('super50_splash_shown', 'true');
          }}
        />
      )}

      {/* Android Device Shell Container */}
      <div
        className={`w-full min-h-screen flex flex-col transition-all duration-300 relative overflow-x-hidden ${
          appFrameMode === 'mobile'
            ? 'max-w-md sm:max-w-xl mx-auto shadow-2xl shadow-black border-x border-slate-900 bg-slate-950'
            : 'max-w-7xl mx-auto bg-slate-950'
        }`}
      >
        {/* Top Header / Material App Bar */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentDate={state.currentSimulatedDate}
          setCurrentDate={(d) => setState((prev) => ({ ...prev, currentSimulatedDate: d }))}
          streak={state.dailyStreak}
          totalStudyHours={state.studyHoursLoggedTotal}
          onReset={handleResetData}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          masteryPoints={state.masteryPoints ?? 180}
        />

        {/* Desktop View Switcher Pill (Discreet toggle on larger screens) */}
        <div className="hidden sm:flex items-center justify-between px-4 py-1 bg-slate-900/40 border-b border-slate-800/60 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Android SDK Runtime • BSEB 2025-27
          </span>
          <button
            onClick={() => {
              const next = appFrameMode === 'mobile' ? 'expanded' : 'mobile';
              setAppFrameMode(next);
              localStorage.setItem('super50_app_frame_mode', next);
            }}
            className="hover:text-amber-300 transition underline underline-offset-2 flex items-center gap-1"
          >
            {appFrameMode === 'mobile' ? '🖥️ Wide View' : '📱 Android Phone View'}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-3 sm:px-4 py-3 sm:py-4 overflow-x-hidden">
        
        {/* Next Imminent Test Countdown & Syllabus Banner */}
        <NextTestBanner
          test={nextTest}
          currentDate={state.currentSimulatedDate}
          chapterProgress={state.chapterProgress}
          onOpenPreTestDrill={() => setActiveTab('pre-test-mode')}
          onOpenTestPlanner={() => setActiveTab('test-planner')}
        />

        {/* Tab 1: Today's Auto-Generated PCM Goals (Home) */}
        {activeTab === 'daily-goals' && (
          <DailyPCMGoals
            plan={currentPlan}
            currentDate={state.currentSimulatedDate}
            chapterProgress={state.chapterProgress}
            onToggleGoalMilestone={(chId, mKey, status) => handleToggleMilestone(chId, mKey, status)}
            onRegeneratePlan={handleRegeneratePlan}
            onSwapChapter={handleSwapChapter}
            onChangeMilestone={handleChangeMilestone}
            onLogStudyMinutes={handleLogStudyMinutes}
            focusLogs={state.focusLogs || []}
            onAddFocusLog={handleAddFocusLog}
            onNavigateTab={setActiveTab}
            onOpenChapterModal={(ch) => setSelectedChapterForModal(ch)}
            dailyHoursToday={state.dailyStudyHours?.[state.currentSimulatedDate] ?? 6.5}
            onUpdateDailyHours={handleUpdateDailyHours}
            targetDailyHours={state.targetDailyStudyHours ?? 8.0}
            onUpdateTargetDailyHours={handleUpdateTargetDailyHours}
            dailyQuestions={
              state.dailyQuestionsSolved?.[state.currentSimulatedDate] ?? {
                total: 72,
                physics: 28,
                chemistry: 24,
                math: 20,
              }
            }
            onAddQuestions={handleAddQuestions}
            overdueViolations={overdueViolations}
            energyProfile={state.energyProfile}
            onUpdateEnergyProfile={handleUpdateEnergyProfile}
            streak={state.dailyStreak}
            masteryPoints={state.masteryPoints ?? 180}
            activeRewardPasses={state.activeRewardPasses || []}
            onOpenRewardStore={() => setIsRewardStoreOpen(true)}
            onSimulateAppLaunch={handleSimulateAppLaunch}
          />
        )}

        {/* Tab 2: BSEB Super-50 Test Series Planner */}
        {activeTab === 'test-planner' && (
          <TestPlannerView
            currentDate={state.currentSimulatedDate}
            chapterProgress={state.chapterProgress}
            onSelectTestForMatrix={(testNum) => {
              setHighlightTestNumber(testNum);
              setActiveTab('chapter-matrix');
            }}
            onOpenScoreLogger={(test) => {
              setPreselectedTestForScore(test);
              setActiveTab('test-scores');
            }}
          />
        )}

        {/* Tab 3: Gemini AI Super-50 Hub & Forensic Deep-Dive (Redeemable with Points) */}
        {activeTab === 'gemini-hub' && (
          <GeminiHubView
            studyState={state}
            masteryPoints={state.masteryPoints ?? 180}
            onOpenAssistantModal={() => setIsAssistantOpen(true)}
            onRedeemDeepDive={handleRedeemDeepDiveForTest}
            unlockedMockSummaryIds={state.unlockedMockSummaryIds || ['pt-1']}
          />
        )}

        {/* Tab 4: Mock Test Analytics, 7-Day Trends & Mistake Log */}
        {activeTab === 'test-scores' && (
          <TestScoreTracker
            mockResults={state.mockResults}
            chapterProgress={state.chapterProgress}
            onSaveResult={handleSaveMockResult}
            onDeleteResult={handleDeleteMockResult}
            preselectedTest={preselectedTestForScore}
            onSelectChapter={(ch) => setSelectedChapterForModal(ch)}
            onToggleMilestone={(chId, mKey) => handleToggleMilestone(chId, mKey)}
            currentDate={state.currentSimulatedDate}
            dailyPlans={state.dailyPlans}
            focusLogs={state.focusLogs || []}
            totalStudyHoursLogged={state.studyHoursLoggedTotal}
          />
        )}

        {/* Tab 5: Profile, Rewards Game Center, Android Blocker & Cloud Sync */}
        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            studyState={state}
            onUpdateStudyState={(newState) => setState((prev) => ({ ...prev, ...newState }))}
            onManualSync={handleManualSync}
            isSyncing={isSyncing}
            lastSyncTime={lastSyncTime}
            onNavigateTab={setActiveTab}
            onOpenRewardStore={() => setIsRewardStoreOpen(true)}
            onToggleAndroidPermission={handleToggleAndroidPermission}
            onSimulateAppLaunch={handleSimulateAppLaunch}
          />
        )}

        {/* Sub-view: Chapter Matrix (6 Milestones) */}
        {activeTab === 'chapter-matrix' && (
          <ChapterMatrix
            chapterProgress={state.chapterProgress}
            onToggleMilestone={(chId, mKey) => handleToggleMilestone(chId, mKey)}
            onOpenChapterDetail={(ch) => setSelectedChapterForModal(ch)}
            highlightTestNumber={highlightTestNumber}
          />
        )}

        {/* Sub-view: Pre-Test Rapid Drill (1-Day-Before-Test Blitz) */}
        {activeTab === 'pre-test-mode' && (
          <OneDayBeforeTestMode
            currentDate={state.currentSimulatedDate}
            chapterProgress={state.chapterProgress}
            onToggleMilestone={(chId, mKey) => handleToggleMilestone(chId, mKey)}
            onOpenChapterModal={(ch) => setSelectedChapterForModal(ch)}
          />
        )}

        {/* Sub-view: Regain Digital Detox & Study Guard */}
        {activeTab === 'study-guard' && (
          <RegainStudyGuard
            overdueViolations={overdueViolations}
            onOpenSummaryModal={(ch) => setSelectedChapterForModal(ch)}
          />
        )}

        {/* Sub-view: Strategy, 7-Day Trend Chart & Suggestions */}
        {activeTab === 'strategy' && (
          <StrategyCoach
            currentDate={state.currentSimulatedDate}
            chapterProgress={state.chapterProgress}
            mockResults={state.mockResults}
            dailyPlans={state.dailyPlans}
          />
        )}
      </main>

      {/* Chapter Detail & 1-Page Summary Modal */}
      {selectedChapterForModal && (
        <ChapterDetailModal
          chapter={selectedChapterForModal}
          progress={state.chapterProgress[selectedChapterForModal.id]}
          onClose={() => setSelectedChapterForModal(null)}
          onSaveProgress={handleSaveChapterProgress}
          onToggleMilestone={(chId, mKey) => handleToggleMilestone(chId, mKey)}
        />
      )}

      {/* Floating Bottom Navigation Tab Bar for Real Mobile & Web Daily Usage */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isPreTestActive={isOneDayBeforeTest}
        userEmail={currentUser?.email}
        userPhoto={currentUser?.photoURL}
        isCloudSynced={!!currentUser}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Floating Gemini Voice & Progress Assistant Trigger (Always Persistent) */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-50 bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-400 p-[2px] rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all group"
        title="Open Gemini Voice & Text Assistant (Auto-mark progress & check pending tasks)"
      >
        <div className="bg-slate-950 hover:bg-slate-900 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2 text-white transition-colors border border-amber-400/30">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold tracking-tight bg-gradient-to-r from-amber-300 via-white to-sky-300 bg-clip-text text-transparent">
            Gemini AI
          </span>
        </div>
      </button>

      {/* Google Gemini Super-50 Voice & Progress Assistant Modal */}
      <GeminiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        studyState={state}
        todayGoals={currentPlan.goals}
        overdueViolations={overdueViolations}
        onToggleMilestone={(chId, mKey, status) => handleToggleMilestone(chId, mKey, status)}
        onLogStudyMinutes={handleLogStudyMinutes}
        onAddQuestions={handleAddQuestions}
        onActivatePunishment={(active, reason) => {
          setState((prev) => ({
            ...prev,
            punishmentLockdown: {
              active,
              reason,
              triggeredDate: prev.currentSimulatedDate,
            },
          }));
        }}
      />

      {/* JEE Mastery Points Game Rewards Store Modal */}
      <RewardStoreModal
        isOpen={isRewardStoreOpen}
        onClose={() => setIsRewardStoreOpen(false)}
        masteryPoints={state.masteryPoints ?? 180}
        streak={state.dailyStreak}
        activePasses={state.activeRewardPasses || []}
        onRedeemReward={handleRedeemReward}
        onOpenGeminiSummary={() => setActiveTab('gemini-hub')}
      />

      {/* Android Native Study Guard App Intercept Lock Screen Overlay */}
      <AndroidBlockOverlayModal
        app={blockedAppForModal}
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        masteryPoints={state.masteryPoints ?? 180}
        onOpenRewardStore={() => setIsRewardStoreOpen(true)}
        onReturnToStudy={() => {
          setActiveTab('daily-goals');
          setIsBlockModalOpen(false);
        }}
      />

        {/* Offline Connectivity Notification */}
        <OfflineIndicator />
      </div>
    </div>
  );
};
