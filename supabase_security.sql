-- ==========================================
-- CARDECAL SECURITY POLICY OPTIMIZATIONS
-- RUN THIS IN SUPABASE SQL EDITOR
-- ==========================================

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing overly open policies if they exist (optional cleanup)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
-- DROP POLICY IF EXISTS "Enable read access for all users" ON products;

-- ==========================================
-- PROFILES POLICIES
-- ==========================================
-- Users can read only their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admins and Editors can view all profiles
CREATE POLICY "Admins/Editors can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- Only Admins can update/delete other profiles
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete profiles" 
ON public.profiles FOR DELETE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ==========================================
-- ORDERS POLICIES
-- ==========================================
-- Users can view their own orders
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = user_id);

-- Admins/Editors can view all orders
CREATE POLICY "Admins/Editors can view all orders" 
ON public.orders FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- Users can insert their own orders
CREATE POLICY "Users can create own orders" 
ON public.orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Only Admins/Editors can update orders (e.g., status changes)
CREATE POLICY "Admins/Editors can update orders" 
ON public.orders FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- ==========================================
-- CUSTOM ORDERS POLICIES
-- ==========================================
CREATE POLICY "Users can view own custom orders" 
ON public.custom_orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins/Editors can view all custom orders" 
ON public.custom_orders FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

CREATE POLICY "Users can create own custom orders" 
ON public.custom_orders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins/Editors can update custom orders" 
ON public.custom_orders FOR UPDATE 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- ==========================================
-- PRODUCTS POLICIES
-- ==========================================
-- Everyone can view products (safe fields restricted in frontend)
CREATE POLICY "Public can view products" 
ON public.products FOR SELECT 
USING (true);

-- Only Admins/Editors can insert/update/delete products
CREATE POLICY "Admins/Editors can manage products" 
ON public.products FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'editor')
);

-- ==========================================
-- SECUREMENT OF USER ROLE
-- ==========================================
-- Prevent users from elevating their own role during profile updates
-- In Supabase, you can enforce this with a trigger or RLS check.
-- RLS check is easier:
CREATE OR REPLACE FUNCTION check_role_update() RETURNS trigger AS $$
BEGIN
  -- If non-admin is trying to change their role
  IF (
    NEW.role IS DISTINCT FROM OLD.role
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to change role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_role_security ON public.profiles;
CREATE TRIGGER enforce_role_security
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION check_role_update();
