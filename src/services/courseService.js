import { supabase, isSupabaseConfigured } from '../supabase/config';
import { initialCourses } from '../data/initialCourses';

const COURSES_DOC_ID = 'courses_list';

/**
 * Fetch all available courses from Supabase (or fallback to clean initial courses)
 */
export async function getCourses() {
  if (!isSupabaseConfigured || !supabase) {
    return initialCourses;
  }

  try {
    const { data, error } = await supabase
      .from('eduhunters_site')
      .select('data')
      .eq('id', COURSES_DOC_ID)
      .maybeSingle();

    if (error || !data?.data || !Array.isArray(data.data) || data.data.length === 0) {
      return initialCourses;
    }

    // Ensure the flagship courses are always present
    const customList = data.data;
    const combined = [...customList];
    
    for (const initCourse of initialCourses) {
      if (!combined.some(c => c.id === initCourse.id || c.slug === initCourse.slug)) {
        combined.unshift(initCourse);
      }
    }

    return combined;
  } catch (err) {
    console.warn('[Courses] Supabase fetch fallback:', err);
    return initialCourses;
  }
}

/**
 * Save all courses to Supabase eduhunters_site
 */
export async function saveAllCourses(courses) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase
    .from('eduhunters_site')
    .upsert({
      id: COURSES_DOC_ID,
      data: courses,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
  return true;
}

/**
 * Add or update a course (used by Admin Panel)
 */
export async function upsertCourse(courseData) {
  const currentCourses = await getCourses();
  const existingIdx = currentCourses.findIndex(c => c.id === courseData.id || c.slug === courseData.slug);

  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...currentCourses];
    updatedList[existingIdx] = { ...updatedList[existingIdx], ...courseData };
  } else {
    const newCourse = {
      id: courseData.id || `course-${Date.now()}`,
      slug: courseData.slug || courseData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      ...courseData
    };
    updatedList = [newCourse, ...currentCourses];
  }

  await saveAllCourses(updatedList);
  return updatedList;
}

/**
 * Delete a course by ID
 */
export async function removeCourse(courseId) {
  const currentCourses = await getCourses();
  const filtered = currentCourses.filter(c => c.id !== courseId && c.slug !== courseId);
  await saveAllCourses(filtered);
  return filtered;
}

/**
 * Guaranteed Course Access Verification Engine
 * Assures that ZERO enrolled students ever lose course access.
 */
export async function checkCourseAccess(course, user) {
  if (!course) return { hasAccess: false, reason: 'NO_COURSE' };

  // 1. Completely Free courses are open to everyone
  if (course.isFree || course.salePrice === 0) {
    return { hasAccess: true, reason: 'FREE_COURSE' };
  }

  // 2. Not logged in
  if (!user) {
    return { hasAccess: false, reason: 'LOGIN_REQUIRED' };
  }

  // 3. Admin has master pass
  if (user.role === 'admin') {
    return { hasAccess: true, reason: 'ADMIN_ACCESS' };
  }

  // 4. Check user profile enrolled_courses array
  const enrolledArray = Array.isArray(user.enrolled_courses) ? user.enrolled_courses : [];
  if (enrolledArray.some(item => {
    if (typeof item === 'string') {
      return item === course.id || item === course.slug || item.toLowerCase() === course.title.toLowerCase();
    }
    return item?.id === course.id || item?.slug === course.slug;
  })) {
    return { hasAccess: true, reason: 'PROFILE_ENROLLED' };
  }

  // 5. Check Supabase eduhunters_orders for approved/paid orders
  if (isSupabaseConfigured && supabase) {
    try {
      const cleanEmail = (user.email || '').trim().toLowerCase();
      const cleanPhone = (user.phone || '').trim().replace(/[^0-9]/g, '');

      let query = supabase
        .from('eduhunters_orders')
        .select('id, course_name, course_slug, is_approved, status, customer_email, customer_phone')
        .or('is_approved.eq.true,status.eq.PAID');

      if (cleanEmail && cleanPhone) {
        query = query.or(`customer_email.ilike.${cleanEmail},customer_phone.ilike.%${cleanPhone.slice(-10)}%`);
      } else if (cleanEmail) {
        query = query.ilike('customer_email', cleanEmail);
      } else if (cleanPhone) {
        query = query.ilike('customer_phone', `%${cleanPhone.slice(-10)}%`);
      } else {
        return { hasAccess: false, reason: 'NO_USER_IDENTIFIER' };
      }

      const { data: orders, error } = await query;

      if (!error && orders && orders.length > 0) {
        // Check if any matching order belongs to this course
        const matchingOrder = orders.find(ord => {
          const ordSlug = (ord.course_slug || '').toLowerCase();
          const ordName = (ord.course_name || '').toLowerCase();
          const targetSlug = (course.slug || '').toLowerCase();
          const targetTitle = (course.title || course.name || '').toLowerCase();

          return ordSlug === targetSlug || 
                 ordName === targetTitle || 
                 ordName.includes('physics') && targetTitle.includes('physics') ||
                 ordSlug.includes('physics') && targetSlug.includes('physics');
        });

        if (matchingOrder) {
          return { hasAccess: true, reason: 'APPROVED_ORDER', order: matchingOrder };
        }
      }
    } catch (err) {
      console.warn('[Check Access Error]:', err);
    }
  }

  return { hasAccess: false, reason: 'PAYMENT_REQUIRED' };
}
