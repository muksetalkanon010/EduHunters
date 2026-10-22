import React, { useState } from 'react';
import { 
  Play, 
  FileText, 
  Award, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Clock, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function CoursePlayer({ 
  course, 
  hasAccess, 
  user, 
  onBack, 
  onEnroll, 
  onStartExam 
}) {
  const curriculum = course.curriculum || [];
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);

  const activeLesson = curriculum[activeLessonIndex] || curriculum[0];
  const isFree = course.isFree || course.salePrice === 0;

  // Extract YouTube embed URL helper
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch?v=')) {
      const vid = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const vid = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${vid}?autoplay=0&rel=0`;
    }
    return url;
  };

  // If user does not have access and course is paid: show locked preview
  if (!hasAccess && !isFree) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল কোর্সে ফিরে যান</span>
        </button>

        <div className="rounded-3xl bg-[#12070c] border border-red-950/50 overflow-hidden p-8 md:p-12 text-center relative shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-600/20">
            <Lock className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-white mb-3">{course.title}</h2>
          <p className="text-gray-300 max-w-xl mx-auto text-sm md:text-base mb-8 leading-relaxed">
            এই কোর্সের ক্লাস, লেকচার শিট এবং এক্সামে এক্সেস পেতে আপনাকে কোর্সটিতে এনরোল করতে হবে।
          </p>

          <div className="inline-flex items-baseline gap-3 mb-8 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
            <span className="text-3xl font-black text-white">৳{course.salePrice || 1500}</span>
            {course.regularPrice && (
              <span className="text-sm text-gray-400 line-through">৳{course.regularPrice}</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onEnroll(course)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-red-600/30 transition-all hover:scale-105"
            >
              এখনই এনরোল করুন
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-base transition-all"
            >
              অন্যান্য কোর্স দেখুন
            </button>
          </div>

          {/* Curriculum Teaser */}
          <div className="mt-12 text-left border-t border-white/10 pt-8">
            <h4 className="text-lg font-bold text-white mb-4">কোর্সের অন্তর্ভুক্ত অধ্যায়সমূহ ({curriculum.length}টি চ্যাপ্টার):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {curriculum.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                  <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-300 font-medium">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Unlocked Course Player View
  const embedUrl = getEmbedUrl(activeLesson?.videoUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>সকল কোর্সে ফিরে যান</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <Unlock className="w-3.5 h-3.5" />
            <span>পূর্ণাঙ্গ এক্সেস সক্রিয়</span>
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {course.title}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Video & Lesson Content (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl overflow-hidden bg-black border border-red-950/50 shadow-2xl aspect-[16/9] relative">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={activeLesson?.name || 'Class Video'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <Play className="w-16 h-16 text-red-500/50 mb-4 animate-pulse" />
                <p className="text-lg font-bold text-white mb-1">{activeLesson?.name}</p>
                <p className="text-xs text-gray-400">শীঘ্রই এই ক্লাসের ফুল এইচডি ভিডিও লেকচার যুক্ত হবে।</p>
              </div>
            )}
          </div>

          {/* Lesson Info & Resources Bar */}
          <div className="p-6 rounded-3xl bg-[#12070c] border border-red-950/40 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-red-400 font-bold tracking-wider uppercase">
                  অধ্যায় {activeLessonIndex + 1} / {curriculum.length}
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  {activeLesson?.name}
                </h2>
              </div>

              {/* Action Buttons: PDF Note & Exam */}
              <div className="flex items-center gap-3">
                {activeLesson?.pdfUrl && (
                  <a
                    href={activeLesson.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-bold transition-all"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>লেকচার শিট</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
                  </a>
                )}

                <button
                  onClick={() => onStartExam(course, activeLesson)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                >
                  <Award className="w-4 h-4" />
                  <span>অনলাইন এক্সাম দিন</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed pt-2 border-t border-white/5">
              💡 <span className="font-semibold text-white">নির্দেশনা:</span> ক্লাসটি মনোযোগ দিয়ে শেষ করার পর "অনলাইন এক্সাম দিন" বাটনে ক্লিক করে নিজের প্রস্তুতি যাচাই করুন এবং মেধা তালিকায় নিজের অবস্থান দেখুন।
            </p>
          </div>
        </div>

        {/* Sidebar Chapter List (Right 1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#12070c] border border-red-950/40 shadow-xl">
            <h3 className="text-base font-black text-white mb-1 flex items-center justify-between">
              <span>কোর্স কারিকুলাম</span>
              <span className="text-xs font-bold text-red-400 bg-red-600/10 px-2.5 py-1 rounded-full border border-red-500/20">
                {curriculum.length} টি ক্লাস
              </span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">যেকোনো ক্লাসে ক্লিক করে প্লে করুন:</p>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {curriculum.map((lesson, idx) => {
                const isActive = idx === activeLessonIndex;
                return (
                  <button
                    key={lesson.id || idx}
                    onClick={() => setActiveLessonIndex(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all ${
                      isActive 
                        ? 'bg-red-600/20 border border-red-500/40 text-white shadow-md' 
                        : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-gray-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive 
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/50' 
                        : 'bg-white/10 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-gray-300'}`}>
                        {lesson.name}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{lesson.duration || '১ ঘণ্টা ৩০ মি.'}</span>
                        </span>
                        {lesson.hasExam && (
                          <span className="text-rose-400 font-semibold">• প্র্যাকটিস এক্সাম</span>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <Play className="w-3.5 h-3.5 text-red-400 shrink-0 fill-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
