ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_scheduled_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deletion_reason text;

CREATE OR REPLACE FUNCTION public.schedule_account_deletion(reason text DEFAULT 'Потребителят пожела изтриване на акаунта')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.profiles
    SET deletion_scheduled_at = NOW() + INTERVAL '7 days',
        deletion_reason = reason
    WHERE id = auth.uid();
END;
$$;
