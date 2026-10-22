import React, { useState, useEffect, useRef } from 'react';
import { homeStatsData } from '../data/homeData';

function AnimatedCounter({ value }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const parseResult = React.useMemo(() => {
    const str = String(value || '');
    const match = str.match(/^([^\d]*)(\d+)([^\d]*)$/);
    if (match) {
      const num = parseInt(match[2], 10);
      const startNum = num > 50 ? Math.floor(num * 0.94) : Math.max(1, num - 2);
      return { prefix: match[1] || '', num, startNum, suffix: match[3] || '' };
    }
    return { prefix: '', num: 0, startNum: 0, suffix: str };
  }, [value]);

  const [displayVal, setDisplayVal] = useState(parseResult.startNum);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || parseResult.num <= 0) {
      if (isVisible) setDisplayVal(parseResult.num);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;
    const duration = 1000;
    const startVal = parseResult.startNum;
    const delta = parseResult.num - startVal;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayVal(Math.round(startVal + (delta * ease)));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayVal(parseResult.num);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible, parseResult.num, parseResult.startNum]);

  return (
    <div ref={containerRef}>
      <p className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff0f3] to-[#ffccd5] drop-shadow-[0_4px_16px_rgba(225,20,56,0.35)]">
        {parseResult.prefix}{displayVal}{parseResult.suffix}
      </p>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="relative py-12 md:py-14 text-white overflow-hidden bg-gradient-to-r from-[#120306] via-[#22060c] to-[#120306] border-y border-[#e11438]/25 shadow-[0_15px_40px_rgba(0,0,0,0.85)]">
      {/* Top & Bottom Glowing Hairlines */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2e55]/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#ff2e55]/20 to-transparent pointer-events-none" />

      {/* Center Deep Crimson Ambient Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[90vw] h-48 bg-[#e11438]/15 rounded-full blur-[85px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-nowrap items-center justify-center gap-4 sm:gap-10 md:gap-16 text-center">
          {homeStatsData.map((stat, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <div className="hidden sm:block h-12 w-[1px] shrink-0 self-center bg-gradient-to-b from-transparent via-[#e11438]/30 to-transparent" />
              )}
              <div className="space-y-1.5 sm:space-y-2 min-w-0 px-2 sm:px-4 group cursor-default transition-transform duration-300 hover:scale-[1.04]">
                <AnimatedCounter value={stat.value} />
                <p className="text-[9px] sm:text-[11px] md:text-[12px] uppercase tracking-[0.16em] sm:tracking-[0.24em] font-bold text-[#ff4d6d] drop-shadow-[0_0_8px_rgba(255,77,109,0.3)]">
                  {stat.label}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
