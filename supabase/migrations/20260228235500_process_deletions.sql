CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    uEmail TEXT;
    ordersJson JSONB;
BEGIN
    FOR rec IN 
        SELECT p.id, p.deletion_reason, p.first_name, p.last_name, p.phone
        FROM public.profiles p
        WHERE p.deletion_scheduled_at IS NOT NULL 
          AND p.deletion_scheduled_at <= NOW()
    LOOP
        -- Get user email from auth.users
        SELECT email INTO uEmail FROM auth.users WHERE id = rec.id;
        
        -- Build orders snapshot
        SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) INTO ordersJson
        FROM public.orders o
        WHERE user_id = rec.id;

        -- Insert into archive
        INSERT INTO public.deleted_users_archive (
            user_id, email, full_name, phone, reason, metadata, orders_snapshot
        ) VALUES (
            rec.id, 
            uEmail, 
            TRIM(COALESCE(rec.first_name, '') || ' ' || COALESCE(rec.last_name, '')), 
            rec.phone, 
            rec.deletion_reason, 
            '{}'::jsonb, 
            ordersJson
        );
        
        -- Delete the auth user from Postgres (cascading automatically)
        DELETE FROM auth.users WHERE id = rec.id;
    END LOOP;
END;
$$;

-- Run cron every day at midnight or every hour (0 * * * *)
SELECT cron.schedule('process_deletions_job', '0 * * * *', 'SELECT public.process_scheduled_deletions()');
