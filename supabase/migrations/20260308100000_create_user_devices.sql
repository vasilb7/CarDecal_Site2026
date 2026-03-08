-- Migration: Create user_devices metadata table for session tracking
-- Description: Implement a privacy-conscious, strict RLS table to store the session and device information

CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    device_group_key TEXT,
    grouping_confidence TEXT CHECK (grouping_confidence IN ('high', 'medium', 'low', null)),
    device_label TEXT NOT NULL,
    browser_name TEXT,
    browser_family TEXT,
    os_name TEXT,
    device_type TEXT,
    model TEXT,
    user_agent_raw TEXT,
    ip_address TEXT,
    ip_masked TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    detection_source TEXT,
    fingerprint_version TEXT,
    grouping_reason TEXT,
    risk_score NUMERIC
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_session_id ON public.user_devices(session_id);

-- 2. Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can read their own devices
CREATE POLICY "Users can read own devices"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own devices (typically from frontend logic)
CREATE POLICY "Users can insert own devices"
ON public.user_devices
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own devices for activity ping and local revocation
CREATE POLICY "Users can update own devices"
ON public.user_devices
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optionally, we can block modification of certain columns
-- Because Supabase standard policies do not natively block columns without triggers,
-- we rely on application layer checks for field-level immutability for non-admin users.

-- 4. Trigger to auto-update 'updated_at' column
CREATE OR REPLACE FUNCTION update_user_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_devices_updated_at ON public.user_devices;
CREATE TRIGGER trigger_update_user_devices_updated_at
BEFORE UPDATE ON public.user_devices
FOR EACH ROW
EXECUTE FUNCTION update_user_devices_updated_at();

-- Provide admin access if required in the future (optional)
-- CREATE POLICY "Admins can read all devices"
-- ON public.user_devices FOR SELECT
-- USING (auth.jwt() ->> 'role' = 'admin');
