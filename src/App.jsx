import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { getAdminSession, clearAdminSession } from './services/adminAuthService';
import { initialData, isZenithCopiedCourse } from './data/mockData';
import { EXAM_CATEGORIES_METADATA } from './data/examCategoriesData';
import { physicsFinishingTouchCourseData } from './data/physicsFinishingTouchData';
import { fetchSupabaseSiteData, saveSupabaseSiteData, subscribeToSupabaseSiteData } from './services/supabaseService';
import { grantCourseAccess, syncFinishingTouchStudentsWithAnushiloni } from './utils/enrollmentService';

// Direct eager imports for critical initial render
import HomePage from './components/HomePage';
import CoursesPage from './components/CoursesPage';

// Lazy loaded page components for optimal performance & code splitting
const ExamsPage = lazy(() => import('./components/ExamsPage'));
const BundleDetailPage = lazy(() => import('./components/BundleDetailPage'));
const CoursePlayerPage = lazy(() => import('./components/CoursePlayerPage'));
const BiologyCoursePage = lazy(() => import('./components/BiologyCoursePage'));
const StorePage = lazy(() => import('./components/StorePage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const DevicesPage = lazy(() => import('./components/DevicesPage'));
const DashboardPage = lazy(() => import('./components/DashboardPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const LeaderboardPage = lazy(() => import('./components/LeaderboardPage'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

import AdminAuthModal from './components/AdminAuthModal';
import LegalPoliciesPage from './components/LegalPoliciesPage';
import PreloaderScreen from './components/PreloaderScreen';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';

// Bulletproof Error Boundary matching live website
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Page render error caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0205] text-white font-sans text-center">
          <div className="max-w-md w-full bg-[#160307] border border-[#e11438]/30 rounded-3xl p-8 shadow-2xl space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#e11438]/15 border border-[#e11438]/30 flex items-center justify-center text-[#ff3366] text-2xl font-bold">
              !
            </div>
            <h2 className="text-xl font-black text-white">পেইজটি লোড হতে সমস্যা হয়েছে</h2>
            <p className="text-sm text-gray-300">
              অনুগ্রহ করে পেইজটি রিফ্রেশ করুন অথবা হোমপেইজে ফিরে যান।
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full bg-[#dc2626] text-white font-bold text-sm hover:brightness-110 transition-all cursor-pointer border-none"
              >
                পেইজ রিফ্রেশ করুন
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
                className="px-5 py-2.5 rounded-full bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all cursor-pointer border border-white/20"
              >
                হোমে যান
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Accounting & Order helper utilities
const getDeletedOrdersSet = () => {
  try {
    const deletedOrders = JSON.parse(localStorage.getItem('eh_deleted_orders') || '[]');
    const deletedTrx = JSON.parse(localStorage.getItem('eh_deleted_transactions') || '[]');
    const set = new Set([...(Array.isArray(deletedOrders) ? deletedOrders : []), ...(Array.isArray(deletedTrx) ? deletedTrx : [])]);
    Array.from(set).forEach(item => {
      if (typeof item === 'string') set.add(item.replace(/^(TRX-|st-)/, ''));
    });
    return set;
  } catch (e) {
    return new Set();
  }
};

const getTrxAmountOverrides = () => {
  try {
    return JSON.parse(localStorage.getItem('eh_trx_amount_overrides') || '{}');
  } catch (e) {
    return {};
  }
};

const applyTrxOverride = (trx, overrides) => {
  if (!trx || !overrides) return trx;
  const cleanId = (trx.id || '').replace(/^(TRX-|st-)/, '');
  const cleanOrderId = (trx.orderId || '').replace(/^(TRX-|st-)/, '');
  const overrideAmount = overrides[trx.id] ?? overrides[trx.orderId] ?? overrides[trx.trxId] ?? overrides[trx.invoiceNumber] ?? overrides[cleanId] ?? overrides[cleanOrderId];
  return (overrideAmount !== undefined && !isNaN(Number(overrideAmount))) ? { ...trx, amount: Number(overrideAmount) } : trx;
};

const ACCOUNTING_RESET_DATE = '2026-10-22T10:15:00.000Z';

const getAccountingResetInfo = () => {
  try {
    let resetAt = localStorage.getItem('eh_accounting_reset_at');
    if (!resetAt || new Date(resetAt).getTime() < new Date(ACCOUNTING_RESET_DATE).getTime()) {
      resetAt = ACCOUNTING_RESET_DATE;
      localStorage.setItem('eh_accounting_reset_at', resetAt);
    }
    const legacyIds = JSON.parse(localStorage.getItem('eh_accounting_legacy_ids') || '[]');
    return { resetAt, legacyIdsSet: new Set(legacyIds) };
  } catch (e) {
    return { resetAt: ACCOUNTING_RESET_DATE, legacyIdsSet: new Set() };
  }
};

const isHistoricalTrx = (trx, resetInfo) => {
  if (!trx) return false;
  if (trx.isHistorical || trx.beforeReset) return true;
  const info = resetInfo || getAccountingResetInfo();
  if (info.legacyIdsSet && info.legacyIdsSet.size > 0) {
    if (info.legacyIdsSet.has(trx.id) || info.legacyIdsSet.has(trx.orderId) || (trx.trxId && info.legacyIdsSet.has(trx.trxId))) return true;
    const cleanId = typeof trx.id === 'string' ? trx.id.replace(/^(TRX-|st-)/, '') : '';
    const cleanOrderId = typeof trx.orderId === 'string' ? trx.orderId.replace(/^(TRX-|st-)/, '') : '';
    if ((cleanId && info.legacyIdsSet.has(cleanId)) || (cleanOrderId && info.legacyIdsSet.has(cleanOrderId))) return true;
  }
  const resetMs = info.resetAt ? new Date(info.resetAt).getTime() : new Date(ACCOUNTING_RESET_DATE).getTime();
  if (trx.createdAt) return new Date(trx.createdAt).getTime() <= resetMs;
  if (trx.date) {
    const dMs = new Date(trx.date).getTime();
    if (!isNaN(dMs)) return dMs <= resetMs;
  }
  return true;
};

export default function App() {
  const { isDark } = useTheme();
  const { currentUser } = useAuth();

  // Active admin session state
  const [adminUser, setAdminUser] = useState(() => {
    const session = getAdminSession();
    if (session) return session;
    try {
      const rawUser = localStorage.getItem('eh_current_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (u && (u.role === 'admin' || (u.email || '').toLowerCase() === 'admin@eduhunters.com')) {
          const autoAdmin = {
            id: u.uid || u.id || 'admin_user',
            name: u.displayName || u.name || 'Admin',
            email: (u.email || 'admin@eduhunters.com').toLowerCase(),
            role: 'super_admin',
            loginAt: new Date().toISOString()
          };
          try { localStorage.setItem('eh_admin_session', JSON.stringify(autoAdmin)); } catch (e) {}
          return autoAdmin;
        }
      }
    } catch (e) {}
    return null;
  });

  // Keep adminUser in sync if currentUser has admin role
  useEffect(() => {
    if (currentUser && (currentUser.role === 'admin' || (currentUser.email || '').toLowerCase() === 'admin@eduhunters.com')) {
      setAdminUser(prev => {
        if (prev) return prev;
        const autoAdmin = {
          id: currentUser.uid || currentUser.id || 'admin_user',
          name: currentUser.displayName || currentUser.name || 'Admin',
          email: (currentUser.email || 'admin@eduhunters.com').toLowerCase(),
          role: 'super_admin',
          loginAt: new Date().toISOString()
        };
        try { localStorage.setItem('eh_admin_session', JSON.stringify(autoAdmin)); } catch (e) {}
        return autoAdmin;
      });
    }
  }, [currentUser]);

  // URL Routing States
  const [courseId, setCourseId] = useState(() => {
    try {
      const p = (window.location.pathname || '').toLowerCase();
      if (p.startsWith('/courses/') && p.length > 9 && !p.includes('[object')) {
        let slug = p.split('/courses/')[1] || '';
        if (slug.includes('/watch')) slug = slug.split('/watch')[0];
        if (slug.includes('/lecture')) slug = slug.split('/lecture')[0];
        return slug || null;
      }
    } catch (e) {}
    return null;
  });

  const [initialLesson, setInitialLesson] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const v = sp.get('v') || sp.get('lesson');
      if (v !== null) return isNaN(Number(v)) ? v : Number(v);
    } catch (e) {}
    return null;
  });

  const [selectedBundleId, setSelectedBundleId] = useState(() => {
    try {
      const p = (window.location.pathname || '').toLowerCase();
      if (p.startsWith('/bundles/')) return p.split('/bundles/')[1] || null;
      if (p.startsWith('/bundle/')) return p.split('/bundle/')[1] || null;
    } catch (e) {}
    return null;
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    try {
      let cat = new URLSearchParams(window.location.search).get('category') || null;
      if (cat === 'rtds' || cat === 'onushiloni') {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set('category', 'anushiloni');
          window.history.replaceState(null, '', url.toString());
        } catch (e) {}
        return 'anushiloni';
      }
      return cat;
    } catch (e) {
      return null;
    }
  });

  const [fromBundle, setFromBundle] = useState(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('from') === 'bundle' || sp.get('fromBundle') === 'true' || sp.get('bundleId')
        ? (sp.get('bundleId') || true)
        : (sessionStorage.getItem('eduhunters_nav_from_bundle') || false);
    } catch (e) {
      return false;
    }
  });

  const [policyTab, setPolicyTab] = useState(() => {
    try {
      const p = (window.location.pathname || '').toLowerCase();
      const h = (window.location.hash || '').toLowerCase();
      if (p.includes('/refund') || h.includes('refund')) return 'refund';
      if (p.includes('/privacy') || h.includes('privacy')) return 'privacy';
    } catch (e) {}
    return 'terms';
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const p = (window.location.pathname || '').toLowerCase();
    const h = (window.location.hash || '').toLowerCase();
    if (p.includes('/admin') || h.includes('admin')) return 'admin';
    if (p.includes('/dashboard') || h.includes('dashboard')) return 'dashboard';
    if (p.includes('/exams') || h.includes('exams')) return 'exams';
    if (p.includes('/devices') || h.includes('devices')) return 'devices';
    if (p.includes('/orders') || h.includes('orders')) return 'orders';
    if (p.includes('/leaderboard') || h.includes('leaderboard')) return 'leaderboard';
    if (p.includes('/terms') || p.includes('/refund') || p.includes('/privacy') || p.includes('/policies') || h.includes('terms') || h.includes('refund') || h.includes('privacy')) return 'policies';
    if (p.startsWith('/bundles/') || p.startsWith('/bundle/')) return 'bundle_detail';
    if (p.startsWith('/courses/') && (p.includes('/watch') || p.includes('/lecture'))) return 'course_player';
    if (p.startsWith('/courses/') && p.length > 9 && !p.includes('[object')) return 'course_detail';
    if (p.includes('/courses') || h.includes('courses')) return 'courses';
    if (p.includes('/store') || h.includes('store')) return 'store';
    if (p.includes('/about') || h.includes('about')) return 'about';
    return 'home';
  });

  // Preloader & Transition animation state
  const [isPreloading, setIsPreloading] = useState(() => {
    try {
      const p = (window.location.pathname || '').toLowerCase();
      if (p.includes('/admin')) return false;
      const shown = sessionStorage.getItem('eh_preloader_seen');
      return !shown;
    } catch (e) {
      return true;
    }
  });
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0);

  // Smooth client-side route transition helper with View Transitions API
  const navigate = (stateUpdateFn, targetPath = null) => {
    setIsNavigating(true);
    setNavProgress(35);
    const progressTimer = setTimeout(() => {
      setNavProgress(80);
    }, 50);

    const performUpdate = () => {
      try {
        stateUpdateFn();
      } catch (err) {
        console.error('State update error:', err);
      }
      if (targetPath) {
        try {
          window.history.pushState(null, '', targetPath);
        } catch (e) {}
      }
      try {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {}
    };

    const finishNav = () => {
      setNavProgress(100);
      setTimeout(() => {
        setIsNavigating(false);
        setNavProgress(0);
      }, 240);
    };

    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      document.documentElement.classList.add('page-navigating');
      try {
        document.startViewTransition(() => {
          performUpdate();
        }).finished.catch(() => {}).finally(() => {
          document.documentElement.classList.remove('page-navigating');
          clearTimeout(progressTimer);
          finishNav();
        });
      } catch (e) {
        document.documentElement.classList.remove('page-navigating');
        clearTimeout(progressTimer);
        performUpdate();
        finishNav();
      }
    } else {
      clearTimeout(progressTimer);
      performUpdate();
      finishNav();
    }
  };

  // Ensure document scroll is never locked on page changes
  useEffect(() => {
    try {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    } catch (e) {}
  }, [currentPage]);

  // Synchronize browser forward/backward buttons
  useEffect(() => {
    const handlePopState = () => {
      navigate(() => {
        const p = (window.location.pathname || '').toLowerCase();
        const h = (window.location.hash || '').toLowerCase();
        if (p.includes('/admin') || h.includes('admin')) {
          setCurrentPage('admin');
        } else if (p.includes('/exams') || h.includes('exams')) {
          try {
            const sp = new URLSearchParams(window.location.search);
            let cat = sp.get('category') || null;
            if (cat === 'rtds' || cat === 'onushiloni') {
              cat = 'anushiloni';
            }
            setSelectedCategory(cat);
            setFromBundle(sp.get('from') === 'bundle' || sp.get('fromBundle') === 'true' || sp.get('bundleId') ? (sp.get('bundleId') || true) : false);
          } catch (e) {
            setSelectedCategory(null);
            setFromBundle(false);
          }
          setCurrentPage('exams');
        } else if (p.startsWith('/bundles/') || p.startsWith('/bundle/')) {
          const bSlug = p.split('/bundle')[1].replace(/^s?\//, '');
          setSelectedBundleId(bSlug || null);
          setCurrentPage('bundle_detail');
        } else if (p.startsWith('/courses/') && (p.includes('/watch') || p.includes('/lecture'))) {
          let slug = p.split('/courses/')[1] || '';
          if (slug.includes('/watch')) slug = slug.split('/watch')[0];
          if (slug.includes('/lecture')) slug = slug.split('/lecture')[0];
          const sp = new URLSearchParams(window.location.search);
          const v = sp.get('v') || sp.get('lesson');
          setCourseId(slug);
          setInitialLesson(v === null ? 0 : (isNaN(Number(v)) ? v : Number(v)));
          setCurrentPage('course_player');
        } else if (p.startsWith('/courses/') && p.length > 9 && !p.includes('[object')) {
          const slug = p.split('/courses/')[1];
          if (slug && new Set(['sureshot', 'medical', 'anushiloni', 'onushiloni', 'rtds', 'english_master', 'gk_course', 'medilogy']).has(slug)) {
            const cat = (slug === 'rtds' || slug === 'onushiloni') ? 'anushiloni' : slug;
            setSelectedCategory(cat);
            setCurrentPage('exams');
          } else if (slug) {
            setCourseId(slug);
            setCurrentPage('course_detail');
          }
        } else if (p.includes('/courses') || h.includes('courses')) {
          setCourseId(null);
          setCurrentPage('courses');
        } else if (p.includes('/store') || h.includes('store')) {
          setCurrentPage('store');
        } else if (p.includes('/leaderboard') || h.includes('leaderboard')) {
          setCurrentPage('leaderboard');
        } else if (p.includes('/about') || h.includes('about')) {
          setCurrentPage('about');
        } else if (p.includes('/devices') || h.includes('devices')) {
          setCurrentPage('devices');
        } else if (p.includes('/orders') || h.includes('orders')) {
          setCurrentPage('orders');
        } else if (p.includes('/dashboard') || h.includes('dashboard')) {
          setCurrentPage('dashboard');
        } else if (p.includes('/refund') || h.includes('refund')) {
          setPolicyTab('refund');
          setCurrentPage('policies');
        } else if (p.includes('/privacy') || h.includes('privacy')) {
          setPolicyTab('privacy');
          setCurrentPage('policies');
        } else if (p.includes('/terms') || h.includes('terms') || p.includes('/policies') || h.includes('policies')) {
          setPolicyTab('terms');
          setCurrentPage('policies');
        } else {
          setCurrentPage('home');
        }
      }, null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Centralized Application Data State
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem('eduhunters_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...initialData,
          ...parsed,
          siteSettings: {
            ...initialData.siteSettings,
            ...(parsed.siteSettings || {}),
            contactEmail: parsed.siteSettings?.contactEmail && !parsed.siteSettings.contactEmail.includes('support@eduhunters.com') ? parsed.siteSettings.contactEmail : 'eduhuntersbd@gmail.com',
            contactPhone: parsed.siteSettings?.contactPhone && !parsed.siteSettings.contactPhone.includes('1700') ? parsed.siteSettings.contactPhone : '01342227935',
            whatsappNumber: parsed.siteSettings?.whatsappNumber || parsed.siteSettings?.contactPhone || initialData.siteSettings.whatsappNumber || '01342227935',
            bkashNumber: parsed.siteSettings?.bkashNumber || initialData.siteSettings.bkashNumber,
            nagadNumber: parsed.siteSettings?.nagadNumber || initialData.siteSettings.nagadNumber,
            facebookPage: parsed.siteSettings?.facebookPage && parsed.siteSettings.facebookPage !== 'https://facebook.com' ? parsed.siteSettings.facebookPage : initialData.siteSettings.facebookPage,
            youtubeChannel: parsed.siteSettings?.youtubeChannel && parsed.siteSettings.youtubeChannel !== 'https://youtube.com/@eduhunters' ? parsed.siteSettings.youtubeChannel : initialData.siteSettings.youtubeChannel
          },
          announcement: parsed.announcement || initialData.announcement,
          sectionTexts: { ...initialData.sectionTexts, ...(parsed.sectionTexts || {}) },
          whyChooseUs: Array.isArray(parsed.whyChooseUs) && parsed.whyChooseUs.length > 0 ? parsed.whyChooseUs : initialData.whyChooseUs,
          heroSlides: Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0 ? parsed.heroSlides : initialData.heroSlides,
          homeStats: Array.isArray(parsed.homeStats) && parsed.homeStats.length > 0 && !parsed.homeStats.some(s => s.value === '3000+' || s.value === '70000+') ? parsed.homeStats : initialData.homeStats,
          courses: Array.isArray(parsed.courses) ? parsed.courses.filter(c => !isZenithCopiedCourse(c)).map(c => {
            let item = c.category === 'University A Unit' ? { ...c, category: 'Free' } : c;
            const seed = initialData.courses.find(sc => sc.id === c.id || sc.slug === c.slug);
            if (seed) {
              const curCount = (item.curriculum?.[0]?.lessons || item.curriculum?.[0]?.chapters?.[0]?.lessons || []).length;
              const seedCount = (seed.curriculum?.[0]?.lessons || []).length;
              if (!item.curriculum || !Array.isArray(item.curriculum) || item.curriculum.length === 0) {
                item = { ...item, curriculum: seed.curriculum };
              }
              if (!item.features || !Array.isArray(item.features) || item.features.length === 0) {
                item = { ...item, features: seed.features };
              }
              if (!item.studentsCount) {
                item = { ...item, studentsCount: seed.studentsCount };
              }
            }
            return item;
          }) : initialData.courses,
          bundles: Array.isArray(parsed.bundles) ? parsed.bundles : (initialData.bundles || []),
          examBatches: Array.isArray(parsed.examBatches) ? parsed.examBatches : (initialData.examBatches || EXAM_CATEGORIES_METADATA),
          instructors: (() => {
            const raw = (Array.isArray(parsed.instructors) ? parsed.instructors : []).filter(inst => {
              const n = (inst.name || '').toLowerCase();
              return !['tahmid', 'sanjid', 'tofayel', 'nazmuddin', 'jaidul', 'sk tasnim', 'tasnim ferdaus'].some(bad => n.includes(bad));
            });
            return raw.length > 0 ? raw : initialData.instructors;
          })(),
          freeVideos: Array.isArray(parsed.freeVideos) ? parsed.freeVideos : initialData.freeVideos,
          categories: Array.isArray(parsed.categories) && parsed.categories.length > 0 ? parsed.categories.filter(cat => !['HSC 25', 'Engineering', 'HSC 27', 'HSC 28', 'HSC 26'].includes(cat)).map(cat => cat === 'University A Unit' ? 'Free' : cat) : initialData.categories,
          storeProducts: Array.isArray(parsed.storeProducts) ? parsed.storeProducts.filter(p => !([1, 2, 3, 4].includes(p.id) || p.title?.includes('Biology Extra Info'))) : (initialData.storeProducts || []),
          termsAndConditions: parsed.termsAndConditions || initialData.termsAndConditions,
          refundPolicy: parsed.refundPolicy || initialData.refundPolicy,
          privacyPolicy: parsed.privacyPolicy || initialData.privacyPolicy,
          _lastUpdated: parsed._lastUpdated || null
        };
      }
    } catch (e) {
      console.error('Error loading stored site data:', e);
    }
    return initialData;
  });

  // Local storage purification and integrity guard on startup
  useEffect(() => {
    try {
      syncFinishingTouchStudentsWithAnushiloni(data);
    } catch (e) {}
    try {
      const stored = localStorage.getItem('eduhunters_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        let modified = false;

        // Clean courses
        if (Array.isArray(parsed.courses)) {
          const cleaned = parsed.courses.filter(c => !isZenithCopiedCourse(c));
          if (cleaned.length !== parsed.courses.length) {
            parsed.courses = cleaned;
            modified = true;
          }
          const physIdx = parsed.courses.findIndex(c => c.slug === 'physics-finishing-touch-series' || c.id === 'course-1791887161017' || (c.title || '').toLowerCase().includes('physics'));
          const seedPhys = initialData.courses.find(c => c.slug === 'physics-finishing-touch-series');
          if (seedPhys) {
            if (physIdx === -1) {
              parsed.courses.unshift(seedPhys);
              modified = true;
            } else {
              const hasCur = Array.isArray(parsed.courses[physIdx].curriculum) && parsed.courses[physIdx].curriculum.length > 0;
              const curL = (parsed.courses[physIdx].curriculum?.[0]?.lessons || parsed.courses[physIdx].curriculum?.[0]?.chapters?.[0]?.lessons || []).length;
              const seedL = (seedPhys.curriculum?.[0]?.lessons || []).length;
              if (!hasCur) {
                parsed.courses[physIdx] = { ...parsed.courses[physIdx], curriculum: seedPhys.curriculum, totalClasses: seedPhys.totalClasses || '২১টি ক্লাস' };
                modified = true;
              } else if (curL < seedL) {
                const sec1 = parsed.courses[physIdx].curriculum[1] || seedPhys.curriculum[1];
                parsed.courses[physIdx] = { ...parsed.courses[physIdx], curriculum: [seedPhys.curriculum[0], sec1, ...parsed.courses[physIdx].curriculum.slice(2)], totalClasses: seedPhys.totalClasses || '২১টি ক্লাস' };
                modified = true;
              }
            }
          }
        }

        // Clean instructors
        if (Array.isArray(parsed.instructors)) {
          const badNames = ['tahmid', 'sanjid', 'tofayel', 'nazmuddin', 'jaidul', 'sk tasnim', 'tasnim ferdaus'];
          const filteredInst = parsed.instructors.filter(inst => {
            const n = (inst.name || '').toLowerCase();
            return !badNames.some(bad => n.includes(bad));
          });
          if (filteredInst.length === 0) {
            parsed.instructors = initialData.instructors;
            modified = true;
          } else if (filteredInst.length !== parsed.instructors.length) {
            parsed.instructors = filteredInst;
            modified = true;
          }
        } else {
          parsed.instructors = initialData.instructors;
          modified = true;
        }

        // Clean home stats & contact info
        if (Array.isArray(parsed.homeStats) && parsed.homeStats.some(s => s.value === '3000+' || s.value === '70000+')) {
          parsed.homeStats = initialData.homeStats;
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.contactEmail || parsed.siteSettings.contactEmail.includes('support@eduhunters.com') || parsed.siteSettings.contactEmail.includes('gmial.com'))) {
          parsed.siteSettings.contactEmail = 'eduhuntersbd@gmail.com';
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.contactPhone || parsed.siteSettings.contactPhone.includes('1700'))) {
          parsed.siteSettings.contactPhone = '01342227935';
          modified = true;
        }
        if (parsed.siteSettings && (!parsed.siteSettings.whatsappNumber || parsed.siteSettings.whatsappNumber === '01353828863')) {
          parsed.siteSettings.whatsappNumber = parsed.siteSettings.contactPhone || '01342227935';
          modified = true;
        }

        // Clean exam batches & remove RTDS mentions
        if (Array.isArray(parsed.examBatches)) {
          let batchChanged = false;
          parsed.examBatches = parsed.examBatches.map(b => {
            if (b.key === 'rtds' || b.key === 'anushiloni') {
              batchChanged = true;
              return {
                ...b,
                key: 'anushiloni',
                title: (b.title || '').replace(/\s*\(RTDS\)/gi, '').replace(/RTDS/gi, 'অনুশীলনী').trim(),
                subtitle: (b.subtitle || '').replace(/RTDS/gi, 'অনুশীলনী').trim(),
                image: b.image && b.image.includes('rtds_banner') ? '/exam_banners/anushiloni_banner.jpg' : b.image,
                enrolledCount: '০',
                details: {
                  ...(b.details || {}),
                  about: (b.details?.about || '').replace(/RTDS/gi, 'অনুশীলনী')
                }
              };
            }
            return b;
          });
          if (batchChanged) modified = true;
        }

        if (modified) {
          localStorage.setItem('eduhunters_data', JSON.stringify(parsed));
          setData(prev => ({
            ...prev,
            courses: parsed.courses || prev.courses,
            homeStats: parsed.homeStats || prev.homeStats,
            siteSettings: parsed.siteSettings || prev.siteSettings,
            instructors: parsed.instructors || prev.instructors
          }));
        }
      }
    } catch (e) {
      console.error('Error purifying localStorage:', e);
    }
  }, []);

  // Broadcast data update across tabs
  const broadcastDataUpdate = (nextData) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eduhunters_data_updated', { detail: nextData }));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({ type: 'DATA_SYNC', payload: nextData });
          bc.close();
        }
      }
    } catch (e) {
      console.error('Broadcast sync error:', e);
    }
  };

  // Full data updater
  const handleUpdateData = (nextData) => {
    const updated = { ...nextData, _lastUpdated: new Date().toISOString() };
    setData(updated);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving data to localStorage:', e);
    }
    broadcastDataUpdate(updated);
    saveSupabaseSiteData(updated);
  };

  // Reset data to clean initial seed
  const handleResetData = () => {
    setData(initialData);
    try {
      localStorage.setItem('eduhunters_data', JSON.stringify(initialData));
    } catch (e) {
      console.error('Error resetting data:', e);
    }
    broadcastDataUpdate(initialData);
  };

  // Merge inbound cloud site data with local cache
  const mergeSiteData = (local, cloud) => {
    if (!cloud) return local;
    const localMs = local._lastUpdated ? new Date(local._lastUpdated).getTime() : 0;
    const cloudMs = cloud._lastUpdated ? new Date(cloud._lastUpdated).getTime() : 0;
    if (localMs >= cloudMs && localMs > 0 && cloudMs > 0) return local;

    const merged = { ...cloud };
    if (Array.isArray(merged.homeStats) && merged.homeStats.some(s => s.value === '3000+' || s.value === '70000+')) {
      merged.homeStats = initialData.homeStats;
    }
    if (Array.isArray(merged.heroSlides) && merged.heroSlides.some(s => s.image?.includes('extra-info') || s.image?.includes('noun-day1'))) {
      merged.heroSlides = initialData.heroSlides;
    }

    // Instructors ordering
    const badNames = ['tahmid', 'sanjid', 'tofayel', 'nazmuddin', 'jaidul', 'sk tasnim', 'tasnim ferdaus'];
    const cloudInst = Array.isArray(merged.instructors) ? merged.instructors.filter(inst => !badNames.some(b => (inst.name || '').toLowerCase().includes(b))) : null;
    const localInst = Array.isArray(local.instructors) ? local.instructors.filter(inst => !badNames.some(b => (inst.name || '').toLowerCase().includes(b))) : [];
    let finalInst = cloudInst !== null && cloudInst.length > 0 ? cloudInst : (localInst.length > 0 ? localInst : initialData.instructors);
    const samiIdx = finalInst.findIndex(inst => (inst.name || '').toLowerCase().includes('as sami'));
    if (samiIdx > 0) {
      finalInst = [...finalInst];
      const [sami] = finalInst.splice(samiIdx, 1);
      finalInst.unshift(sami);
    }
    merged.instructors = finalInst;

    return merged;
  };

  // Real-time Cloud Site Data Sync Subscription (Single Source of Truth: Supabase)
  useEffect(() => {
    // 1. Proactive fetch on mount from Supabase
    fetchSupabaseSiteData().then(cloudData => {
      if (cloudData) {
        setData(prev => mergeSiteData(prev, cloudData));
      }
    }).catch(err => {
      console.warn('[App] Proactive Supabase fetch note:', err);
    });

    // 2. Real-time Supabase CDC listener
    const unsubSupabase = subscribeToSupabaseSiteData(cloudData => {
      if (cloudData) setData(prev => mergeSiteData(prev, cloudData));
    });

    // 3. Multi-tab local storage & broadcast listeners
    const handleStorage = (e) => {
      if (e.key === 'eduhunters_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setData(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'DATA_SYNC' && msg.data?.payload) {
            setData(msg.data.payload);
          }
        };
      } catch (e) {}
    }

    const handleCustomUpdate = (e) => {
      if (e.detail) setData(e.detail);
    };
    window.addEventListener('eduhunters_data_updated', handleCustomUpdate);

    return () => {
      if (typeof unsubSupabase === 'function') unsubSupabase();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('eduhunters_data_updated', handleCustomUpdate);
      if (bc) bc.close();
    };
  }, []);

  // Modals state (Auth & Profile)
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authCallback, setAuthCallback] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileNotice, setProfileNotice] = useState(null);
  const [requireProfileCompletion, setRequireProfileCompletion] = useState(false);
  const [profileCallback, setProfileCallback] = useState(null);

  const openAuth = (mode = 'signin', callback = null) => {
    setAuthMode(mode);
    setAuthCallback(typeof callback === 'function' ? () => callback : null);
    setIsAuthOpen(true);
  };

  const openProfile = (opts = null) => {
    if (typeof opts === 'function') {
      setProfileCallback(() => opts);
      setProfileNotice('Please complete your profile with your name, college, and WhatsApp number to finish enrolling.');
      setRequireProfileCompletion(true);
    } else if (opts && typeof opts === 'object') {
      setProfileCallback(typeof opts.onComplete === 'function' ? () => opts.onComplete : null);
      setProfileNotice(opts.hintNotice || null);
      setRequireProfileCompletion(Boolean(opts.requireCompletion));
    } else {
      setProfileCallback(null);
      setProfileNotice(null);
      setRequireProfileCompletion(false);
    }
    setIsProfileOpen(true);
  };

  useEffect(() => {
    const handleProfileEvent = (e) => openProfile(e?.detail || null);
    window.addEventListener('eh_open_profile_modal', handleProfileEvent);
    return () => window.removeEventListener('eh_open_profile_modal', handleProfileEvent);
  }, []);

  // New enrollment order submission handler
  const handleEnrollSuccess = ({ itemTitle, amount, studentName, studentPhone, method, trxId, studentEmail }) => {
    const sAmount = Number(amount) || 0;
    const title = itemTitle || 'কোর্স এনরোলমেন্ট';
    const sName = studentName || 'অনলাইন শিক্ষার্থী';
    const sPhone = studentPhone || 'N/A';
    const sMethod = method || 'bKash';
    const sTrxId = trxId || `TXN${Date.now().toString().slice(-6)}`;

    const newTrx = {
      id: `TRX-${Date.now().toString().slice(-5)}`,
      studentName: sName,
      studentPhone: sPhone,
      studentEmail: studentEmail || '',
      itemTitle: title,
      type: 'INCOME',
      category: 'Course Enrollment',
      amount: sAmount,
      method: sMethod,
      trxId: sTrxId,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      status: 'Pending'
    };

    const curAccounting = data.accounting || initialData.accounting;
    const nextAccounting = {
      ...curAccounting,
      totalOrders: (curAccounting.totalOrders || 0) + 1,
      transactions: [newTrx, ...(curAccounting.transactions || [])]
    };

    const newStudent = {
      id: `st-${Date.now()}`,
      name: sName,
      phone: sPhone,
      email: studentEmail || '',
      batch: 'HSC 26',
      courseName: title,
      status: 'Pending',
      joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: sAmount,
      trxId: sTrxId,
      paymentMethod: sMethod
    };

    try {
      const existing = localStorage.getItem('eh_enrolled_students');
      const nextList = [newStudent, ...(existing ? JSON.parse(existing) : []).filter(st => st.phone !== newStudent.phone || st.courseName !== newStudent.courseName)];
      localStorage.setItem('eh_enrolled_students', JSON.stringify(nextList));
    } catch (e) {}

    const updatedData = { ...data, accounting: nextAccounting, _lastUpdated: new Date().toISOString() };
    handleUpdateData(updatedData);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('eh:new_enrollment', { detail: { transaction: newTrx, student: newStudent } }));
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          const bc = new BroadcastChannel('eduhunters_sync_channel');
          bc.postMessage({ type: 'NEW_ENROLLMENT_ORDER', payload: { transaction: newTrx, student: newStudent } });
          bc.close();
        } catch (e) {}
      }
    }
  };

  // Instant Enrollment Access Sync when approved in Admin Panel
  useEffect(() => {
    const handleApproval = (payload) => {
      if (!payload?.courseTitle) return;
      const cTitle = payload.courseTitle;
      const sPhone = (payload.studentPhone || '').replace(/[^0-9]/g, '');
      const sEmail = (payload.studentEmail || '').toLowerCase().trim();
      const myPhone = (currentUser?.whatsapp || currentUser?.phone || '').replace(/[^0-9]/g, '');
      const myEmail = (currentUser?.email || '').toLowerCase().trim();

      const isMe = (sEmail && myEmail === sEmail) || (sPhone && myPhone && (myPhone === sPhone || (myPhone.length >= 10 && sPhone.length >= 10 && myPhone.slice(-10) === sPhone.slice(-10))));

      if (isMe) {
        grantCourseAccess(cTitle, { bundles: data.bundles, courses: data.courses }, currentUser);
        try {
          const raw = localStorage.getItem('eh_current_user');
          if (raw) {
            const userObj = JSON.parse(raw);
            const enList = Array.isArray(userObj.enrolledCourses) ? userObj.enrolledCourses : [];
            if (!enList.includes(cTitle)) {
              userObj.enrolledCourses = [cTitle, ...enList];
              localStorage.setItem('eh_current_user', JSON.stringify(userObj));
            }
          }
        } catch (e) {}
      }
    };

    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('eduhunters_sync_channel');
        bc.onmessage = (msg) => {
          if (msg.data?.type === 'ENROLLMENT_APPROVED' && msg.data?.payload) {
            handleApproval(msg.data.payload);
          }
        };
      } catch (e) {}
    }

    const handleCustomApproval = (e) => {
      if (e.detail) handleApproval(e.detail);
    };
    window.addEventListener('eh:enrollment_approved', handleCustomApproval);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('eh:enrollment_approved', handleCustomApproval);
    };
  }, [currentUser, data]);

  // Unified Centralized Navigation Handlers Object
  const navHandlers = {
    onOpenProfile: openProfile,
    onNavigateHome: () => {
      setFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      navigate(() => setCurrentPage('home'), '/');
    },
    onNavigateCourse: (courseKey = null, opts = {}) => {
      const isBundle = Boolean(opts?.fromBundle);
      const bId = opts?.bundleId || null;
      if (isBundle) {
        setFromBundle(bId || true);
        try { sessionStorage.setItem('eduhunters_nav_from_bundle', bId || 'true'); } catch (e) {}
      } else {
        setFromBundle(false);
        try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      }

      const examCategories = new Set(['sureshot', 'medical', 'anushiloni', 'onushiloni', 'rtds', 'english_master', 'gk_course', 'medilogy']);
      const strKey = courseKey == null ? '' : String(courseKey).trim();
      if (strKey && examCategories.has(strKey.toLowerCase())) {
        let cat = strKey.toLowerCase();
        if (cat === 'rtds' || cat === 'onushiloni') cat = 'anushiloni';
        const targetUrl = isBundle ? `/exams?category=${cat}&from=bundle${bId ? `&bundleId=${bId}` : ''}` : `/exams?category=${cat}`;
        navigate(() => {
          setSelectedCategory(cat);
          setCurrentPage('exams');
        }, targetUrl);
        return;
      }

      if (strKey.length > 0 && !strKey.includes('[object')) {
        const targetUrl = isBundle ? `/courses/${strKey}?from=bundle${bId ? `&bundleId=${bId}` : ''}` : `/courses/${strKey}`;
        navigate(() => {
          setCourseId(strKey);
          setCurrentPage('course_detail');
        }, targetUrl);
      } else {
        navigate(() => {
          setCourseId(null);
          setCurrentPage('courses');
        }, '/courses');
      }
    },
    onNavigateCoursePlayer: (cId, lesson = null) => {
      setFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      if (typeof cId === 'string' && new Set(['sureshot', 'medical', 'anushiloni', 'onushiloni', 'rtds', 'english_master', 'gk_course', 'medilogy']).has(cId.trim())) {
        navHandlers.onNavigateExams(cId.trim());
        return;
      }
      const targetCourse = cId || 'master-english-30-days';
      const lessonIdx = typeof lesson === 'number' ? lesson : (lesson?.globalIndex === undefined ? (lesson?.lessonIdx === undefined ? 0 : lesson.lessonIdx) : lesson.globalIndex);
      navigate(() => {
        setCourseId(targetCourse);
        setInitialLesson(lesson);
        setCurrentPage('course_player');
      }, `/courses/${targetCourse}/watch?v=${lessonIdx}`);
    },
    onNavigateBundle: (bundleId) => {
      setFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      if (typeof bundleId === 'string' && bundleId.trim().length > 0) {
        navigate(() => {
          setSelectedBundleId(bundleId.trim());
          setCurrentPage('bundle_detail');
        }, `/bundles/${bundleId.trim()}`);
      } else {
        navigate(() => {
          setSelectedBundleId(null);
          setCurrentPage('courses');
        }, '/courses');
      }
    },
    onNavigateExams: (category = null) => {
      setFromBundle(false);
      try {
        sessionStorage.removeItem('eduhunters_nav_from_bundle');
        sessionStorage.removeItem('eduhunters_active_exam_result');
      } catch (e) {}
      let cat = typeof category === 'string' && category.trim().length > 0 ? category.trim() : null;
      if (cat === 'rtds' || cat === 'onushiloni') cat = 'anushiloni';
      navigate(() => {
        setSelectedCategory(cat);
        setCurrentPage('exams');
      }, cat ? `/exams?category=${cat}` : '/exams');
    },
    onNavigateStore: () => {
      navigate(() => setCurrentPage('store'), '/store');
    },
    onNavigateLeaderboard: (cId, lId) => {
      setFromBundle(false);
      if (cId) setCourseId(cId);
      if (lId) setInitialLesson({ id: lId });
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      navigate(() => setCurrentPage('leaderboard'), '/leaderboard');
    },
    onNavigateAbout: () => {
      navigate(() => setCurrentPage('about'), '/about');
    },
    onNavigateDevices: () => {
      navigate(() => setCurrentPage('devices'), '/devices');
    },
    onNavigateDashboard: () => {
      setFromBundle(false);
      try { sessionStorage.removeItem('eduhunters_nav_from_bundle'); } catch (e) {}
      navigate(() => setCurrentPage('dashboard'), '/dashboard');
    },
    onNavigateOrders: () => {
      navigate(() => setCurrentPage('orders'), '/orders');
    },
    onOpenAdmin: (tab = null) => {
      let targetUrl = '/admin/overview';
      if (tab) {
        if (tab.startsWith('/')) {
          targetUrl = tab;
        } else if (tab === 'accounting' || tab === 'orders') {
          targetUrl = '/admin/orders';
        } else {
          targetUrl = `/admin/${tab}`;
        }
      }
      navigate(() => setCurrentPage('admin'), targetUrl);
    },
    onNavigatePolicies: (tab = 'terms') => {
      const validTab = ['terms', 'refund', 'privacy'].includes(tab) ? tab : 'terms';
      navigate(() => {
        setPolicyTab(validTab);
        setCurrentPage('policies');
      }, validTab === 'refund' ? '/refund-policy' : (validTab === 'privacy' ? '/privacy-policy' : '/terms'));
    },
    onLoginClick: (callback) => {
      openAuth('signin', typeof callback === 'function' ? callback : null);
    },
    onSignUpClick: (callback) => {
      openAuth('signup', typeof callback === 'function' ? callback : null);
    },
    onEnrollSuccess: handleEnrollSuccess
  };

  return (
    <React.Fragment>
      {/* Nanobar Page Loading Progress Indicator */}
      <div aria-hidden="true" className={`nav-nano-bar ${isNavigating ? 'opacity-100' : 'opacity-0'}`}>
        <div className="nav-nano-bar-fill" style={{ width: `${navProgress}%` }}>
          <div className="nav-nano-bar-glow" />
        </div>
      </div>

      {/* GPU Hardware-Accelerated Smooth Background Layer (Zero Scroll Repaint Lag) */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-opacity duration-700 ${
          isDark ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ backgroundColor: '#070102' }}
      >
        <img
          src="/dark-bg-desktop.png"
          alt=""
          className="hidden md:block w-full h-full object-cover object-center select-none pointer-events-none"
        />
        <img
          src="/dark-bg-mobile.png"
          alt=""
          className="block md:hidden w-full h-full object-cover object-center select-none pointer-events-none"
        />
      </div>

      {/* Main Page Transition Container wrapped in Error Boundary */}
      <ErrorBoundary>
        <div className="page-transition-container page-animating">
          <Suspense
            fallback={
              <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#e11438] border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            {currentPage === 'admin' ? (
              adminUser ? (
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#f4f6fa] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-[#5d5bf6] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Loading Admin Portal...
                        </p>
                      </div>
                    </div>
                  }
                >
                  <AdminPanel
                    data={data}
                    adminUser={adminUser}
                    onUpdateData={handleUpdateData}
                    onResetData={handleResetData}
                    onNavigateCourse={navHandlers.onNavigateCourse}
                    onExitAdmin={() => navigate(() => setCurrentPage('home'), '/')}
                    onLogoutAdmin={() => {
                      clearAdminSession();
                      setAdminUser(null);
                    }}
                  />
                </Suspense>
              ) : (
                <div className="min-h-screen bg-[#07090e] flex items-center justify-center relative overflow-hidden select-none">
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] rounded-full opacity-30 blur-[100px]"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.45) 0%, rgba(225, 20, 56, 0.25) 50%, transparent 80%)'
                      }}
                    />
                  </div>
                  <AdminAuthModal
                    isOpen={true}
                    onSuccess={(authAdmin) => setAdminUser(authAdmin)}
                    onClose={() => navigate(() => setCurrentPage('home'), '/')}
                  />
                </div>
              )
            ) : (currentPage === 'policies' || currentPage === 'terms' || currentPage === 'refund' || currentPage === 'privacy') ? (
              <LegalPoliciesPage
                data={data}
                initialTab={policyTab}
                onChangeTab={(tab) => {
                  setPolicyTab(tab);
                  const p = tab === 'refund' ? '/refund-policy' : (tab === 'privacy' ? '/privacy-policy' : '/terms');
                  try { window.history.pushState(null, '', p); } catch (e) {}
                }}
                {...navHandlers}
              />
            ) : currentPage === 'exams' ? (
              <ExamsPage
                data={data}
                selectedCategory={selectedCategory}
                isFromBundle={Boolean(fromBundle)}
                onBackToBundle={() => {
                  const bId = typeof fromBundle === 'string' ? fromBundle : selectedBundleId;
                  if (bId) navHandlers.onNavigateBundle(bId);
                  else navigate(() => setCurrentPage('bundle_detail'));
                }}
                {...navHandlers}
              />
            ) : (currentPage === 'courses' || currentPage === 'course') ? (
              <CoursesPage data={data} {...navHandlers} />
            ) : currentPage === 'bundle_detail' ? (
              <BundleDetailPage data={data} selectedBundleId={selectedBundleId} {...navHandlers} />
            ) : currentPage === 'course_player' ? (
              <CoursePlayerPage
                data={data}
                courseId={courseId || 'master-english-30-days'}
                initialLesson={initialLesson}
                onNavigateCourse={navHandlers.onNavigateCourse}
                onLoginClick={(cb) => openAuth('signin', cb)}
                {...navHandlers}
              />
            ) : currentPage === 'course_detail' ? (
              <BiologyCoursePage
                data={data}
                selectedCourseId={courseId || 'master-english-30-days'}
                onOpenLesson={navHandlers.onNavigateCoursePlayer}
                onUpdateCourse={(updatedCourse) => {
                  setData(prev => {
                    const nextCourses = (prev.courses || []).map(c => c.id === updatedCourse.id || c.slug === updatedCourse.slug ? updatedCourse : c);
                    const updated = { ...prev, courses: nextCourses, _lastUpdated: new Date().toISOString() };
                    try { localStorage.setItem('eduhunters_data', JSON.stringify(updated)); } catch (e) {}
                    broadcastDataUpdate(updated);
                    saveCloudData(updated);
                    saveSupabaseSiteData(updated);
                    return updated;
                  });
                }}
                {...navHandlers}
              />
            ) : currentPage === 'store' ? (
              <StorePage data={data} {...navHandlers} />
            ) : currentPage === 'about' ? (
              <AboutPage data={data} {...navHandlers} />
            ) : currentPage === 'devices' ? (
              <DevicesPage data={data} {...navHandlers} />
            ) : currentPage === 'dashboard' ? (
              <DashboardPage data={data} onLoginClick={(cb) => openAuth('signin', cb)} {...navHandlers} />
            ) : currentPage === 'orders' ? (
              <OrdersPage data={data} {...navHandlers} />
            ) : currentPage === 'leaderboard' ? (
              <LeaderboardPage
                courses={data?.courses || initialData.courses || []}
                examBatches={data?.examBatches || EXAM_CATEGORIES_METADATA || []}
                currentUser={currentUser}
                initialCourseId={courseId}
                initialLessonId={initialLesson?.id}
                siteSettings={data?.siteSettings}
                onNavigateCourse={navHandlers.onNavigateCourse}
                onLoginClick={(cb) => openAuth('signin', cb)}
                {...navHandlers}
              />
            ) : (
              <HomePage data={data} {...navHandlers} />
            )}
          </Suspense>
        </div>
      </ErrorBoundary>

      {/* Symmetrical Preloader Screen on first app load */}
      {isPreloading && (
        <PreloaderScreen
          siteSettings={data?.siteSettings}
          onFinish={() => {
            setIsPreloading(false);
            try { sessionStorage.setItem('eh_preloader_seen', 'true'); } catch (e) {}
          }}
        />
      )}

      {/* Global Student Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthCallback(null);
        }}
        onSuccess={(loggedUser) => {
          setIsAuthOpen(false);
          if (authCallback) {
            const cb = authCallback;
            setAuthCallback(null);
            setTimeout(() => cb(loggedUser), 300);
          }
        }}
      />

      {/* Global Student Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        hintNotice={profileNotice}
        requireCompletion={requireProfileCompletion}
        onClose={() => {
          setIsProfileOpen(false);
          setProfileCallback(null);
          setProfileNotice(null);
          setRequireProfileCompletion(false);
        }}
        onSaveSuccess={(savedUser) => {
          if (profileCallback) {
            const cb = profileCallback;
            setProfileCallback(null);
            setProfileNotice(null);
            setRequireProfileCompletion(false);
            setTimeout(() => {
              try { cb(savedUser); } catch (e) {
                console.error('Error executing post-profile action:', e);
              }
            }, 250);
          }
        }}
      />
    </React.Fragment>
  );
}
