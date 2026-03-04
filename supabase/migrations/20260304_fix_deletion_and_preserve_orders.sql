-- 1. Add custom_orders_snapshot column to archive table
ALTER TABLE public.deleted_users_archive
  ADD COLUMN IF NOT EXISTS custom_orders_snapshot jsonb;

-- 2. Change custom_orders FK from CASCADE to SET NULL
ALTER TABLE public.custom_orders
  DROP CONSTRAINT custom_orders_user_id_fkey;

ALTER TABLE public.custom_orders
  ADD CONSTRAINT custom_orders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Fix the process_scheduled_deletions function (first_name/last_name -> full_name)
CREATE OR REPLACE FUNCTION public.process_scheduled_deletions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec RECORD;
    uEmail TEXT;
    ordersJson JSONB;
    customOrdersJson JSONB;
BEGIN
    FOR rec IN 
        SELECT p.id, p.deletion_reason, p.full_name, p.phone
        FROM public.profiles p
        WHERE p.deletion_scheduled_at IS NOT NULL 
          AND p.deletion_scheduled_at <= NOW()
    LOOP
        -- Get user email from auth.users
        SELECT email INTO uEmail FROM auth.users WHERE id = rec.id;
        
        -- Build orders snapshot
        SELECT COALESCE(jsonb_agg(row_to_json(o)), '[]'::jsonb) INTO ordersJson
        FROM public.orders o
        WHERE o.user_id = rec.id;

        -- Build custom_orders snapshot
        SELECT COALESCE(jsonb_agg(row_to_json(co)), '[]'::jsonb) INTO customOrdersJson
        FROM public.custom_orders co
        WHERE co.user_id = rec.id;

        -- Insert into archive
        INSERT INTO public.deleted_users_archive (
            user_id, email, full_name, phone, reason, metadata, orders_snapshot, custom_orders_snapshot
        ) VALUES (
            rec.id, 
            uEmail, 
            COALESCE(rec.full_name, ''), 
            rec.phone, 
            rec.deletion_reason, 
            '{}'::jsonb, 
            ordersJson,
            customOrdersJson
        );
        
        -- Delete the auth user (profiles CASCADE, orders SET NULL, custom_orders SET NULL)
        DELETE FROM auth.users WHERE id = rec.id;
    END LOOP;
END;
$$;
