import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Copy, Check, MessageCircle, FileText, Edit2, X } from 'lucide-react';
import { formatOrderDateTime } from './admin/adminHelpers';

export default function PendingEnrollmentModal({
  isOpen,
  onClose,
  order,
  itemTitle,
  onEditPayment,
  onViewInvoice
}) {
  const [copied, setCopied] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const handleCopy = (text) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleSmoothClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      if (onClose) onClose();
    }, 240);
  };

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleSmoothClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const targetTitle = itemTitle || order?.course?.name || order?.course_name || order?.items?.[0]?.title || 'EduHunters Course';
  const trxId = order?.transactionId || order?.trx_id || 'PENDING';
  const phone = order?.customer?.phone || order?.customer_phone || order?.studentPhone || 'N/A';
  const method = order?.paymentMethodName || order?.payment_method || order?.paymentGateway || 'bKash';
  const amount = order?.totalPaid !== undefined ? order?.totalPaid : (order?.amount || 0);
  const timeInfo = formatOrderDateTime(order?.createdAt || order?.created_at || order?.date);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity duration-240 ease-out cursor-pointer ${
          !isClosing ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleSmoothClose}
      />

      {/* Modal Dialog Card */}
      <div 
        className={`relative w-full max-w-md my-auto flex flex-col rounded-3xl overflow-hidden z-10 border shadow-2xl transition-all duration-240 ${
          !isClosing 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-95 translate-y-2'
        } ${
          isDark 
            ? 'bg-[#120306] border-[#e11438]/25 text-white' 
            : 'bg-white border-amber-200 text-gray-900'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button Top Right */}
        <button 
          type="button"
          onClick={handleSmoothClose}
          className={`absolute right-4 top-4 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer border-none hover:scale-110 active:scale-95 ${
            isDark ? 'bg-white/10 hover:bg-white/20 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Glowing Animated Icon */}
          <div className="text-center pt-2">
            <div className="relative inline-flex items-center justify-center mb-3">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 via-amber-400/30 to-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/20 relative z-10">
                <Clock size={32} className="animate-pulse" />
              </div>
            </div>

            {/* Pulsing Pill */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                ভেরিফিকেশন প্রক্রিয়াধীন · Under Review
              </span>
            </div>

            <h3 className={`text-lg sm:text-xl font-black mt-3 leading-snug ${isDark ? 'text-white' : 'text-gray-900'}`}>
              আপনার এনরোলমেন্ট রিকোয়েস্টটি ইতিমধ্যে পাঠানো হয়েছে!
            </h3>

            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2 leading-relaxed max-w-sm mx-auto">
              আপনার রিকোয়েস্টটি সফলভাবে আমাদের সিস্টেমে জমা হয়েছে এবং বর্তমানে এডমিন ভেরিফিকেশনের জন্য প্রক্রিয়াধীন রয়েছে। সাধারণত <strong>৫ থেকে ১৫ মিনিটের মধ্যে</strong> পেমেন্ট যাচাই করে কোর্সটি আনলক করে দেওয়া হবে।
            </p>
          </div>

          {/* Details Card */}
          <div className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
            isDark ? 'bg-white/[0.03] border-white/10 text-gray-200' : 'bg-amber-50/60 border-amber-200/80 text-gray-800'
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200/60 dark:border-white/10">
              <span className="text-gray-500 dark:text-gray-400">কোর্সের নাম:</span>
              <span className="font-bold text-right ml-2 max-w-[210px] truncate text-slate-900 dark:text-white" title={targetTitle}>
                {targetTitle}
              </span>
            </div>

            {trxId && trxId !== 'PENDING' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">TrxID (ট্রানজ্যাকশন আইডি):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {trxId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(trxId)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-transparent border-none cursor-pointer"
                    title="Copy TrxID"
                  >
                    {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">প্রেরকের নম্বর:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-gray-200">{phone}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">পেমেন্ট মাধ্যম:</span>
              <span className="font-semibold capitalize px-2 py-0.5 rounded bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[11px]">
                {method}
              </span>
            </div>

            {amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">টাকার পরিমাণ:</span>
                <span className="font-black text-[#dc2626] dark:text-[#ff4d6d]">৳{amount}</span>
              </div>
            )}

            {timeInfo.date !== '--' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">পাঠানোর সময়:</span>
                <span className="font-medium text-gray-500 dark:text-gray-400">{timeInfo.full}</span>
              </div>
            )}
          </div>

          {/* Reassurance Banner */}
          <div className={`p-3 rounded-2xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
            isDark ? 'bg-blue-500/10 border-blue-500/25 text-blue-200' : 'bg-blue-50 border-blue-200/90 text-blue-900'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <strong>অনুগ্রহ করে অপেক্ষা করুন:</strong> আপনাকে পুনরায় টাকা পাঠাতে বা নতুন করে রিকোয়েস্ট জমা দিতে হবে না। এডমিন প্যানেল থেকে অ্যাপ্রুভ করার সাথে সাথে কোর্সটি স্বয়ংক্রিয়ভাবে আনলক হয়ে যাবে।
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href={`https://wa.me/8801342227935?text=${encodeURIComponent(`আসসালামু আলাইকুম EduHunters, আমি "${targetTitle}" কোর্সের জন্য এনরোলমেন্ট রিকোয়েস্ট পাঠিয়েছি। আমার TrxID: ${trxId} এবং নম্বর: ${phone}। অনুগ্রহ করে ভেরিফাই করবেন?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white rounded-xl font-bold text-xs border-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 no-underline active:scale-98"
              >
                <MessageCircle size={15} />
                <span>WhatsApp হেল্পলাইন</span>
              </a>

              {onViewInvoice && (
                <button
                  type="button"
                  onClick={onViewInvoice}
                  className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs border cursor-pointer shadow-2xs transition-all flex items-center justify-center gap-1.5 active:scale-98 ${
                    isDark 
                      ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200'
                  }`}
                >
                  <FileText size={15} />
                  <span>ইনভয়েস দেখুন</span>
                </button>
              )}
            </div>

            {onEditPayment && (
              <button
                type="button"
                onClick={onEditPayment}
                className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  isDark
                    ? 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border-white/10'
                    : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200'
                }`}
              >
                <Edit2 size={13} />
                <span>পেমেন্ট তথ্য বা TrxID সংশোধন করতে চান?</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSmoothClose}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs border cursor-pointer transition-all ${
                isDark 
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-white border-zinc-800' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
              }`}
            >
              ঠিক আছে, বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
