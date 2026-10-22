import React, { useState, useMemo, useRef, useEffect } from 'react';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isItemEnrolled, normalizeStr, isPhoneMatch } from '../utils/enrollmentService';
import { initialData } from '../data/mockData';
import { EXAM_CATEGORIES_METADATA } from '../data/examCategoriesData';
import { getUserOrders } from '../services/orderService';
import { fetchSupabaseOrders, isSupabaseConfigured } from '../services/supabaseService';
import InvoiceModal from './InvoiceModal';

const ENGLISH_TITLES = {
  'english_master': 'Master English 50 • Medical & University Complete English Batch',
  'sureshot': 'SureShot Carnival • Final Medical & University Model Test Series',
  'medical': 'Medical Past 11 Years Question Bank (MAT) • Real Exam Experience',
  'rtds': 'RTDS • Rapid Test Delivery System for Medical Prep',
  'gk_course': 'GK Master Series • General Knowledge & Current Affairs',
  'medilogy': 'Medilogy Biology Intensive • Rapid Problem Bank',
  'master-english-30-days': 'Master English in 30 Days • Complete Grammar & Vocab',
  'physics-finishing-touch-series': 'Physics Finishing Touch Series • HSC & Admission',
  'course-1791887161017': 'Physics Finishing Touch Series • HSC & Admission',
  'chemistry-1st-dagano-line': 'Chemistry 1st Paper Textbook Marking & Key Concepts',
  'zoology-dagano-line-medical': 'Zoology Medical Textbook Marking & Review Series',
  'hsc-26-27-step-by-step-guideline': 'HSC 26-27 Complete Step-by-Step Guideline',
  'bundle-medical-mega-combo': 'Medical Dream Combo Pack • 4 Intensive Batches'
};

const ENGLISH_SUBTITLES = {
  'english_master': 'Comprehensive English preparation for Medical, University Admission & BCS exams.',
  'sureshot': 'Complete final model test series for Medical & Dental Admission test.',
  'medical': 'Authentic past medical admission test papers from 2013 to 2024 with detailed analytics.',
  'rtds': 'Rapid subject-wise daily mock tests with instant national leaderboard ranking.',
  'gk_course': 'Complete Bangladesh & International general knowledge with regular updates.',
  'medilogy': 'Targeted biology high-yield questions for top medical admission scores.',
  'master-english-30-days': 'Master grammar, vocabulary, and sentence structures with 30 focused lectures.',
  'physics-finishing-touch-series': 'Complete Physics 1st Paper Finishing Touch video lectures, notes & problem solving.',
  'course-1791887161017': 'Complete Physics 1st Paper Finishing Touch video lectures, notes & problem solving.',
  'chemistry-1st-dagano-line': 'Line-by-line textbook analysis and high-yield topic breakdown for board and admission.',
  'zoology-dagano-line-medical': 'Comprehensive zoology textbook marking with memory hacks and medical questions.',
  'hsc-26-27-step-by-step-guideline': 'Essential roadmap and preparation strategy for HSC 2026 and 2027 science students.',
  'bundle-medical-mega-combo': 'Full access to SureShot, Medical Past Papers, RTDS, and Medilogy in one bundle.'
};

function formatEnglishTitle(item) {
  const key = (item.key || item.id || item.slug || '').toLowerCase();
  if (ENGLISH_TITLES[key]) return ENGLISH_TITLES[key];

  const rawTitle = item.title || item.name || item.displayTitle || '';
  const norm = normalizeStr(rawTitle);

  for (const [k, v] of Object.entries(ENGLISH_TITLES)) {
    if (norm.includes(k) || k.includes(norm)) return v;
  }

  // If title has Bengali characters, translate by keywords
  if (/[\u0980-\u09FF]/.test(rawTitle)) {
    if (rawTitle.includes('ইংলিশ') || rawTitle.includes('ইংরেজি') || rawTitle.includes('English')) {
      return 'Master English • Admission & Academic Complete Batch';
    }
    if (rawTitle.includes('পদার্থ') || rawTitle.includes('Physics')) {
      return 'Physics Finishing Touch Series • HSC & Admission';
    }
    if (rawTitle.includes('রসায়ন') || rawTitle.includes('Chemistry')) {
      return 'Chemistry 1st Paper Textbook Marking & Concepts';
    }
    if (rawTitle.includes('প্রাণিবিজ্ঞান') || rawTitle.includes('উদ্ভিদ') || rawTitle.includes('Biology')) {
      return 'Biology Medical Preparation & Review Series';
    }
    if (rawTitle.includes('মেডিকেল') || rawTitle.includes('Medical')) {
      return 'Medical Admission Question Bank & Model Tests';
    }
    if (rawTitle.includes('Sure Shot') || rawTitle.includes('কার্নিভাল') || rawTitle.includes('কার্নিভ্যাল')) {
      return 'SureShot Carnival • Final Medical & University Model Tests';
    }
    return 'Academic Course Program • Full Digital Access';
  }

  return rawTitle;
}

function formatEnglishSubtitle(item) {
  const key = (item.key || item.id || item.slug || '').toLowerCase();
  if (ENGLISH_SUBTITLES[key]) return ENGLISH_SUBTITLES[key];

  const rawSub = item.subtitle || item.tagline || item.displaySubtitle || '';
  if (/[\u0980-\u09FF]/.test(rawSub)) {
    if (item.itemType === 'exam') {
      return 'Live model tests, real-time OMR simulation & performance analytics.';
    }
    return item.instructor ? `Instructor: ${item.instructor} • High Definition Video Lectures` : 'Full video lectures, lecture notes, and curriculum access.';
  }

  return rawSub || (item.itemType === 'exam' ? 'Live model tests, real-time OMR simulation & performance analytics.' : 'Full video lectures, lecture notes, and curriculum access.');
}

export default function DashboardPage({
  data = {},
  onNavigateHome,
  onNavigateCourse,
  onNavigateCoursePlayer,
  onNavigateExams,
  onNavigateLeaderboard,
  onNavigateStore,
  onNavigateAbout,
  onNavigateDevices,
  onNavigateOrders,
  onNavigatePolicies,
  onOpenAdmin,
  onLoginClick,
  onOpenProfile
}) {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'courses' | 'exams' | 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [syncVersion, setSyncVersion] = useState(0);
  const [orders, setOrders] = useState(() => getUserOrders());
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const EXAM_BATCH_KEYS = useMemo(() => new Set(['sureshot', 'medical', 'rtds', 'english_master', 'gk_course', 'medilogy']), []);

  // Synchronize orders across events & cross-tab BroadcastChannel
  useEffect(() => {
    const handleSync = () => {
      setOrders(getUserOrders());
      setSyncVersion(v => v + 1);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('eh:enrollment_approved', handleSync);
      window.addEventListener('eh:enrollment_updated', handleSync);
      window.addEventListener('eh:orders_updated', handleSync);
      window.addEventListener('eh:new_enrollment', handleSync);
      window.addEventListener('storage', handleSync);
      window.addEventListener('eduhunters_data_updated', handleSync);
    }

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (e) => {
          if (
            e.data?.type === 'ENROLLMENT_APPROVED' || 
            e.data?.type === 'ENROLLMENT_UPDATED' || 
            e.data?.type === 'NEW_ENROLLMENT_ORDER' ||
            e.data?.type === 'DATA_SYNC'
          ) {
            handleSync();
          }
        };
      } catch (err) {}
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('eh:enrollment_approved', handleSync);
        window.removeEventListener('eh:enrollment_updated', handleSync);
        window.removeEventListener('eh:orders_updated', handleSync);
        window.removeEventListener('eh:new_enrollment', handleSync);
        window.removeEventListener('storage', handleSync);
        window.removeEventListener('eduhunters_data_updated', handleSync);
      }
      if (bc) bc.close();
    };
  }, []);

  // Cross-device cloud sync: Fetch user orders from Supabase on mount
  useEffect(() => {
    if (currentUser?.email && isSupabaseConfigured) {
      fetchSupabaseOrders().then(cloudOrders => {
        if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
          setOrders(prev => {
            const combined = [...prev];
            cloudOrders.forEach(co => {
              if (!combined.some(o => o.id === co.id || o.transactionId === co.transactionId)) {
                combined.push(co);
              }
            });
            return combined;
          });
          setSyncVersion(v => v + 1);
        }
      }).catch(() => {});
    }
  }, [currentUser?.email]);

  // Combined master catalog of all available academic courses
  const allCoursesCatalog = useMemo(() => {
    const list = [
      ...(Array.isArray(data?.courses) ? data.courses : []),
      ...(initialData?.courses || [])
    ];
    const map = new Map();
    list.forEach(c => {
      if (!c) return;
      const key = c.id || c.slug || c.title;
      if (key && !map.has(key)) map.set(key, c);
    });
    return Array.from(map.values());
  }, [data?.courses]);

  // Combined master catalog of all available exam batches
  const allExamBatchesCatalog = useMemo(() => {
    const list = [
      ...(Array.isArray(data?.examBatches) && data.examBatches.length > 0 ? data.examBatches : []),
      ...(EXAM_CATEGORIES_METADATA || [])
    ];
    const map = new Map();
    list.forEach(b => {
      if (!b) return;
      const key = b.key || b.id || b.title;
      if (key && !map.has(key)) map.set(key, b);
    });
    return Array.from(map.values());
  }, [data?.examBatches]);

  // User-filtered orders belonging to currentUser
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    const uEmail = (currentUser.email || '').toLowerCase().trim();
    const uPhone = (currentUser.whatsapp || currentUser.phone || currentUser.phoneNumber || '').replace(/[^0-9]/g, '');
    const uUid = currentUser.uid || currentUser.id;

    return orders.filter(ord => {
      const ordEmail = (ord.customer?.email || ord.customer_email || '').toLowerCase().trim();
      const ordPhone = (ord.customer?.phone || ord.customer_phone || '').replace(/[^0-9]/g, '');
      const ordUid = ord.userId || ord.customer?.uid;

      return (uEmail && ordEmail && uEmail === ordEmail) ||
             isPhoneMatch(uPhone, ordPhone) ||
             (uUid && ordUid && uUid === ordUid);
    });
  }, [orders, currentUser]);

  // 1. Resolve All Active Enrolled Academic Courses
  const enrolledCourses = useMemo(() => {
    if (!currentUser) return [];

    const foundCourses = [];
    const seen = new Set();

    // A. Check against catalog with isItemEnrolled
    allCoursesCatalog.forEach(course => {
      const isExam = course.isExamBatch ||
                     course.category === 'EXAM BATCH' ||
                     EXAM_BATCH_KEYS.has(course.id) ||
                     EXAM_BATCH_KEYS.has(course.slug) ||
                     EXAM_BATCH_KEYS.has(course.key);
      if (isExam) return;

      if (isItemEnrolled(course, currentUser, data, { forDashboard: true })) {
        const id = course.id || course.slug || course.title;
        if (id && !seen.has(id)) {
          seen.add(id);
          foundCourses.push({
            ...course,
            itemType: 'course',
            status: 'active',
            displayTitle: formatEnglishTitle(course),
            displaySubtitle: formatEnglishSubtitle({ ...course, itemType: 'course' }),
            displayImage: course.image || course.thumbnailUrl || course.thumbnail || '/master_english_30_days.png',
            actionLabel: 'Continue Learning',
            secondaryLabel: 'Curriculum'
          });
        }
      }
    });

    // B. Check currentUser.enrolledCourses array
    const userExplicitCourses = Array.isArray(currentUser.enrolledCourses) ? currentUser.enrolledCourses : [];
    userExplicitCourses.forEach(entry => {
      if (!entry || entry === 'All Courses (Super Admin Pass)') return;
      const str = String(entry).trim();
      const norm = normalizeStr(str);

      const alreadyAdded = foundCourses.some(fc => 
        fc.id === str || fc.slug === str || fc.title === str || normalizeStr(fc.displayTitle) === norm
      );
      if (alreadyAdded) return;

      const catMatch = allCoursesCatalog.find(c => 
        c.id === str || c.slug === str || c.title === str || normalizeStr(c.title) === norm
      );

      if (catMatch) {
        const id = catMatch.id || catMatch.slug || catMatch.title;
        if (!seen.has(id)) {
          seen.add(id);
          foundCourses.push({
            ...catMatch,
            itemType: 'course',
            status: 'active',
            displayTitle: formatEnglishTitle(catMatch),
            displaySubtitle: formatEnglishSubtitle({ ...catMatch, itemType: 'course' }),
            displayImage: catMatch.image || catMatch.thumbnailUrl || '/master_english_30_days.png',
            actionLabel: 'Continue Learning',
            secondaryLabel: 'Curriculum'
          });
        }
        return;
      }

      const isExam = EXAM_BATCH_KEYS.has(str) || EXAM_BATCH_KEYS.has(norm);
      if (isExam) return;

      const id = `enrolled_${norm}`;
      if (!seen.has(id)) {
        seen.add(id);
        const englishTitle = formatEnglishTitle({ title: str });
        foundCourses.push({
          id: id,
          slug: str.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: englishTitle,
          itemType: 'course',
          status: 'active',
          displayTitle: englishTitle,
          displaySubtitle: 'Enrolled Academic Program • Lifetime Access',
          displayImage: '/master_english_30_days.png',
          actionLabel: 'Continue Learning',
          secondaryLabel: 'Curriculum'
        });
      }
    });

    // C. Check approved orders for this user
    myOrders.forEach(ord => {
      const isApproved = ord.isApproved || (ord.status || '').toUpperCase() === 'PAID' || (ord.status || '').toLowerCase() === 'completed';
      if (!isApproved) return;

      const isExam = ord.targetType === 'exam' || ord.course?.targetType === 'exam' || (ord.categoryKey && EXAM_BATCH_KEYS.has(ord.categoryKey));
      if (isExam) return;

      const title = ord.course?.name || ord.course?.title || ord.items?.[0]?.title;
      const slug = ord.course?.slug || ord.course_slug;
      const id = ord.course?.id;
      const norm = normalizeStr(title || slug || id || '');

      const alreadyAdded = foundCourses.some(fc => 
        (id && fc.id === id) || (slug && fc.slug === slug) || (norm && normalizeStr(fc.displayTitle) === norm)
      );

      if (!alreadyAdded && title) {
        const catMatch = allCoursesCatalog.find(c => 
          (id && c.id === id) || (slug && c.slug === slug) || normalizeStr(c.title) === norm
        );
        const cardTitle = formatEnglishTitle(catMatch || { title });
        const cardImage = catMatch?.image || ord.course?.image || '/master_english_30_days.png';
        const cardSlug = catMatch?.slug || slug || id || 'physics-finishing-touch-series';

        foundCourses.push({
          ...(catMatch || {}),
          id: id || cardSlug,
          slug: cardSlug,
          title: cardTitle,
          itemType: 'course',
          status: 'active',
          displayTitle: cardTitle,
          displaySubtitle: formatEnglishSubtitle(catMatch || { itemType: 'course' }),
          displayImage: cardImage,
          actionLabel: 'Continue Learning',
          secondaryLabel: 'Curriculum'
        });
      }
    });

    return foundCourses;
  }, [allCoursesCatalog, currentUser, data, EXAM_BATCH_KEYS, myOrders, syncVersion]);

  // 2. Resolve All Active Enrolled Exam Batches
  const enrolledBatches = useMemo(() => {
    if (!currentUser) return [];

    const foundBatches = [];
    const seen = new Set();

    // A. Check catalog with isItemEnrolled
    allExamBatchesCatalog.forEach(batch => {
      if (isItemEnrolled(batch, currentUser, data, { forDashboard: true })) {
        const key = batch.key || batch.id || batch.title;
        if (key && !seen.has(key)) {
          seen.add(key);
          foundBatches.push({
            ...batch,
            itemType: 'exam',
            status: 'active',
            displayTitle: formatEnglishTitle(batch),
            displaySubtitle: formatEnglishSubtitle({ ...batch, itemType: 'exam' }),
            displayImage: batch.bannerImage || batch.image || '/sureshot_banner.jpg',
            actionLabel: 'Enter Exam Batch',
            secondaryLabel: 'Routine & Tests'
          });
        }
      }
    });

    // B. Check currentUser.enrolledBatches
    const userExplicitBatches = Array.isArray(currentUser.enrolledBatches) ? currentUser.enrolledBatches : [];
    userExplicitBatches.forEach(entry => {
      if (!entry) return;
      const str = String(entry).trim();
      const norm = normalizeStr(str);

      const alreadyAdded = foundBatches.some(fb => 
        fb.key === str || fb.id === str || normalizeStr(fb.displayTitle) === norm
      );
      if (alreadyAdded) return;

      const catMatch = allExamBatchesCatalog.find(b => 
        b.key === str || b.id === str || normalizeStr(b.title) === norm
      );
      if (catMatch) {
        const key = catMatch.key || catMatch.id;
        if (!seen.has(key)) {
          seen.add(key);
          foundBatches.push({
            ...catMatch,
            itemType: 'exam',
            status: 'active',
            displayTitle: formatEnglishTitle(catMatch),
            displaySubtitle: formatEnglishSubtitle({ ...catMatch, itemType: 'exam' }),
            displayImage: catMatch.bannerImage || catMatch.image || '/sureshot_banner.jpg',
            actionLabel: 'Enter Exam Batch',
            secondaryLabel: 'Routine & Tests'
          });
        }
      }
    });

    // C. Check approved exam orders
    myOrders.forEach(ord => {
      const isApproved = ord.isApproved || (ord.status || '').toUpperCase() === 'PAID' || (ord.status || '').toLowerCase() === 'completed';
      if (!isApproved) return;

      const isExam = ord.targetType === 'exam' || ord.course?.targetType === 'exam' || (ord.categoryKey && EXAM_BATCH_KEYS.has(ord.categoryKey));
      if (!isExam) return;

      const title = ord.course?.name || ord.course?.title || ord.items?.[0]?.title;
      const key = ord.categoryKey || ord.course?.key || ord.course?.slug || ord.course?.id;
      const norm = normalizeStr(title || key || '');

      const alreadyAdded = foundBatches.some(fb => 
        (key && (fb.key === key || fb.id === key)) || (norm && normalizeStr(fb.displayTitle) === norm)
      );

      if (!alreadyAdded && title) {
        const catMatch = allExamBatchesCatalog.find(b => 
          (key && (b.key === key || b.id === key)) || normalizeStr(b.title) === norm
        );
        foundBatches.push({
          ...(catMatch || {}),
          key: key || 'sureshot',
          id: key || 'sureshot',
          title: catMatch?.title || title,
          itemType: 'exam',
          status: 'active',
          displayTitle: formatEnglishTitle(catMatch || { key, title }),
          displaySubtitle: formatEnglishSubtitle(catMatch || { itemType: 'exam' }),
          displayImage: catMatch?.bannerImage || ord.course?.image || '/sureshot_banner.jpg',
          actionLabel: 'Enter Exam Batch',
          secondaryLabel: 'Routine & Tests'
        });
      }
    });

    return foundBatches;
  }, [allExamBatchesCatalog, currentUser, data, EXAM_BATCH_KEYS, myOrders, syncVersion]);

  // 3. Resolve Pending Verification Enrollments (Submitted by student, awaiting admin approval)
  const pendingEnrollments = useMemo(() => {
    if (!currentUser) return [];

    const list = [];
    const seen = new Set();

    myOrders.forEach(ord => {
      const isPending = (ord.status || '').toUpperCase() === 'PENDING' && !ord.isApproved;
      if (!isPending) return;

      const title = ord.course?.name || ord.course?.title || ord.items?.[0]?.title || 'Course Enrollment';
      const norm = normalizeStr(title);

      const isActiveCourse = enrolledCourses.some(c => normalizeStr(c.displayTitle) === norm || (ord.course?.slug && c.slug === ord.course.slug));
      const isActiveBatch = enrolledBatches.some(b => normalizeStr(b.displayTitle) === norm || (ord.categoryKey && b.key === ord.categoryKey));
      if (isActiveCourse || isActiveBatch) return;

      const id = ord.id || `pending_${norm}`;
      if (!seen.has(id)) {
        seen.add(id);
        const isExam = ord.targetType === 'exam' || (ord.categoryKey && EXAM_BATCH_KEYS.has(ord.categoryKey));
        const formattedTitle = formatEnglishTitle({ key: ord.categoryKey, title });
        list.push({
          ...ord,
          itemType: isExam ? 'exam' : 'course',
          status: 'pending',
          displayTitle: formattedTitle,
          displaySubtitle: `Order #${ord.invoiceNumber || ord.id.slice(-6)} • Payment verification in progress`,
          displayImage: ord.course?.image || (isExam ? '/sureshot_banner.jpg' : '/master_english_30_days.png'),
          actionLabel: 'Verification in Progress',
          secondaryLabel: 'View Invoice',
          orderData: ord
        });
      }
    });

    return list;
  }, [currentUser, myOrders, enrolledCourses, enrolledBatches, EXAM_BATCH_KEYS]);

  // 4. Combined Filtered Items based on active tab and search query
  const displayedItems = useMemo(() => {
    let items = [];

    if (activeTab === 'all') {
      items = [...enrolledCourses, ...enrolledBatches, ...pendingEnrollments];
    } else if (activeTab === 'courses') {
      items = enrolledCourses;
    } else if (activeTab === 'exams') {
      items = enrolledBatches;
    } else if (activeTab === 'pending') {
      items = pendingEnrollments;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(it => 
        (it.displayTitle && it.displayTitle.toLowerCase().includes(q)) ||
        (it.displaySubtitle && it.displaySubtitle.toLowerCase().includes(q))
      );
    }

    return items;
  }, [activeTab, enrolledCourses, enrolledBatches, pendingEnrollments, searchQuery]);

  const totalActiveCount = enrolledCourses.length + enrolledBatches.length;
  const totalCount = totalActiveCount + pendingEnrollments.length;

  const tabRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  // Dynamic sliding indicator measurement for active tab pill
  useEffect(() => {
    const updateIndicator = () => {
      const el = tabRefs.current[activeTab];
      if (el) {
        setIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, totalCount, enrolledCourses.length, enrolledBatches.length, pendingEnrollments.length]);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#070102] text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Top Main Sticky Navbar */}
      <Navbar
        activePage="dashboard"
        siteSettings={data?.siteSettings}
        onNavigateHome={onNavigateHome}
        onNavigateDashboard={() => {}}
        onNavigateCourse={onNavigateCourse}
        onNavigateExams={onNavigateExams}
        onNavigateLeaderboard={onNavigateLeaderboard}
        onNavigateStore={onNavigateStore}
        onNavigateAbout={onNavigateAbout}
        onNavigateDevices={onNavigateDevices}
        onNavigateOrders={onNavigateOrders}
        onNavigatePolicies={onNavigatePolicies}
        onOpenAdmin={onOpenAdmin}
        onLoginClick={onLoginClick}
        onOpenProfile={onOpenProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#e11438]/15 text-[#ff4d6d] border border-[#e11438]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d6d] animate-pulse"></span>
              Student Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Learning Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {currentUser
              ? `Welcome back, ${currentUser.displayName || currentUser.name || currentUser.email}. Access your enrolled lectures, exam batches, and study routine.`
              : 'Sign in to access your enrolled courses, video lectures, and live examination schedule.'}
          </p>
        </div>

        {/* Quick Metric Cards Banner */}
        {currentUser && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/[0.03] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Enrolled Courses</div>
              <div className="text-2xl font-black text-[#e11438]">{enrolledCourses.length}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Active Lectures</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/[0.03] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Exam Batches</div>
              <div className="text-2xl font-black text-amber-500">{enrolledBatches.length}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Live Model Tests</div>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${
              pendingEnrollments.length > 0
                ? (isDark ? 'bg-amber-950/20 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-800')
                : (isDark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200 shadow-sm')
            }`}>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1 opacity-80">Pending Verification</div>
              <div className="text-2xl font-black">{pendingEnrollments.length}</div>
              <div className="text-[10px] opacity-75 mt-0.5">{pendingEnrollments.length > 0 ? 'Admin Reviewing' : 'All Approved'}</div>
            </div>

            <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
              isDark ? 'bg-white/[0.03] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 shadow-sm'
            }`}>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Account Status</div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Verified Student
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenProfile) onOpenProfile();
                    else window.dispatchEvent(new CustomEvent('eh_open_profile_modal'));
                  }}
                  className="text-[11px] font-semibold text-[#ff4d6d] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Edit Profile
                </button>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 truncate">{currentUser.email}</div>
            </div>
          </div>
        )}

        {/* Guest / Not Signed In State */}
        {!currentUser ? (
          <div className={`p-8 sm:p-12 rounded-3xl border text-center max-w-xl mx-auto my-12 ${
            isDark ? 'bg-[#100306] border-white/10' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <div className="w-14 h-14 rounded-2xl bg-[#e11438]/10 text-[#e11438] border border-[#e11438]/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed max-w-md mx-auto">
              Please sign in with your student email to view your active course enrollments, lecture player, and exam batches.
            </p>
            <button
              onClick={() => onLoginClick && onLoginClick()}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#e11438] to-[#ff2a55] text-white font-bold text-xs sm:text-sm hover:opacity-95 shadow-md active:scale-98 transition-all cursor-pointer border-none"
            >
              Sign In to Account
            </button>
          </div>
        ) : (
          <>
            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Tab Pills with Smooth Sliding Indicator */}
              <div className={`relative inline-flex items-center p-1 rounded-2xl border backdrop-blur-md transition-colors ${
                isDark ? 'bg-white/[0.04] border-white/10' : 'bg-gray-100 border-gray-200'
              }`}>
                {/* Active Sliding Pill Indicator */}
                <div 
                  className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] shadow-[0_2px_14px_rgba(225,20,56,0.45)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                    opacity: indicatorStyle.opacity
                  }}
                />

                {[
                  { id: 'all', label: 'All Items', count: totalCount },
                  { id: 'courses', label: 'Courses', count: enrolledCourses.length },
                  { id: 'exams', label: 'Exam Batches', count: enrolledBatches.length },
                  ...(pendingEnrollments.length > 0 ? [{ id: 'pending', label: 'Pending Approval', count: pendingEnrollments.length }] : [])
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={(el) => { tabRefs.current[tab.id] = el; }}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative z-10 inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer border-none bg-transparent select-none whitespace-nowrap ${
                        isActive
                          ? 'text-white font-bold'
                          : isDark
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <span className="tracking-tight">{tab.label}</span>
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : isDark
                            ? 'bg-white/[0.06] text-gray-400'
                            : 'bg-black/[0.06] text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Minimal Search Input */}
              {totalCount > 0 && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search enrolled courses..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-colors border ${
                      isDark
                        ? 'bg-white/[0.04] border-white/10 text-white placeholder-gray-500 focus:border-[#e11438]'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-[#e11438]'
                    }`}
                  />
                  <svg className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              )}
            </div>

            {/* Enrolled Items Grid */}
            {displayedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedItems.map((item, idx) => {
                  const isCourse = item.itemType === 'course';
                  const isPending = item.status === 'pending';
                  const identifier = item.id || item.slug || item.key;

                  return (
                    <div
                      key={`${item.itemType}_${identifier || idx}_${item.status}`}
                      className={`group rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:translate-y-[-3px] ${
                        isDark
                          ? 'bg-[#100306]/75 border-white/10 hover:border-white/25 hover:shadow-[0_12px_35px_rgba(0,0,0,0.7)]'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xl'
                      }`}
                    >
                      {/* Top Part: Thumbnail & Content */}
                      <div>
                        {/* Card Thumbnail */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black/40 shrink-0">
                          <img
                            src={item.displayImage}
                            alt={item.displayTitle}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = isCourse ? '/master_english_30_days.png' : '/sureshot_banner.jpg';
                            }}
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white border border-white/15">
                              {isCourse ? 'Course' : 'Exam Batch'}
                            </span>

                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md bg-amber-500/25 text-amber-300 border border-amber-500/40">
                                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                                </svg>
                                <span>Pending Verification</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Active Enrollment</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-5">
                          <h3 className="text-base sm:text-lg font-bold leading-snug line-clamp-2 mb-1.5 group-hover:text-[#ff4d6d] transition-colors">
                            {item.displayTitle}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {item.displaySubtitle}
                          </p>

                          {/* Status / Meta bar */}
                          {isPending ? (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed mb-1">
                              Payment submitted • Admin verification in progress (usually 5–15 mins).
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              <span>Full Lifetime Access • Curriculum & Lectures Unlocked</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons at Bottom */}
                      <div className="p-5 pt-0">
                        <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setSelectedInvoiceOrder(item.orderData || item)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/15"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span>View Invoice</span>
                              </button>
                            </>
                          ) : isCourse ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onNavigateCoursePlayer) {
                                    onNavigateCoursePlayer(identifier);
                                  } else if (onNavigateCourse) {
                                    onNavigateCourse(identifier);
                                  }
                                }}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer border-none"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span>Continue Learning</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onNavigateCourse && onNavigateCourse(identifier)}
                                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                  isDark
                                    ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-gray-300 hover:text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                                }`}
                                title="View Course Details"
                              >
                                Overview
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => onNavigateExams && onNavigateExams(item.key || identifier)}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e11438] to-[#ff2a55] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all cursor-pointer border-none"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                  <path d="m9 14 2 2 4-4" />
                                </svg>
                                <span>Enter Exam Batch</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Enrollments State */
              <div className={`p-10 sm:p-14 rounded-3xl border text-center max-w-lg mx-auto my-12 ${
                isDark ? 'bg-[#100306]/50 border-white/10' : 'bg-white border-gray-200 shadow-sm'
              }`}>
                <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 text-gray-400 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <line x1="10" y1="6" x2="16" y2="6" />
                    <line x1="10" y1="10" x2="16" y2="10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-1.5">No Active Enrollments</h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  {searchQuery.trim()
                    ? 'No enrolled courses or exam batches match your search criteria.'
                    : "You have not enrolled in any courses or exam batches yet. Explore our comprehensive course catalog to begin learning."}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateCourse && onNavigateCourse()}
                    className="px-5 py-2.5 rounded-full bg-[#e11438] hover:bg-[#ff2a55] text-white font-bold text-xs transition-colors cursor-pointer border-none"
                  >
                    Explore Courses
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateExams && onNavigateExams()}
                    className={`px-5 py-2.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                      isDark ? 'bg-white/[0.04] border-white/10 text-gray-300 hover:text-white' : 'bg-gray-100 border-gray-300 text-gray-800'
                    }`}
                  >
                    Exam Batches
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Invoice Modal for Viewing Order Receipt */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}

      {/* Minimal Footer */}
      <footer className={`border-t py-8 text-center text-xs transition-colors ${
        isDark ? 'bg-[#060102] border-white/10 text-gray-500' : 'bg-gray-100 border-gray-200 text-gray-600'
      }`}>
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} Edu Hunters. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
