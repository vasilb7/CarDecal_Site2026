-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    email TEXT,
    images TEXT[] DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    url TEXT
);

-- Turn on RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert rows
CREATE POLICY "Anyone can insert bug_reports" ON public.bug_reports
    FOR INSERT
    WITH CHECK (true);

-- Only admins can view and update bug_reports
CREATE POLICY "Admins can view bug_reports" ON public.bug_reports
    FOR SELECT
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update bug_reports" ON public.bug_reports
    FOR UPDATE
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
