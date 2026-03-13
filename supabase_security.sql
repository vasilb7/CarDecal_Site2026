-- ==========================================
-- CARDECAL SECURITY POLICY OPTIMIZATIONS
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. CREATE A SECURITY DEFINER FUNCTION AVOID INFINITE RECURSION
-- This is critical! If an RLS policy queries the same table it protects, 
-- Postgres throws a 500 Internal Server Error due to infinite recursion.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- This bypasses RLS when checking the role
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins/Editors can view all profiles" ON public.profiles;
CREATE POLICY "Admins/Editors can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  public.get_user_role() = 'admin'
);

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (
  public.get_user_role() = 'admin'
);

-- ==========================================
-- ORDERS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins/Editors can view all orders" ON public.orders;
CREATE POLICY "Admins/Editors can view all orders" 
ON public.orders FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins/Editors can update orders" ON public.orders;
CREATE POLICY "Admins/Editors can update orders" 
ON public.orders FOR UPDATE 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

-- ==========================================
-- CUSTOM ORDERS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own custom orders" ON public.custom_orders;
CREATE POLICY "Users can view own custom orders" 
ON public.custom_orders FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins/Editors can view all custom orders" ON public.custom_orders;
CREATE POLICY "Admins/Editors can view all custom orders" 
ON public.custom_orders FOR SELECT 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

DROP POLICY IF EXISTS "Users can create own custom orders" ON public.custom_orders;
CREATE POLICY "Users can create own custom orders" 
ON public.custom_orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins/Editors can update custom orders" ON public.custom_orders;
CREATE POLICY "Admins/Editors can update custom orders" 
ON public.custom_orders FOR UPDATE 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

-- ==========================================
-- PRODUCTS POLICIES
-- ==========================================
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" 
ON public.products FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins/Editors can manage products" ON public.products;
CREATE POLICY "Admins/Editors can manage products" 
ON public.products FOR ALL 
USING (
  public.get_user_role() IN ('admin', 'editor')
);

-- ==========================================
-- SECUREMENT OF USER ROLE
-- ==========================================
-- Robust get_user_role with search_path
CREATE OR REPLACE FUNCTION public.get_user_role() 
RETURNS text 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- Robust check_role_update with better conditions and search_path
CREATE OR REPLACE FUNCTION public.check_role_update() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
BEGIN
  -- Get role of the person making the change
  v_caller_role := public.get_user_role();

  -- Allow if role is NOT being changed
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Allow if superuser/SQL Editor (auth.uid() is null)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Allow only if caller is admin
  IF v_caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Otherwise block
  RAISE EXCEPTION 'Недостатъчни права за промяна на роля. Вашият ранг е: %, ID: %', COALESCE(v_caller_role, 'потребител'), auth.uid();
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_security ON public.profiles;
CREATE TRIGGER enforce_role_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_role_update();

