-- Ensure promo columns exist on orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES public.promo_codes(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS promo_discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Trigger to handle promo code usage automatically when an order is placed
CREATE OR REPLACE FUNCTION public.handle_promo_code_usage()
RETURNS TRIGGER AS $$
DECLARE
    v_promo_exists BOOLEAN;
BEGIN
    -- Only proceed if there is a promo_code_id
    IF NEW.promo_code_id IS NOT NULL THEN
        -- Check if promo code exists and is still valid (double check for safety)
        SELECT EXISTS (
            SELECT 1 FROM public.promo_codes 
            WHERE id = NEW.promo_code_id 
              AND is_active = true 
              AND (max_uses IS NOT NULL AND current_uses < max_uses OR max_uses IS NULL)
        ) INTO v_promo_exists;

        IF v_promo_exists THEN
            -- 1. Insert into usage log
            INSERT INTO public.promo_code_uses (promo_code_id, user_id, email, order_id)
            VALUES (
                NEW.promo_code_id, 
                NEW.user_id, 
                NEW.shipping_details->>'email', 
                NEW.id
            );

            -- 2. Increment usage and deactivate if limit reached
            UPDATE public.promo_codes
            SET 
                current_uses = current_uses + 1,
                is_active = CASE 
                    WHEN max_uses IS NOT NULL AND (current_uses + 1) >= max_uses THEN false 
                    ELSE is_active 
                END,
                updated_at = now()
            WHERE id = NEW.promo_code_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_order_created_promo ON public.orders;

-- Attach trigger to orders table
CREATE TRIGGER on_order_created_promo
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_promo_code_usage();
