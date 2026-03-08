-- Migration to create the delete_user_entirely RPC if it doesn't already exist.

CREATE OR REPLACE FUNCTION public.delete_user_entirely(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admins to execute this
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can delete users entirely';
    END IF;

    -- Update related records to NULL or delete them depending on the constraints
    -- orders and custom_orders are already CASCADE or SET NULL in our schema modifications
    -- deleted_users_archive won't be filled here since it's a direct admin deletion,
    -- or if we want to archive, we could insert into deleted_users_archive first.
    -- Assuming we just wipe completely:
    
    DELETE FROM auth.users WHERE id = target_user_id;

END;
$$;
