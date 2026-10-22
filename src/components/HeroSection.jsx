import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, PlayCircle, Users, Award, Shield } from 'lucide-react';

export default function HeroSection({ onExploreCourses, onOpenFreeCourse }) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs md:text-sm font-semibold mb-6 shadow-sm shadow-red-950/40">
            <Sparkles className="w-4 h-4 text-red-400 animate-pulse" />
            <span>মেডিকেল ও ভার্সিটি এডমিশন প্ল্যাটফর্ম ২০২৬</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15] mb-6">
            ভর্তি প্রস্তুতি হোক <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 bg-clip-text text-transparent">
              নিখুঁত, পরিকল্পিত ও সফল
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-gray-300 font-normal leading-relaxed mb-10 max-w-2xl mx-auto">
            EduHunters-এ পাচ্ছেন হাই-কোয়ালিটি কনসেপ্ট ক্লাস, দাগানো বইয়ের বিশ্লেষণ এবং মেডিকেল স্ট্যান্ডার্ড রিয়েল-টাইম এক্সাম ও লিডারবোর্ড সিস্টেম।
          </p>

          {/* Action CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={onExploreCourses}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-red-600/30 hover:shadow-red-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>আমাদের কোর্সসমূহ দেখুন</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onOpenFreeCourse}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base border border-white/10 hover:border-red-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlayCircle className="w-5 h-5 text-red-400" />
              <span>ফ্রি স্পেশাল ক্লাস করুন</span>
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">মেডিকেল ফোকাসড</h4>
                <p className="text-xs text-gray-400">বইয়ের প্রতিটি গুরুত্বপূর্ণ লাইন</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">রিয়েল-টাইম এক্সাম</h4>
                <p className="text-xs text-gray-400">নেগেটিভ মার্কিং ও লিডারবোর্ড</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">লাইফটাইম এক্সেস</h4>
                <p className="text-xs text-gray-400">পরীক্ষার আগ পর্যন্ত নিশ্চিন্তে রিভিশন</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
