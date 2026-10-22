import React, { useState } from 'react';
import { Play, X, ExternalLink, Sparkles } from 'lucide-react';
import { freeVideosData } from '../data/homeData';

export default function FreeVideosSection() {
  const [activeVideoId, setActiveVideoId] = useState(null);

  return (
    <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-red-950/30">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>এডমিশন হ্যাকস ও গাইডলাইন</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          ফ্রি স্পেশাল ভিডিও ও স্ট্র্যাটেজি
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          মেডিকেল ও ভার্সিটি ভর্তি পরীক্ষায় সেরা প্রস্তুতি নিতে টপারদের প্রমাণিত গাইডলাইন।
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {freeVideosData.map((vid) => (
          <div
            key={vid.id}
            onClick={() => setActiveVideoId(vid.videoId)}
            className="group rounded-2xl bg-[#12070c] border border-white/5 hover:border-red-500/40 overflow-hidden shadow-lg hover:shadow-red-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail with YouTube Play Badge */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60">
                <img
                  src={`https://img.youtube.com/vi/${vid.videoId}/mqdefault.jpg`}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-red-600 group-hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 group-hover:scale-110 transition-all">
                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                  </div>
                </div>
              </div>

              {/* Text info */}
              <div className="p-4">
                <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug mb-1.5">
                  {vid.title}
                </h4>
                <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                  {vid.desc}
                </p>
              </div>
            </div>

            <div className="px-4 pb-4 pt-1 flex items-center justify-between text-[11px] text-red-400 font-semibold">
              <span>ভিডিও দেখুন</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Video Modal */}
      {activeVideoId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden bg-black border border-red-950/60 shadow-2xl">
            <button
              onClick={() => setActiveVideoId(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-[16/9] w-full">
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                title="Free Admission Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
