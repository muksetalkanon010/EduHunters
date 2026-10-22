import { supabase, isSupabaseConfigured } from '../supabase/config';

const EXAMS_DOC_ID = 'exam_batches_list';

/**
 * Fetch all exam batches from Supabase
 */
export async function getExamBatches() {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('eduhunters_site')
      .select('data')
      .eq('id', EXAMS_DOC_ID)
      .maybeSingle();

    if (error || !data?.data) return [];
    return Array.isArray(data.data) ? data.data : [];
  } catch (e) {
    console.warn('[ExamBatches Fetch]:', e);
    return [];
  }
}

/**
 * Save all exam batches to Supabase (Used by Admin Exam Manager)
 */
export async function saveExamBatches(batches) {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase not configured');

  const { error } = await supabase
    .from('eduhunters_site')
    .upsert({
      id: EXAMS_DOC_ID,
      data: batches,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

  if (error) throw error;
  return true;
}

/**
 * Submit exam result to Supabase eduhunters_quiz_submissions
 */
export async function submitQuizAttempt({
  user,
  course,
  lesson,
  quiz,
  answers,
  timeTakenSeconds = 0,
  negativeMarking = 0.25
}) {
  const questions = quiz.questions || [];
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  questions.forEach((q, idx) => {
    const userAns = answers[idx];
    if (userAns === undefined || userAns === null) {
      skippedCount++;
    } else if (Number(userAns) === Number(q.correctAnswer ?? q.correct_index)) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const totalMarks = questions.length;
  const rawScore = (correctCount * 1) - (wrongCount * negativeMarking);
  const score = Math.max(0, Math.round(rawScore * 100) / 100);
  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

  const submissionId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const submission = {
    id: submissionId,
    student_id: user?.uid || user?.id || 'anonymous',
    student_name: user?.name || user?.displayName || 'Anonymous Student',
    student_email: user?.email || '',
    student_phone: user?.phone || '',
    course_id: course?.id || 'course-default',
    course_slug: course?.slug || 'physics-finishing-touch-series',
    course_name: course?.title || course?.name || 'Physics Finishing Touch Series',
    lesson_id: lesson?.id || 'general-exam',
    lesson_title: lesson?.name || lesson?.title || quiz?.title || 'Practice Exam',
    quiz_id: quiz?.id || quiz?.quiz_id || `quiz_${lesson?.id || 'exam'}`,
    score,
    total_marks: totalMarks,
    percentage,
    correct_count: correctCount,
    wrong_count: wrongCount,
    skipped_count: skippedCount,
    time_taken_seconds: timeTakenSeconds,
    is_first_attempt: true,
    is_live_window: true,
    attempt_number: 1,
    raw_answers: answers,
    submitted_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('eduhunters_quiz_submissions').insert([submission]);
    } catch (err) {
      console.warn('[Quiz Submission Supabase Note]:', err);
    }
  }

  return submission;
}

/**
 * Fetch Leaderboard for an Exam or Course
 */
export async function getLeaderboard(courseSlug = null, quizId = null) {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    let query = supabase
      .from('eduhunters_quiz_submissions')
      .select('id, student_name, student_email, score, total_marks, percentage, time_taken_seconds, lesson_title, submitted_at')
      .order('score', { ascending: false })
      .order('time_taken_seconds', { ascending: true })
      .limit(50);

    if (quizId) {
      query = query.eq('quiz_id', quizId);
    } else if (courseSlug) {
      query = query.eq('course_slug', courseSlug);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[Get Leaderboard Error]:', err);
    return [];
  }
}
