import React from 'react';
import { instructorsData } from '../data/homeData';
import { GraduationCap, Award } from 'lucide-react';

export default function InstructorsSection() {
  return (
    <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-red-950/30">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold mb-3">
          <GraduationCap className="w-3.5 h-3.5 text-red-400" />
          <span>অভিজ্ঞ মেন্টর প্যানেল</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          আমাদের কোর্স ইন্সট্রাক্টরবৃন্দ
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          যাদের হাত ধরে তৈরি হচ্ছে হাজারো স্বপ্নজয়ী শিক্ষার্থী।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {instructorsData.map((ins) => (
          <div
            key={ins.id}
            className="p-6 rounded-3xl bg-[#12070c] border border-white/5 hover:border-red-500/30 shadow-xl flex items-center gap-5 transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 ring-2 ring-red-500/30 shadow-lg bg-black/40">
              <img
                src={ins.image}
                alt={ins.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = '/avatar.svg'; }}
              />
            </div>

            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25 mb-1.5">
                <Award className="w-3 h-3" />
                <span>{ins.badge}</span>
              </span>
              <h3 className="text-lg font-black text-white truncate">{ins.name}</h3>
              <p className="text-xs text-red-400 font-semibold mb-1">{ins.designation}</p>
              <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{ins.bio}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
