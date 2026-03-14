-- Таблица за промо кодове
CREATE TABLE promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value NUMERIC(10, 2) NOT NULL,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    max_uses_per_user INTEGER,
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    min_order_amount NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT true,
    condition_type VARCHAR(50) DEFAULT 'none' CHECK (condition_type IN ('none', 'new_users', 'loyal_customers')),
    condition_value INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Таблица за проследяване на използванията на промо кодовете
CREATE TABLE promo_code_uses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) in theory, but some are guests
    email VARCHAR(255),
    order_id UUID, -- References orders(id)
    used_at TIMESTAMPTZ DEFAULT now()
);

-- Активиране на Row Level Security
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- All users can read promo codes (necessary for real-time monitoring of status changes)
CREATE POLICY "Public read promo codes" 
ON promo_codes FOR SELECT 
USING (true);

-- Администратори и редактори имат пълен достъп
CREATE POLICY "Admins full access promo codes"
ON promo_codes FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

CREATE POLICY "Admins full access promo code uses"
ON promo_code_uses FOR ALL
USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'editor'))
);

-- Потребителите могат да виждат собствените си използвания (по ID или имейл)
CREATE POLICY "Users can see own promo uses"
ON promo_code_uses FOR SELECT
USING (
    auth.uid() = user_id 
    OR 
    (email IS NOT NULL AND email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Функция за прилагане на код и проверка на условията при поръчка (за по-надеждно отброяване)
CREATE OR REPLACE FUNCTION use_promo_code(p_code VARCHAR, p_user_id UUID, p_email VARCHAR, p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_promo RECORD;
    v_user_uses INTEGER;
    v_order_count INTEGER;
BEGIN
    -- 1. Get the promo code details
    SELECT * INTO v_promo
    FROM promo_codes
    WHERE code = upper(p_code) AND is_active = true
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now());

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- 2. Check global usage limit
    IF v_promo.max_uses IS NOT NULL AND v_promo.current_uses >= v_promo.max_uses THEN
        -- Safely deactivate if somehow it was still active
        UPDATE promo_codes SET is_active = false WHERE id = v_promo.id;
        RETURN FALSE;
    END IF;

    -- 3. Check personal usage limit
    IF v_promo.max_uses_per_user IS NOT NULL THEN
        SELECT count(*) INTO v_user_uses
        FROM promo_code_uses
        WHERE promo_code_id = v_promo.id
          AND ((user_id IS NOT NULL AND user_id = p_user_id) OR (email IS NOT NULL AND email = p_email));
          
        IF v_user_uses >= v_promo.max_uses_per_user THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- 4. Check conditions (New Users / Loyal Customers)
    IF v_promo.condition_type != 'none' THEN
        -- Count ONLY COMPLETED orders (User explicitly requested "трябва да е завършена")
        SELECT count(*) INTO v_order_count
        FROM orders
        WHERE ((user_id IS NOT NULL AND user_id = p_user_id) OR (shipping_details->>'email' = p_email))
          AND status = 'completed';

        IF v_promo.condition_type = 'new_users' AND v_order_count > 0 THEN
            RETURN FALSE;
        END IF;

        IF v_promo.condition_type = 'loyal_customers' AND v_order_count < COALESCE(v_promo.condition_value, 0) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- 5. Record usage and update status if max exceeded
    UPDATE promo_codes 
    SET 
        current_uses = current_uses + 1,
        is_active = CASE 
            WHEN max_uses IS NOT NULL AND (current_uses + 1) >= max_uses THEN false 
            ELSE is_active 
        END
    WHERE id = v_promo.id;
    
    INSERT INTO promo_code_uses (promo_code_id, user_id, email, order_id)
    VALUES (v_promo.id, p_user_id, p_email, p_order_id);

    RETURN TRUE;
END;
$$;
