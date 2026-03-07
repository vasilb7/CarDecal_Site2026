-- ═══════════════════════════════════════════════════════════════════════════════
-- user_devices: Session/Device tracking for user profile
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to create the table, indexes, and RLS policies.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_devices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id text,
    device_label text NOT NULL DEFAULT 'Неизвестно устройство',
    browser text,
    platform text,
    device_type text DEFAULT 'desktop' CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
    model text,
    ip_address text,
    ip_masked text,
    user_agent_raw text,
    is_active boolean DEFAULT true NOT NULL,
    revoked_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    last_seen_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_session_id ON public.user_devices USING btree (session_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON public.user_devices USING btree (user_id, is_active) WHERE is_active = true;

-- 3. Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can only read their own devices
CREATE POLICY "users_select_own_devices"
    ON public.user_devices
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can insert their own device records
CREATE POLICY "users_insert_own_devices"
    ON public.user_devices
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own device records (for last_seen_at, revoke, etc.)
CREATE POLICY "users_update_own_devices"
    ON public.user_devices
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own device records
CREATE POLICY "users_delete_own_devices"
    ON public.user_devices
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Admins can read all devices (for admin panel security view)
CREATE POLICY "admins_select_all_devices"
    ON public.user_devices
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- 5. Add to realtime publication (optional)
-- ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.user_devices;

-- 6. Auto-cleanup: Mark devices as inactive after 30 days of no activity
-- (Run via pg_cron if available, or as a periodic Edge Function)
-- SELECT cron.schedule(
--     'cleanup_stale_devices',
--     '0 3 * * *', -- every day at 3am
--     $$UPDATE public.user_devices SET is_active = false, revoked_at = now() WHERE is_active = true AND last_seen_at < now() - interval '30 days'$$
-- );
