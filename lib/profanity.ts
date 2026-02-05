import { moderate } from '../moderation/moderate';
import { Zone } from '../moderation/index';

/**
 * Validates text against moderation rules.
 * @param text The text to validate
 * @param zone The context zone (username, comments, chat, product_description, default)
 * @returns true if the text is actionable (blocked or quarantined), false if allowed/masked
 */
export const hasProfanity = (text: string, zone: Zone = 'default' as any): boolean => {
    if (!text) return false;
    const result = moderate(text, zone);
    
    // We treat 'block' and 'quarantine' as "has profanity" that should stop the action immediatey
    return result.action === 'block' || result.action === 'quarantine';
};

/**
 * Returns the moderation action and score for advanced handling
 */
export const checkProfanity = (text: string, zone: Zone = 'default' as any) => {
    return moderate(text, zone);
};

export const cleanProfanity = (text: string): string => {
   // Placeholder for masking logic if needed later
   return text; 
};

export default { hasProfanity, checkProfanity, cleanProfanity };
