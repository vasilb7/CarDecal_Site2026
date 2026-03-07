import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates a full name based on specific business rules:
 * - Length: 3 to 100 characters
 * - Allowed: Letters (Latin/Cyrillic), spaces, hyphens, apostrophes
 * - Forbidden: Numbers and special symbols
 */
export const isValidFullName = (name: string): boolean => {
    if (!name) return false;
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 100) return false;
    
    // Check for at least two parts (first and last name)
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    if (parts.length < 2) return false;

    // Regex for: Letters (Latin & Cyrillic), spaces, hyphens, apostrophes
    const nameRegex = /^[a-zA-Zа-яА-ЯёЁіІєЄїЇґҐ\s\-']+$/;
    return nameRegex.test(trimmed);
};

/**
 * Validates a phone number based on specific business rules:
 * - 8 to 15 digits total
 * - '+' allowed only at the very beginning
 * - No other characters allowed (handled after trimming/cleaning)
 */
export const isValidPhone = (phone: string): boolean => {
    if (!phone) return false;
    const trimmed = phone.trim();
    
    // Check basic format: optional '+' then 8-15 digits
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    if (!phoneRegex.test(trimmed)) return false;

    // Prevent fake repeating numbers (e.g. 00000000)
    const digitsOnly = trimmed.replace('+', '');
    if (/^(\d)\1{7,}$/.test(digitsOnly)) return false;

    return true;
};

/**
 * Formats a phone number to E.164 format (+359...)
 */
export const formatToE164 = (phone: string): string => {
    let clean = phone.trim().replace(/[\s-]/g, '');
    
    if (clean.startsWith('00')) {
        clean = '+' + clean.substring(2);
    } else if (clean.startsWith('0')) {
        clean = '+359' + clean.substring(1);
    }
    
    if (!clean.startsWith('+')) {
        clean = '+' + clean;
    }
    
    return clean;
};

export const isValidBulgarianPhone = isValidPhone;

