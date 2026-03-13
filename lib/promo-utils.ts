import { supabase } from './supabase';

export const logPromoCodeUsage = async (promoCodeId: string, userId?: string, email?: string, orderId?: string) => {
  try {
    const { error } = await supabase
      .from('promo_code_uses')
      .insert({
        promo_code_id: promoCodeId,
        user_id: userId || null,
        email: email || null,
        order_id: orderId || null,
        used_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging promo code usage:', error);
      return false;
    }

    // Attempt to increment current_uses in promo_codes table
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('promo_codes')
        .select('current_uses')
        .eq('id', promoCodeId)
        .single();
      
      if (!fetchError && currentData) {
        await supabase
          .from('promo_codes')
          .update({ current_uses: (currentData.current_uses || 0) + 1 })
          .eq('id', promoCodeId);
      }
    } catch (incErr) {
      console.error('Failed to increment promo uses:', incErr);
    }

    return true;
  } catch (err) {
    console.error('Unexpected error logging promo code usage:', err);
    return false;
  }
};
