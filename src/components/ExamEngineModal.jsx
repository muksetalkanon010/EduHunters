import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Award, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw,
  Eye,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitQuizAttempt } from '../services/examService';

export default function ExamEngineModal({ 
  course, 
  lesson, 
  quiz, 
  user, 
  isOpen, 
  onClose,
  onViewLeaderboard
}) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(25 * 60); // 25 mins default
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showReview, setShowReview] = useState(false);

  // Fallback demo questions if quiz has none
  const defaultQuestions = [
    {
      id: 1,
      question: "'ভর ও শক্তি সমতুল্য'- কোন বিজ্ঞানীর বিখ্যাত অভিমত?",
      options: ["আইজ্যাক নিউটন", "গ্যালিলিও গ্যালিলি", "আলবার্ট আইনস্টাইন", "মাইকেল ফ্যারাডে"],
      correctAnswer: 2,
      explanation: "বিজ্ঞানী আইনস্টাইন তার আপেক্ষিকতার বিশেষ তত্ত্বে E = mc² সমীকরণের মাধ্যমে ভর ও শক্তির সমতুল্যতা প্রমাণ করেন।"
    },
    {
      id: 2,
      question: "আদর্শ গ্যাসের ক্ষেত্রে সমোষ্ণ প্রক্রিয়ায় কোনটি ধ্রুবক থাকে?",
      options: ["চাপ (P)", "তাপমাত্রা (T)", "আয়তন (V)", "এনট্রপি (S)"],
      correctAnswer: 1,
      explanation: "সমোষ্ণ প্রক্রিয়ায় সিস্টেমের তাপমাত্রা (Temperature) অপরিবর্তিত বা ধ্রুব থাকে।"
    },
    {
      id: 3,
      question: "মহাকর্ষীয় ধ্রুবক G এর এসআই একক কোনটি?",
      options: ["N m² kg⁻²", "N m kg⁻¹", "N m² kg⁻¹", "N kg⁻²"],
      correctAnswer: 0,
      explanation: "F = G(m1*m2)/r² সূত্র থেকে G = Fr²/(m1*m2), যার একক N m² kg⁻²।"
    },
    {
      id: 4,
      question: "সরল ছন্দিত স্পন্দনরত কোনো কণার সর্বোচ্চ বেগের রাশিমালা কোনটি?",
      options: ["v = ω√(A² - x²)", "v_max = ωA", "v = ω²A", "v = A / ω"],
      correctAnswer: 1,
      explanation: "সাম্যাবস্থানে (x=0) বেগের মান সর্বোচ্চ হয়, এবং v_max = ωA।"
    },
    {
      id: 5,
      question: "কোনো বস্তুর রৈখিক ভরবেগ দ্বিগুণ করা হলে এর গতিশক্তি কতগুণ হবে?",
      options: ["২ গুণ", "৩ গুণ", "৪ গুণ", "অপরিবর্তিত থাকবে"],
      correctAnswer: 2,
      explanation: "গতিশক্তি E_k = p² / (2m)। ভরবেগ p দ্বিগুণ হলে গতিশক্তি ২² = ৪ গুণ বৃদ্ধি পায়।"
    }
  ];

  const questions = quiz?.questions?.length > 0 ? quiz.questions : defaultQuestions;
  const totalQuestions = questions.length;

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSubmitted]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const selectOption = (optIndex) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQIndex]: optIndex
    }));
  };

  const clearAnswer = () => {
    if (isSubmitted) return;
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQIndex];
      return copy;
    });
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const handleSubmitExam = async () => {
    if (isSubmitted) return;

    const timeTaken = (25 * 60) - timeLeftSeconds;
    const submission = await submitQuizAttempt({
      user,
      course,
      lesson,
      quiz: { questions, id: quiz?.id || 'live-exam' },
      answers: userAnswers,
      timeTakenSeconds: timeTaken,
      negativeMarking: 0.25
    });

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    setResultData(submission);
    setIsSubmitted(true);
  };

  if (!isOpen) return null;

  const currentQ = questions[currentQIndex] || questions[0];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#0f0409] border border-red-950/60 shadow-2xl flex flex-col h-[92vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-[#14060d] border-b border-red-950/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
              অনলাইন এক্সাম রুম
            </span>
            <h2 className="text-base sm:text-lg font-black text-white truncate max-w-md">
              {quiz?.title || lesson?.name || 'অধ্যায়ভিত্তিক প্র্যাকটিস এক্সাম'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown Timer */}
            {!isSubmitted && (
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono font-bold text-sm ${
                timeLeftSeconds < 180 
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse' 
                  : 'bg-white/5 text-gray-200 border-white/10'
              }`}>
                <Clock className="w-4 h-4 text-red-400" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isSubmitted ? (
          /* RESULT SCREEN VIEW */
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-600/20">
                <Award className="w-9 h-9" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">পরীক্ষা সমাপ্ত হয়েছে!</h3>
              <p className="text-xs text-gray-400">আপনার স্কোর স্বয়ংক্রিয়ভাবে ক্লাউড ডাটাবেজ ও মেধা তালিকায় সংরক্ষিত হয়েছে।</p>
            </div>

            {/* Score Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">প্রাপ্ত নম্বর</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {resultData?.score} <span className="text-xs text-gray-400 font-normal">/ {resultData?.total_marks}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">সঠিক উত্তর</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
                  {resultData?.correct_count}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">ভুল উত্তর</p>
                <p className="text-2xl sm:text-3xl font-black text-red-400 mt-1">
                  {resultData?.wrong_count}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[11px] text-gray-400 uppercase font-semibold">একুরেসি</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
                  {resultData?.percentage}%
                </p>
              </div>
            </div>

            {/* Actions: View Explanations / Leaderboard */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setShowReview(!showReview)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10"
              >
                <Eye className="w-4 h-4 text-amber-400" />
                <span>{showReview ? 'রিভিউ লুকান' : 'প্রশ্নের সঠিক উত্তর ও ব্যাখ্যা দেখুন'}</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  if (onViewLeaderboard) onViewLeaderboard();
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-600/30"
              >
                <Award className="w-4 h-4" />
                <span>মেধা তালিকা (Leaderboard) দেখুন</span>
              </button>
            </div>

            {/* Questions Review Breakdown */}
            {showReview && (
              <div className="space-y-4 max-w-3xl mx-auto pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold text-white mb-2">প্রশ্নোত্তর ও সমাধান বিশ্লেষণ:</h4>
                {questions.map((q, idx) => {
                  const studentAns = userAnswers[idx];
                  const correctAns = Number(q.correctAnswer ?? q.correct_index ?? 0);
                  const isCorrect = studentAns !== undefined && Number(studentAns) === correctAns;
                  const isSkipped = studentAns === undefined;

                  return (
                    <div 
                      key={q.id || idx}
                      className={`p-5 rounded-2xl border text-xs space-y-3 ${
                        isCorrect 
                          ? 'bg-emerald-950/20 border-emerald-500/30' 
                          : isSkipped 
                          ? 'bg-white/[0.02] border-white/10' 
                          : 'bg-red-950/20 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-bold text-white text-sm">
                          {idx + 1}. {q.question}
                        </p>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                          isCorrect 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : isSkipped 
                            ? 'bg-gray-500/20 text-gray-300' 
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isCorrect ? 'সঠিক' : isSkipped ? 'উপেক্ষিত' : 'ভুল'}
                        </span>
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options?.map((opt, oIdx) => {
                          const isThisCorrect = oIdx === correctAns;
                          const isStudentSelected = studentAns !== undefined && Number(studentAns) === oIdx;

                          let badgeClass = 'bg-white/5 border-white/5 text-gray-300';
                          if (isThisCorrect) {
                            badgeClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold';
                          } else if (isStudentSelected && !isThisCorrect) {
                            badgeClass = 'bg-red-500/20 border-red-500/40 text-red-300 font-bold';
                          }

                          return (
                            <div key={oIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${badgeClass}`}>
                              <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center text-[10px] font-mono shrink-0">
                                {['ক', 'খ', 'গ', 'ঘ'][oIdx]}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && q.explanation !== 'missing' && (
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-[11px] leading-relaxed">
                          <span className="font-bold text-amber-400">💡 ব্যাখ্যা: </span>
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE EXAM RUNNER */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Question Workspace (Left) */}
            <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto">
              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span className="font-semibold text-red-400">
                    প্রশ্ন {currentQIndex + 1} / {totalQuestions}
                  </span>
                  <span className="text-gray-400">
                    দাগিয়েছেন: <strong className="text-white">{answeredCount}</strong> টি
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6 leading-relaxed">
                  {currentQIndex + 1}. {currentQ?.question}
                </h3>

                {/* Options List */}
                <div className="space-y-3 mb-6">
                  {currentQ?.options?.map((option, optIdx) => {
                    const isSelected = userAnswers[currentQIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => selectOption(optIdx)}
                        className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                          isSelected 
                            ? 'bg-red-600/20 border-red-500 text-white shadow-lg shadow-red-950/50' 
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-gray-200'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-red-600 text-white shadow-md' 
                            : 'bg-white/10 text-gray-400'
                        }`}>
                          {['ক', 'খ', 'গ', 'ঘ'][optIdx]}
                        </div>
                        <span className="text-sm font-medium flex-1">{option}</span>
                        {isSelected && <Check className="w-4 h-4 text-red-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Nav Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10 gap-3">
                <button
                  onClick={clearAnswer}
                  disabled={userAnswers[currentQIndex] === undefined}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-400 hover:text-white text-xs font-semibold transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>উত্তর মুছুন</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentQIndex === 0}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 hover:text-white transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  {currentQIndex < totalQuestions - 1 ? (
                    <button
                      onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all"
                    >
                      <span>পরবর্তী</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitExam}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>পরীক্ষা সাবমিট করুন</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Palette Sidebar (Right) */}
            <div className="w-full md:w-72 p-5 bg-[#14060d] border-t md:border-t-0 md:border-l border-red-950/50 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">
                  প্রশ্ন প্যালেট ({totalQuestions} টি প্রশ্ন)
                </h4>
                
                <div className="grid grid-cols-5 gap-2 max-h-[300px] md:max-h-[450px] overflow-y-auto pr-1">
                  {questions.map((_, qIdx) => {
                    const isAnswered = userAnswers[qIdx] !== undefined;
                    const isCurrent = qIdx === currentQIndex;

                    return (
                      <button
                        key={qIdx}
                        onClick={() => setCurrentQIndex(qIdx)}
                        className={`h-10 rounded-xl text-xs font-mono font-bold transition-all ${
                          isCurrent 
                            ? 'ring-2 ring-red-400 bg-red-600 text-white shadow-md' 
                            : isAnswered 
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' 
                            : 'bg-white/5 text-gray-400 border border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Final Submit Button in Sidebar */}
              <div className="pt-4 border-t border-white/10 mt-4">
                <button
                  onClick={handleSubmitExam}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
                >
                  সাবমিট করুন ({answeredCount}/{totalQuestions})
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
