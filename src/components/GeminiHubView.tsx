import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Brain,
  Award,
  Zap,
  BookOpen,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Send,
  Mic,
  ChevronRight,
  Flame,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Target,
} from 'lucide-react';
import { ChapterProgress, MockDeepDiveAnalysis, MockTestResult, UserStudyState } from '../types/jee';
import { ALL_TESTS } from '../data/super50Data';
import { askGeminiAssistant, fetchGeminiMockDeepDive } from '../services/geminiAssistantService';

interface GeminiHubViewProps {
  studyState: UserStudyState;
  masteryPoints: number;
  onOpenAssistantModal: () => void;
  onOpenQuizModal?: () => void;
  onRedeemDeepDive?: (testId: string) => void;
  unlockedMockSummaryIds?: string[];
}

export const GeminiHubView: React.FC<GeminiHubViewProps> = ({
  studyState,
  masteryPoints,
  onOpenAssistantModal,
  onOpenQuizModal,
  onRedeemDeepDive,
  unlockedMockSummaryIds = [],
}) => {
  const [selectedTestId, setSelectedTestId] = useState<string>(
    studyState.mockResults[0]?.testId || ALL_TESTS[0].id
  );
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [deepDiveData, setDeepDiveData] = useState<MockDeepDiveAnalysis | null>(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'gemini'; text: string }>
  >([
    {
      sender: 'gemini',
      text: 'Namaste! Main tumhara Super-50 Gemini AI Mentor hoon. Kisi bhi concept ka doubt pucho, Hindi/Hinglish me bolo, ya mock test deep-dive unlock karo!',
    },
  ]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);

  // Selected test data
  const selectedMockResult = studyState.mockResults.find((m) => m.testId === selectedTestId);
  const selectedTestSchedule = ALL_TESTS.find((t) => t.id === selectedTestId);
  const isSummaryUnlocked =
    selectedTestId === 'pt-1' ||
    unlockedMockSummaryIds.includes(selectedTestId) ||
    (studyState.unlockedMockSummaryIds && studyState.unlockedMockSummaryIds.includes(selectedTestId));

  useEffect(() => {
    if (selectedTestSchedule && isSummaryUnlocked) {
      setIsLoadingDeepDive(true);
      fetchGeminiMockDeepDive(selectedTestSchedule, selectedMockResult, studyState)
        .then((data) => setDeepDiveData(data))
        .catch(console.error)
        .finally(() => setIsLoadingDeepDive(false));
    }
  }, [selectedTestId, isSummaryUnlocked, selectedMockResult]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatPrompt.trim() || isLoadingChat) return;

    const userMsg = chatPrompt.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatPrompt('');
    setIsLoadingChat(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: '📶 Internet connection required for Gemini AI features. Please connect to Wi-Fi or mobile data to chat with AI Mentor.',
        },
      ]);
      return;
    }

    try {
      const response = await askGeminiAssistant(
        userMsg,
        studyState,
        studyState.dailyPlans[studyState.currentSimulatedDate]?.goals || []
      );
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: response.reply,
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'Super-50 AI Mentor network busy hai, kripya dobara try karein ya voice modal use karein.',
        },
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-16 w-full max-w-full overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-amber-400" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold mb-1">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>SUPER-50 GEMINI AI HUB</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Personalized AI Mentor & Deep-Dive Summaries
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Gemini diagnoses your mock tests, highlights hidden conceptual traps, and answers doubts 24/7 in Hindi, English, and Hinglish.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAssistantModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              <span>Open Voice Mentor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature 1: Personalized Mock Test Deep-Dive Summaries (Redeemable with Points) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Gemini Mock Test Forensic Deep-Dive
              </h3>
              <p className="text-xs text-slate-400">
                Unlock granular forensic AI analysis of question traps, silly mistakes, and high-yield fixes.
              </p>
            </div>
          </div>

          {/* Test Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Select Mock:</span>
            <select
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {ALL_TESTS.map((t) => (
                <option key={t.id} value={t.id}>
                  Test #{t.testNumber}: {t.name} ({t.pattern})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deep-Dive Card Content */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {selectedTestSchedule?.name || 'JEE Mock Test'}
                </h4>
                {isSummaryUnlocked ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 font-bold">
                    <Lock className="w-3 h-3 text-amber-400" /> 50 JMP Required
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-amber-400">
                Scheduled: {selectedTestSchedule?.date} • {selectedTestSchedule?.pattern}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {selectedMockResult ? (
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Logged Score: {selectedMockResult.totalScore}/{selectedMockResult.maxMarks}
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Pending Attempt
                </span>
              )}
            </div>
          </div>

          {!isSummaryUnlocked ? (
            /* LOCKED REWARD CARD */
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mx-auto shadow-md shadow-amber-500/20">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  Unlock Gemini AI Mock Forensic Diagnostic
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                  Redeem 50 JEE Mastery Points to unlock syllabus error traps, 7-day day-by-day recovery roadmap, and predicted AIR rank.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs font-mono py-1">
                <span className="text-slate-400">
                  Cost: <strong className="text-amber-400">50 JMP</strong>
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">
                  Your Balance: <strong className="text-white">{masteryPoints} JMP</strong>
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (onRedeemDeepDive) {
                      onRedeemDeepDive(selectedTestId);
                    }
                  }}
                  disabled={masteryPoints < 50}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{masteryPoints >= 50 ? 'Unlock with 50 JMP' : `Need ${50 - masteryPoints} more JMP (Earn via Daily Goals)`}</span>
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED DEEP-DIVE ANALYSIS */
            <div className="space-y-4">
              {/* Predicted Rank & Health Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {deepDiveData?.overallHealth || 'Solid'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    Projected %ile: <strong className="text-emerald-400">{deepDiveData?.predictedPercentile || '98.5+ %ile'}</strong>
                  </span>
                  <span className="text-slate-400">
                    AIR Range: <strong className="text-sky-400">{deepDiveData?.predictedRankRange || 'AIR 2,500 - 5,000'}</strong>
                  </span>
                </div>
              </div>

              {/* Subject Diagnostic Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-sky-500/30 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-sky-400 font-bold block flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    Physics Diagnostic
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.physics || 'Strong in kinematics and work-energy; sign errors in rotational dynamics.'}
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-emerald-500/30 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-emerald-400 font-bold block flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    Chemistry Diagnostic
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.chemistry || 'Physical chemistry speed is good; review organic reaction intermediates and reaction conditions.'}
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-amber-500/30 p-3 rounded-xl space-y-1">
                  <span className="text-[11px] text-amber-400 font-bold block flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Math Diagnostic
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.math || 'Calculus question selection bottleneck. Focus on standard substitution and graph sketching.'}
                  </p>
                </div>
              </div>

              {/* Conceptual Traps & Actionable Fixes */}
              <div className="space-y-2 pt-1">
                <h5 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Forensic Traps & Rapid Rectifications:</span>
                </h5>

                <div className="space-y-2">
                  {(deepDiveData?.conceptualTraps || []).map((trap, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          [{trap.subject}] {trap.topic}
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono font-semibold">Trap Pattern</span>
                      </div>
                      <p className="text-slate-400">{trap.trapDescription}</p>
                      <div className="text-emerald-300 pt-1 font-medium flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Fix: {trap.recommendedFix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Day-by-Day Action Roadmap */}
              {deepDiveData?.dayWiseActionPlan && deepDiveData.dayWiseActionPlan.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <h5 className="text-xs font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>7-Day Recovery Roadmap:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {deepDiveData.dayWiseActionPlan.slice(0, 6).map((plan) => (
                      <div key={plan.day} className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-xs space-y-1">
                        <div className="flex items-center justify-between text-amber-300 font-mono font-bold text-[11px]">
                          <span>Day {plan.day}</span>
                          <span className="text-slate-400">{plan.estimatedHours}h Target</span>
                        </div>
                        <span className="font-semibold text-white block text-[11px]">{plan.title}</span>
                        <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5">
                          {plan.targetTasks.map((t, i) => (
                            <li key={i} className="truncate">{t}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature 2: Quick Gemini AI Chat & Concept Explainer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Super-50 AI Mentor Chat (Hindi / Hinglish / English)
              </h3>
              <p className="text-xs text-slate-400">
                Ask any doubt, understand tough formulas, or query your pending syllabus schedule.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 font-bold">
            Gemini 2.5 Flash Live
          </span>
        </div>

        {/* Message Thread */}
        <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-4 min-h-[180px] max-h-[280px] overflow-y-auto space-y-3">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'gemini' && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/50 flex items-center justify-center shrink-0 text-amber-400 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoadingChat && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>Gemini thinking...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Ask concept doubt: 'Explain Lenz law' or 'Mera aaj ka progress batao'..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
          <button
            type="submit"
            disabled={!chatPrompt.trim() || isLoadingChat}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>

        {/* Quick Suggested Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {[
            'Explain Vernier zero error in Hindi',
            'What are my pending milestones?',
            'Give me 3 tough questions on Electrostatics',
            'Why is COT non-aromatic?',
          ].map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setChatPrompt(prompt);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-amber-300 border border-slate-800 text-[11px] shrink-0 font-medium transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
