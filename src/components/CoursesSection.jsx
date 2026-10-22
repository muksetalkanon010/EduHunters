import React, { useState } from 'react';
import { ArrowRight, PlayCircle, Users, CheckCircle2, Lock, Unlock } from 'lucide-react';
import { categoriesList } from '../data/homeData';

export default function CoursesSection({ 
  courses = [], 
  accessMap = {}, 
  onSelectCourse, 
  onEnrollCourse,
  onViewAllCourses
}) {
  const [selectedCategory, setSelectedCategory] = useState('সকল');

  const filteredCourses = courses.filter((course) => {
    if (selectedCategory === 'সকল') return true;
    if (selectedCategory === 'Medical') {
      return (course.category || '').toLowerCase() === 'medical' || (course.title || '').includes('Physics') || (course.title || '').includes('Chemistry');
    }
    if (selectedCategory === 'EXAM BATCH') {
      return (course.category || '').toLowerCase() === 'exam batch' || course.hasExam || course.isExamBatch;
    }
    return course.category === selectedCategory;
  });

  return (
    <section id="courses-section" className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* Header Banner - Crimson Gradient */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl mb-8 bg-gradient-to-r from-[#7f1d1d] via-[#dc2626] to-[#991b1b] p-6 sm:p-8 shadow-xl shadow-red-950/40 flex flex-wrap items-center justify-between gap-4">
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
            কোর্সসমূহ
          </h2>
          <p className="text-xs sm:text-sm text-red-100 mt-2 font-medium">
            মেডিকেল ও ভার্সিটি এডমিশন স্পেশাল প্রোগ্রাম
          </p>
        </div>

        <button
          onClick={onViewAllCourses}
          className="relative z-10 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-gray-950 hover:bg-gray-100 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 active:scale-95"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6">
        {categoriesList.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#e11438] text-white shadow-[0_4px_16px_rgba(225,20,56,0.4)]'
                  : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {filteredCourses.map((course) => {
          const hasAccess = Boolean(accessMap[course.id] || accessMap[course.slug]);
          const isFree = course.isFree || course.salePrice === 0;

          return (
            <div
              key={course.id}
              className="group relative rounded-3xl bg-[#12070c]/90 border border-red-950/40 hover:border-red-500/40 overflow-hidden shadow-xl shadow-black/40 hover:shadow-red-600/10 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Thumbnail Image with Badges */}
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
                      isFree ? 'bg-emerald-500 text-black' : 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
                    }`}>
                      {isFree ? 'সম্পূর্ণ ফ্রি' : 'ফ্ল্যাগশিপ কোর্স'}
                    </span>
                  </div>

                  {/* Access Icon Badge */}
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
                      <span>{course.studentsCount || '1250+'} শিক্ষার্থী</span>
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-red-400 transition-colors leading-snug mb-2">
                    {course.title || course.name}
                  </h3>

                  <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed mb-4">
                    {course.tagline || course.description}
                  </p>

                  {/* Features list */}
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
                  className="w-full text-center text-xs text-gray-400 hover:text-white py-1.5 transition-colors font-medium cursor-pointer"
                >
                  কারিকুলাম ও বিস্তারিত সিলেবাস দেখুন →
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
}
