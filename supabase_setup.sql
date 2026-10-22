-- =========================================================================
-- EduHunters - Complete Database Schema & Realtime Setup for Supabase
-- Run this script once in your Supabase Project: SQL Editor -> New Query -> Run
-- =========================================================================

-- 1. SITE CONFIGURATION & CONTENT TABLE (Single Source of Truth)
CREATE TABLE IF NOT EXISTS public.eduhunters_site (
    id TEXT PRIMARY KEY DEFAULT 'main_data',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. USERS & STUDENTS DIRECTORY
CREATE TABLE IF NOT EXISTS public.eduhunters_users (
    id TEXT PRIMARY KEY,
    uid TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    role TEXT DEFAULT 'Student',
    status TEXT DEFAULT 'Active',
    college TEXT,
    batch TEXT DEFAULT 'HSC 26',
    total_spent NUMERIC DEFAULT 0,
    enrolled_courses JSONB DEFAULT '[]'::jsonb,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. ORDERS & FINANCIAL TRANSACTIONS LEDGER
CREATE TABLE IF NOT EXISTS public.eduhunters_orders (
    id TEXT PRIMARY KEY,
    invoice_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    course_name TEXT,
    course_slug TEXT,
    amount NUMERIC DEFAULT 0,
    payment_method TEXT DEFAULT 'bKash',
    trx_id TEXT,
    status TEXT DEFAULT 'PENDING',
    is_approved BOOLEAN DEFAULT FALSE,
    raw_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. EXAM & QUIZ SUBMISSIONS (LEADERBOARD)
CREATE TABLE IF NOT EXISTS public.eduhunters_quiz_submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT,
    student_name TEXT,
    student_email TEXT,
    student_phone TEXT,
    score NUMERIC DEFAULT 0,
    total_questions NUMERIC DEFAULT 0,
    answers JSONB DEFAULT '[]'::jsonb,
    submitted_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================================================
-- FAST INDEXES FOR INSTANT QUERIES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_eduhunters_users_email ON public.eduhunters_users (email);
CREATE INDEX IF NOT EXISTS idx_eduhunters_users_phone ON public.eduhunters_users (phone);
CREATE INDEX IF NOT EXISTS idx_eduhunters_orders_status ON public.eduhunters_orders (status);
CREATE INDEX IF NOT EXISTS idx_eduhunters_orders_trx_id ON public.eduhunters_orders (trx_id);
CREATE INDEX IF NOT EXISTS idx_eduhunters_orders_email ON public.eduhunters_orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_eduhunters_orders_phone ON public.eduhunters_orders (customer_phone);

-- =========================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & PUBLIC POLICIES
-- =========================================================================
ALTER TABLE public.eduhunters_site ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eduhunters_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eduhunters_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eduhunters_quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for the web app client
DROP POLICY IF EXISTS "Public access for eduhunters_site" ON public.eduhunters_site;
CREATE POLICY "Public access for eduhunters_site" ON public.eduhunters_site FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for eduhunters_users" ON public.eduhunters_users;
CREATE POLICY "Public access for eduhunters_users" ON public.eduhunters_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for eduhunters_orders" ON public.eduhunters_orders;
CREATE POLICY "Public access for eduhunters_orders" ON public.eduhunters_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for eduhunters_quiz_submissions" ON public.eduhunters_quiz_submissions;
CREATE POLICY "Public access for eduhunters_quiz_submissions" ON public.eduhunters_quiz_submissions FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- ENABLE REALTIME REPLICATION (Instant CDC across all devices)
-- =========================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.eduhunters_site;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eduhunters_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eduhunters_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.eduhunters_quiz_submissions;
