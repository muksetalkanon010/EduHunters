import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Award, ShieldAlert, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { stripEmoji } from '../utils/textUtils';
import { useAuth } from '../context/AuthContext';
import { recordQuizSubmission } from '../services/quizService';
import { getResolvedStudent } from '../utils/studentProfile';
import { getQuestionCorrectIndex, cleanExplanation, getUserAnswer } from '../utils/examBatchStorage';

export default function ExamEngine({ exam, onClose }) {
  const { currentUser } = useAuth();
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState((exam?.durationMinutes || 15) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Anti-cheating & Content Security listeners
  useEffect(() => {
    if (isSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchWarnings(prev => prev + 1);
      }
    };

    const handleKeyDown = (e) => {
      // Block F12 DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Block Ctrl+C (Copy), Ctrl+U (View Source), Ctrl+P (Print), Ctrl+S (Save)
      if ((e.ctrlKey || e.metaKey) && ['c', 'u', 'p', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitted]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitExam = () => {
    if (isSubmitted || questions.length === 0) return;
    setIsSubmitted(true);

    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    questions.forEach((q, idx) => {
      const selected = getUserAnswer(selectedAnswers, q, idx);
      const isAns = selected !== undefined && selected !== null && selected !== '' && !isNaN(Number(selected));
      const targetCorrect = getQuestionCorrectIndex(q);
      if (!isAns) {
        skippedCount++;
      } else if (Number(selected) === Number(targetCorrect)) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const negPenalty = wrongCount * (exam?.negativeMarking || 0.25);
    const rawScore = +(correctCount - negPenalty).toFixed(2);
    const finalScore = rawScore;
    const percentage = Math.max(0, Math.round((Math.max(0, finalScore) / questions.length) * 100));

    const resultPayload = {
      totalQuestions: questions.length,
      totalPossible: exam?.totalMarks || questions.length,
      correctCount,
      wrongCount,
      skippedCount,
      finalScore,
      score: finalScore,
      percentage,
      isPassed: finalScore >= (exam?.passMarks || 1)
    };

    setResult(resultPayload);

    // Save exam attempt to official leaderboard
    try {
      const durationSecs = (exam?.durationMinutes ? exam.durationMinutes * 60 : 3600);
      const timeTaken = Math.max(1, durationSecs - timeLeft);
      const resolvedStudent = getResolvedStudent(currentUser);
      recordQuizSubmission({
        student: resolvedStudent,
        course: { 
          id: exam?.courseId || 'exam_batch', 
          title: exam?.courseName || exam?.title || 'Exam' 
        },
        lesson: { 
          id: exam?.id || `exam_${Date.now()}`, 
          title: exam?.title || 'Exam' 
        },
        quiz: exam,
        result: resultPayload,
        timeTakenSeconds: timeTaken
      });
    } catch (e) {
      console.warn('[ExamEngine] Leaderboard record notice:', e);
    }

    // Celebrate with confetti if passed
    if (finalScore >= (exam?.passMarks || 1)) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const currentQ = questions[currentIdx] || { question: '', options: [] };

  return (
    <div className="exam-modal-overlay">
      <div className="exam-container">
        {/* Exam Header */}
        <div className="exam-header">
          <button 
            className="btn-icon" 
            onClick={() => {
              if (!isSubmitted) setShowExitConfirm(true);
              else onClose();
            }}
            title="Exit / বের হন"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="exam-title-box">
            <h2 className="exam-title">{stripEmoji(exam.title)}</h2>
            <span className="exam-subject-tag">{exam.subject}</span>
          </div>

          {!isSubmitted && (
            <div className={`exam-timer-badge ${timeLeft < 180 ? 'timer-urgent' : ''}`}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Exam Content with Anti-Cheating Shield */}
        {!isSubmitted ? (
          <div 
            className="exam-body no-select relative"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
          >
            {/* Tab switch anti-cheating warning */}
            {tabSwitchWarnings > 0 && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>সতর্কতা: পরীক্ষা চলাকালীন অন্য ট্যাব বা ব্রাউজার উইন্ডোতে যাওয়া যাবে না (সতর্কবার্তা: {tabSwitchWarnings} বার)।</span>
              </div>
            )}

            {/* Question Progress Tracker */}
            <div className="question-tracker">
              <span className="tracker-text">
                প্রশ্ন {currentIdx + 1} / {questions.length}
              </span>
              <div className="tracker-dots">
                {questions.map((qItem, i) => {
                  const isAns = getUserAnswer(selectedAnswers, qItem, i) !== undefined;
                  return (
                    <button
                      key={i}
                      className={`tracker-dot ${i === currentIdx ? 'current' : ''} ${isAns ? 'answered' : ''}`}
                      onClick={() => setCurrentIdx(i)}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card with Anti-Piracy Watermark */}
            <div className="question-card relative overflow-hidden">
              <div className="absolute top-2 right-3 pointer-events-none select-none text-[9px] text-gray-400/30 font-mono tracking-wider">
                EDU HUNTERS • {currentUser?.phone || currentUser?.email || 'STUDENT'}
              </div>
              <h3 className="question-text">
                <span className="q-number">{currentIdx + 1}.</span> {currentQ.question}
              </h3>

              <div className="options-list">
                {(currentQ.options || []).map((opt, oIdx) => {
                  const currentSelected = getUserAnswer(selectedAnswers, currentQ, currentIdx);
                  const isSelected = currentSelected !== undefined && Number(currentSelected) === Number(oIdx);
                  const bengaliLetters = ['ক', 'খ', 'গ', 'ঘ'];
                  return (
                    <button
                      key={oIdx}
                      className={`option-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectOption(currentQ.id || currentIdx, oIdx)}
                    >
                      <span className="option-indicator">{bengaliLetters[oIdx] || oIdx + 1}</span>
                      <span className="option-label">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation & Submit Footer */}
            <div className="exam-footer">
              <button
                className="btn btn-ghost"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              >
                পূর্ববর্তী
              </button>

              <div className="exam-footer-right">
                {currentIdx < questions.length - 1 ? (
                  <button
                    className="btn btn-outline"
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                  >
                    পরবর্তী প্রশ্ন
                  </button>
                ) : (
                  <button
                    className="btn btn-accent"
                    onClick={handleSubmitExam}
                  >
                    <CheckCircle size={16} /> সাবমিট করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Results View with Medilogy Style OMR and Explanations */
          <div className="exam-result-view animate-fade-in">
            <div className="result-score-card">
              <div className="result-trophy">
                <Award size={48} className="text-warning" />
              </div>
              <h3 className="result-title">পরীক্ষা সম্পন্ন হয়েছে!</h3>
              <p className="result-sub">আপনার স্কোর ও পারফরম্যান্স বিশ্লেষণ</p>

              <div className="score-summary-grid">
                <div className="score-item">
                  <span className="score-val">{result.finalScore} / {result.totalQuestions}</span>
                  <span className="score-lbl">প্রাপ্ত নম্বর</span>
                </div>
                <div className="score-item text-emerald">
                  <span className="score-val">{result.correctCount}</span>
                  <span className="score-lbl">সঠিক</span>
                </div>
                <div className="score-item text-danger">
                  <span className="score-val">{result.wrongCount}</span>
                  <span className="score-lbl">ভুল</span>
                </div>
                <div className="score-item text-muted">
                  <span className="score-val">{result.skippedCount}</span>
                  <span className="score-lbl">অনুত্তর</span>
                </div>
              </div>
            </div>

            {/* Question Review with Explanations */}
            <div className="exam-solution-section">
              <h4 className="solution-heading">প্রশ্ন ও বিস্তারিত সমাধান</h4>
              {questions.map((q, idx) => {
                const targetCorrect = getQuestionCorrectIndex(q);
                const userAns = getUserAnswer(selectedAnswers, q, idx);
                const isAns = userAns !== undefined && userAns !== null && userAns !== '' && !isNaN(Number(userAns));
                const isCorrect = isAns && Number(userAns) === Number(targetCorrect);
                const isSkipped = !isAns;
                const cleanExp = cleanExplanation(q.explanation, q);

                return (
                  <div key={q.id || idx} className="solution-card">
                    <div className="solution-q-header">
                      <span className="font-semibold">{idx + 1}. {q.question}</span>
                      <span className={`solution-status ${isCorrect ? 'correct' : isSkipped ? 'skipped' : 'wrong'}`}>
                        {isCorrect ? '✓ সঠিক' : isSkipped ? 'মাইনাস হয়নি (স্কিপড)' : '✗ ভুল'}
                      </span>
                    </div>

                    <div className="solution-options-list">
                      {(q.options || []).map((opt, oIdx) => {
                        const isCorrectOpt = Number(oIdx) === Number(targetCorrect);
                        const isUserOpt = isAns && Number(oIdx) === Number(userAns);
                        let optClass = '';
                        if (isCorrectOpt) optClass = 'correct-opt';
                        else if (isUserOpt && !isCorrect) optClass = 'wrong-opt';

                        return (
                          <div key={oIdx} className={`solution-opt ${optClass}`}>
                            <span>{['ক', 'খ', 'গ', 'ঘ'][oIdx] || oIdx + 1}. {opt}</span>
                            {isCorrectOpt && <span className="text-emerald text-xs"> (সঠিক উত্তর)</span>}
                            {isUserOpt && !isCorrect && <span className="text-danger text-xs"> (আপনার উত্তর)</span>}
                          </div>
                        );
                      })}
                    </div>

                    {cleanExp ? (
                      <div className="explanation-box">
                        <strong>ব্যাখ্যা:</strong> {cleanExp}
                      </div>
                    ) : (
                      <div className="explanation-box verified-box" style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
                        <span className="text-emerald-500 font-bold">✓ সঠিক উত্তর:</span> {['ক', 'খ', 'গ', 'ঘ'][targetCorrect] || targetCorrect + 1}. {q.options ? q.options[targetCorrect] : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="result-actions">
              <button className="btn btn-primary" onClick={onClose}>
                ফলাফল বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mid-Exam Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#140306] border border-red-500/30 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold">পরীক্ষা থেকে বের হতে চান?</h3>
                <p className="text-xs text-red-400">সাবমিট না করে বের হওয়ার সতর্কতা</p>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 leading-relaxed">
              <p className="font-bold mb-1">⚠️ সতর্কবার্তা: এটি আপনার ১ম অফিসিয়াল প্রচেষ্টা!</p>
              <p>সাবমিট না করে বের হয়ে গেলে মেধা তালিকায় ০ মার্ক জমা হবে। পরবর্তীতে পরীক্ষা দিলে তা কেবল প্র্যাকটিস হিসেবে গণ্য হবে।</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-xl border border-white/20 text-xs font-semibold text-gray-300 hover:bg-white/5 cursor-pointer"
              >
                না, পরীক্ষা চালিয়ে যান
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setIsSubmitted(true);
                  try {
                    const resolvedStudent = getResolvedStudent(currentUser);
                    recordQuizSubmission({
                      student: resolvedStudent,
                      course: { id: exam?.courseId || 'exam_batch', title: exam?.courseName || exam?.title || 'Exam' },
                      lesson: { id: exam?.id || `exam_${Date.now()}`, title: exam?.title || 'Exam' },
                      quiz: exam,
                      result: {
                        score: 0,
                        finalScore: 0,
                        totalPossible: questions.length,
                        totalQuestions: questions.length,
                        correctCount: 0,
                        wrongCount: 0,
                        skippedCount: questions.length,
                        percentage: 0,
                        isAbandoned: true
                      },
                      timeTakenSeconds: 1
                    });
                  } catch (e) {}
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold border-none cursor-pointer"
              >
                হ্যাঁ, বের হয়ে যান (০ মার্ক সহ)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
