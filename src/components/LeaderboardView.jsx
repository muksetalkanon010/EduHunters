import React, { useState, useEffect } from 'react';
import { Award, Medal, Trophy, Clock, Search, RefreshCw } from 'lucide-react';
import { getLeaderboard } from '../services/examService';

export default function LeaderboardView() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadScores = async () => {
    setLoading(true);
    const data = await getLeaderboard();
    setLeaderboard(data);
    setLoading(false);
  };

  useEffect(() => {
    loadScores();
  }, []);

  const filtered = leaderboard.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.student_name?.toLowerCase().includes(q) ||
      item.lesson_title?.toLowerCase().includes(q)
    );
  });

  const formatSeconds = (secs) => {
    if (!secs) return '০ সে.';
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins} মি. ${s} সে.`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-bold mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>মেডিকেল ও ভার্সিটি এক্সাম র‍্যাঙ্কিং</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">
          লাইভ মেধা তালিকা
        </h2>
        <p className="text-xs sm:text-sm text-gray-300">
          পরীক্ষায় সেরা পারফর্মকারী শিক্ষার্থীদের তাৎক্ষণিক স্কোর ও একুরেসি তালিকা।
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {leaderboard.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* 2nd Place */}
          <div className="p-6 rounded-3xl bg-[#14060d] border border-gray-400/20 text-center relative order-2 md:order-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gray-400/20 text-gray-300 border border-gray-400/30 flex items-center justify-center mx-auto mb-3 font-black text-lg">
                ২
              </div>
              <h4 className="text-base font-bold text-white truncate">{leaderboard[1]?.student_name}</h4>
              <p className="text-[11px] text-gray-400 mb-4">{leaderboard[1]?.lesson_title}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-2xl font-black text-gray-200">{leaderboard[1]?.score}</span>
              <span className="text-xs text-gray-400 block mt-0.5">একুরেসি: {leaderboard[1]?.percentage}%</span>
            </div>
          </div>

          {/* 1st Place (Champion) */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-amber-950/40 to-[#14060d] border border-amber-500/40 text-center relative order-1 md:order-2 shadow-xl shadow-amber-500/10 flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
              ১ম স্থান
            </div>
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 font-black text-xl shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white truncate">{leaderboard[0]?.student_name}</h4>
              <p className="text-xs text-gray-300 mb-4">{leaderboard[0]?.lesson_title}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-3xl font-black text-amber-400">{leaderboard[0]?.score}</span>
              <span className="text-xs text-amber-200 block mt-0.5">একুরেসি: {leaderboard[0]?.percentage}%</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="p-6 rounded-3xl bg-[#14060d] border border-amber-700/20 text-center relative order-3 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-700/20 text-amber-600 border border-amber-700/30 flex items-center justify-center mx-auto mb-3 font-black text-lg">
                ৩
              </div>
              <h4 className="text-base font-bold text-white truncate">{leaderboard[2]?.student_name}</h4>
              <p className="text-[11px] text-gray-400 mb-4">{leaderboard[2]?.lesson_title}</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
              <span className="text-2xl font-black text-amber-600">{leaderboard[2]?.score}</span>
              <span className="text-xs text-gray-400 block mt-0.5">একুরেসি: {leaderboard[2]?.percentage}%</span>
            </div>
          </div>

        </div>
      )}

      {/* Search & Refresh Bar */}
      <div className="p-4 rounded-2xl bg-[#12070c] border border-red-950/40 mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="শিক্ষার্থীর নাম বা এক্সামের নাম লিখে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500 placeholder-gray-500"
          />
        </div>

        <button
          onClick={loadScores}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold border border-white/10 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-3xl bg-[#12070c] border border-red-950/40 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#180910] text-gray-400 uppercase font-semibold border-b border-white/5 text-[10px]">
              <tr>
                <th className="px-6 py-4">র‍্যাঙ্ক</th>
                <th className="px-6 py-4">শিক্ষার্থীর নাম</th>
                <th className="px-6 py-4">এক্সাম / বিষয়</th>
                <th className="px-6 py-4 text-center">প্রাপ্ত নম্বর</th>
                <th className="px-6 py-4 text-center">একুরেসি</th>
                <th className="px-6 py-4 text-right">সময়</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                    এখনও কোনো এক্সাম সাবমিশন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-white block">{item.student_name}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 truncate max-w-[200px]">
                      {item.lesson_title}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-emerald-400 text-sm">
                        {item.score}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-amber-300 text-[10px] font-bold">
                        {item.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400 font-mono text-[11px]">
                      {formatSeconds(item.time_taken_seconds)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
