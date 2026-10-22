import React from 'react';
import { Users, CheckCircle2, ArrowRight, PlayCircle, Lock, Unlock } from 'lucide-react';

export default function CourseCard({ 
  course, 
  hasAccess, 
  onSelectCourse, 
  onEnrollCourse 
}) {
  const isFree = course.isFree || course.salePrice === 0;

  return (
    <div className="group relative rounded-3xl bg-[#12070c]/90 border border-red-950/40 hover:border-red-500/40 overflow-hidden shadow-xl shadow-black/40 hover:shadow-red-600/10 transition-all duration-300 flex flex-col justify-between">
      
      {/* Top Banner & Badges */}
      <div>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/40">
          <img 
            src={course.image || course.cover || '/sureshot_banner.jpg'} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = '/sureshot_banner.jpg'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12070c] via-transparent to-black/30" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
              isFree 
                ? 'bg-emerald-500 text-black' 
                : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
            }`}>
              {isFree ? 'সম্পূর্ণ ফ্রি' : 'ফ্ল্যাগশিপ কোর্স'}
            </span>
          </div>

          {/* Access Status Icon */}
          <div className="absolute top-3 right-3">
            {hasAccess ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold backdrop-blur-md">
                <Unlock className="w-3.5 h-3.5" />
                <span>আনলকড</span>
              </span>
            ) : isFree ? null : (
              <span className="p-2 rounded-full bg-black/60 text-gray-300 border border-white/10 backdrop-blur-md">
                <Lock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span className="font-semibold text-red-400">{course.category || 'Medical'}</span>
            <span className="flex items-center gap-1 text-gray-400">
              <Users className="w-3.5 h-3.5" />
              <span>{course.studentsCount || '1000+'} শিক্ষার্থী</span>
            </span>
          </div>

          <h3 className="text-xl font-black text-white group-hover:text-red-400 transition-colors leading-snug mb-2">
            {course.title || course.name}
          </h3>

          <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-4">
            {course.tagline || course.description}
          </p>

          {/* Features Checklist */}
          {course.features && course.features.length > 0 && (
            <ul className="space-y-2 mb-6">
              {course.features.slice(0, 3).map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span className="truncate">{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom Pricing & Action */}
      <div className="p-6 pt-0 border-t border-white/5 mt-auto">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div>
            <p className="text-[11px] text-gray-400 uppercase font-semibold">কোর্স ফি</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">
                {isFree ? 'ফ্রি' : `৳${course.salePrice || 1500}`}
              </span>
              {!isFree && course.regularPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ৳{course.regularPrice}
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          {hasAccess ? (
            <button
              onClick={() => onSelectCourse(course)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ক্লাস করুন</span>
            </button>
          ) : isFree ? (
            <button
              onClick={() => onSelectCourse(course)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02]"
            >
              <PlayCircle className="w-4 h-4" />
              <span>ফ্রি শুরু করুন</span>
            </button>
          ) : (
            <button
              onClick={() => onEnrollCourse(course)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white text-sm font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
            >
              <span>এনরোল করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => onSelectCourse(course)}
          className="w-full text-center text-xs text-gray-400 hover:text-white py-1.5 transition-colors font-medium"
        >
          কারিকুলাম ও বিস্তারিত সিলেবাস দেখুন →
        </button>
      </div>

    </div>
  );
}
