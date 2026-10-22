import React from 'react';
import { whyChooseUsData } from '../data/homeData';
import { CheckCircle2 } from 'lucide-react';

export default function WhyChooseUsSection() {
  return (
    <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-red-950/30">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold mb-3">
          <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
          <span>আমাদের বিশেষত্ব</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          কেন EduHunters বেছে নেবেন?
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          একটি গোছানো ও স্মার্ট প্ল্যাটফর্ম যা আপনার এডমিশন প্রস্তুতিকে সহজ ও নিশ্চিত করবে।
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {whyChooseUsData.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-[#12070c] border border-white/5 hover:border-red-500/30 transition-all duration-300 shadow-xl flex flex-col justify-between"
          >
            <div>
              <span className="text-2xl font-black font-mono text-red-500/50 block mb-3">
                {item.number}
              </span>
              <h3 className="text-base font-bold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
