import React, { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquare,
  Lock,
  CheckCircle2,
  Send,
  Mic,
  AlertTriangle,
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  Clock,
  BookOpen,
  Compass,
} from 'lucide-react';
import { MockDeepDiveAnalysis, UserStudyState } from '../types/jee';
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
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'diagnostic' | 'roadmap'>('chat');
  const [selectedTestId, setSelectedTestId] = useState<string>(
    studyState.mockResults[0]?.testId || ALL_TESTS[0].id
  );
  const [chatPrompt, setChatPrompt] = useState<string>('');
  const [deepDiveData, setDeepDiveData] = useState<MockDeepDiveAnalysis | null>(null);
  const [isLoadingDeepDive, setIsLoadingDeepDive] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'gemini'; text: string; timestamp?: string }>
  >([
    {
      sender: 'gemini',
      text: 'Namaste! Main tumhara JEE Super-50 AI Mentor hoon. Kisi bhi concept ka doubt pucho (Physics, Chem, Math), Hindi ya English me bolo, ya mock test analysis explore karo.',
      timestamp: 'Just now',
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
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setChatPrompt('');
    setIsLoadingChat(true);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'Internet connection required for live Gemini AI responses. Please connect to Wi-Fi or mobile data to consult your AI Mentor.',
          timestamp: 'Offline',
        },
      ]);
      setIsLoadingChat(false);
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
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: 'AI Mentor network temporary busy hai, please thodi der me retry karein ya voice assistant mode use karein.',
          timestamp: 'Notice',
        },
      ]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const quickPrompts = [
    'Explain Lenz Law & induced EMF with examples',
    'What are my weakest physics chapters right now?',
    'Why is Cyclooctatetraene (COT) non-aromatic?',
    'Give 2 tricky calculus substitution questions',
    'Tips to reduce silly errors in JEE Main OMR',
  ];

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 w-full max-w-full overflow-hidden">
      {/* Editorial Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Super-50 AI Mentor Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Gemini Study Hub
          </h1>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Forensic mock test diagnostic, conceptual doubt resolution, and personalized 7-day recovery roadmap.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAssistantModal}
            className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            title="Open Voice Assistant dialog"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Mode</span>
          </button>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'chat'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AI Doubt Solver</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagnostic')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'diagnostic'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Mock Diagnostics</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roadmap')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeSubTab === 'roadmap'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Recovery Plan</span>
        </button>
      </div>

      {/* TAB 1: AI DOUBT SOLVER (CHAT) */}
      {activeSubTab === 'chat' && (
        <div className="space-y-3">
          {/* Chat Container */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col h-[520px]">
            {/* Quick Prompts Bar at Top */}
            <div className="pb-3 border-b border-slate-800/80 mb-3">
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                Suggested Topics & Doubts:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setChatPrompt(prompt);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border border-slate-800 text-[11px] font-medium whitespace-nowrap transition shrink-0 active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 no-scrollbar">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-500 font-mono">
                    <span>{msg.sender === 'user' ? 'You' : 'Gemini Mentor'}</span>
                    {msg.timestamp && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </div>
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoadingChat && (
                <div className="flex items-center gap-2 text-xs text-amber-400 font-mono p-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Gemini formulating step-by-step response...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800/80 mt-2 flex items-center gap-2">
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                placeholder="Ask any JEE concept, doubt, or roadmap query in English or Hindi..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
              <button
                type="submit"
                disabled={!chatPrompt.trim() || isLoadingChat}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm shrink-0 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MOCK DIAGNOSTIC (FORENSIC DEEP DIVE) */}
      {activeSubTab === 'diagnostic' && (
        <div className="space-y-4">
          {/* Test Selector Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-mono text-slate-400 block">Select Examination to Inspect</span>
              <h3 className="text-sm font-bold text-white truncate">
                {selectedTestSchedule?.name} ({selectedTestSchedule?.pattern})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {ALL_TESTS.map((t) => (
                  <option key={t.id} value={t.id}>
                    PT-{t.testNumber}: {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isSummaryUnlocked ? (
            /* Locked State Card */
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  Unlock Gemini Forensic Diagnostic
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Deep-dive into tricky trap patterns, score leakage points, and subject error diagnostics.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  Cost: <strong className="text-amber-400">50 JMP</strong>
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  Your Balance: <strong className="text-white">{masteryPoints} JMP</strong>
                </span>
              </div>

              <div>
                <button
                  onClick={() => {
                    if (onRedeemDeepDive) onRedeemDeepDive(selectedTestId);
                  }}
                  disabled={masteryPoints < 50}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition active:scale-95 disabled:opacity-40"
                >
                  {masteryPoints >= 50 ? 'Unlock Diagnostic (50 JMP)' : `Earn ${50 - masteryPoints} more JMP via Daily Goals`}
                </button>
              </div>
            </div>
          ) : (
            /* Unlocked Diagnostic Content */
            <div className="space-y-4">
              {/* Score & Projection Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-mono block">Syllabus Health</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {deepDiveData?.overallHealth || 'Exam Ready'}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-mono block">Projected %ile</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {deepDiveData?.predictedPercentile || '98.5+ %ile'}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-mono block">Projected AIR Rank</span>
                  <span className="text-lg font-bold text-sky-400 font-mono">
                    {deepDiveData?.predictedRankRange || 'AIR 2,500 - 5,000'}
                  </span>
                </div>
              </div>

              {/* Subject Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                    <Target className="w-3.5 h-3.5" />
                    <span>Physics Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.physics || 'Good grasp of Kinematics and Energy conservation. Watch out for torque sign conventions.'}
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <Brain className="w-3.5 h-3.5" />
                    <span>Chemistry Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.chemistry || 'Physical chemistry numerical accuracy is on target. Review coordination isomerism rules.'}
                  </p>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Mathematics Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {deepDiveData?.scoreAnalysis.math || 'Calculus problem selection speed bottleneck. Practice definite integral substitution short-cuts.'}
                  </p>
                </div>
              </div>

              {/* Conceptual Traps & Fixes */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Identified Conceptual Traps & Recommendations</span>
                </div>

                <div className="space-y-2.5">
                  {(deepDiveData?.conceptualTraps || [
                    {
                      subject: 'Physics',
                      topic: 'Rotational Equilibrium',
                      trapDescription: 'Misidentifying the pivot point leading to incorrect torque signs.',
                      recommendedFix: 'Always pick the unknown hinge reaction point as your reference axis to eliminate two unknowns.',
                    },
                    {
                      subject: 'Chemistry',
                      topic: 'Thermodynamics',
                      trapDescription: 'Confusing reversible vs irreversible work formulae in adiabatic processes.',
                      recommendedFix: 'Reversible uses P-V gamma relation; irreversible strictly uses W = -Pext(V2 - V1).',
                    },
                  ]).map((trap, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          [{trap.subject}] {trap.topic}
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono font-semibold">Trap Pattern</span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{trap.trapDescription}</p>
                      <div className="text-emerald-300 font-medium flex items-start gap-1.5 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Recommended Fix: {trap.recommendedFix}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 7-DAY RECOVERY ROADMAP */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-2">
              <Calendar className="w-4 h-4" />
              <span>Structured 7-Day Recovery Plan</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Day-by-day remediation protocol tailored to fix mock test mistakes before your next exam.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(
                deepDiveData?.dayWiseActionPlan || [
                  { day: 1, title: 'Formula Diagnostic & Sign Errors', estimatedHours: 2.5, targetTasks: ['Review rot dyn notes', 'Solve 15 torque problems', 'Verify 1-Page conclusion'] },
                  { day: 2, title: 'Inorganic Exception Drills', estimatedHours: 3.0, targetTasks: ['NCERT coordination tables', 'Crystal field splitting PYQs', 'Color & magnetic moments'] },
                  { day: 3, title: 'Calculus Definite Integral Blitz', estimatedHours: 3.5, targetTasks: ['Leibniz rule 10 questions', 'King property symmetry', 'Area under curves'] },
                  { day: 4, title: 'Physical Chem Numerical Accuracy', estimatedHours: 2.5, targetTasks: ['Electrochem Nernst eq', 'Kinetics pseudo 1st order', 'No calculator timing drill'] },
                  { day: 5, title: 'Timed 1-Hour Sectional Drill', estimatedHours: 3.0, targetTasks: ['Math 25 questions in 60m', 'OMR bubbling practice', 'Triage & question skip drill'] },
                  { day: 6, title: 'Mock Test Paper Mistake Retake', estimatedHours: 3.0, targetTasks: ['Re-attempt incorrect questions', 'Write blunder log', 'Check memory gaps'] },
                  { day: 7, title: 'Pre-Test Rapid Recall', estimatedHours: 2.0, targetTasks: ['Formula flash sheets', 'Sleep schedule regulation', 'OMR stationery check'] },
                ]
              ).map((day) => (
                <div key={day.day} className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between font-mono font-bold text-amber-400 text-xs pb-1 border-b border-slate-800">
                      <span>Day {day.day}</span>
                      <span className="text-slate-400 text-[10px]">{day.estimatedHours}h target</span>
                    </div>
                    <span className="font-semibold text-white block mt-1.5">{day.title}</span>
                  </div>

                  <ul className="space-y-1 text-[11px] text-slate-400 pt-1">
                    {day.targetTasks.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0 mt-1.5" />
                        <span className="leading-snug">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
