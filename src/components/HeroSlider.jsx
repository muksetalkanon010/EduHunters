import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { heroSlidesData } from '../data/homeData';

export default function HeroSlider({ onSelectSlide }) {
  const slides = heroSlidesData;
  const slideCount = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  // Auto-play timer (every 4.5 seconds when not hovered)
  useEffect(() => {
    if (isHovered || slideCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideCount);
    }, 4500);

    return () => clearInterval(interval);
  }, [isHovered, slideCount]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slideCount - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) nextSlide();
    if (distance < -50) prevSlide();
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-3 sm:px-6 pt-3 md:pt-6 mb-8 md:mb-12">
      
      {/* Banner Carousel Container */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden rounded-2xl md:rounded-3xl aspect-[16/9] group transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.6)] border border-[#e11438]/20 bg-[#0c0205]"
      >
        {/* Slides Track */}
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              onClick={() => onSelectSlide && onSelectSlide(slide)}
              className="w-full h-full shrink-0 relative cursor-pointer"
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.01] block"
                loading={idx === 0 ? 'eager' : 'lazy'}
                onError={(e) => { e.target.src = '/sureshot_banner.jpg'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white font-bold text-sm sm:text-base drop-shadow-md">
                  {slide.title}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        {slideCount > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous Slide"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-lg z-20"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next Slide"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-xs border border-white/20 cursor-pointer shadow-lg z-20"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots Indicator */}
      {slideCount > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 border-none cursor-pointer ${
                idx === currentIndex
                  ? 'w-7 bg-[#e11438] shadow-[0_0_12px_rgba(225,20,56,0.6)]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
