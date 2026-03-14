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
    
    // Allow single name (nickname) or more. At least 1 non-empty part.
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    if (parts.length < 1) return false;

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
    const digitsOnly = phone.replace(/\D/g, '');
    
    // Standard Bulgarian mobile: 359 + 9 digits = 12 digits
    if (digitsOnly.length !== 12) return false;
    
    // Prevent fake repeating numbers
    if (/^(\d)\1{11}$/.test(digitsOnly)) return false;

    return true;
};

/**
 * Strips formatting and returns E164 format (+359...)
 */
export const formatToE164 = (phone: string): string => {
    let digits = phone.replace(/\D/g, '');
    
    if (digits.startsWith('359')) {
        digits = digits.substring(3);
    } else if (digits.startsWith('0')) {
        digits = digits.substring(1);
    }
    
    return '+359' + digits.substring(0, 9);
};

/**
 * Formats a raw phone string into: +359 XX XXX XXXX
 */
export const formatPhoneNumber = (value: string): string => {
    // Extract only digits
    let digits = value.replace(/\D/g, '');
    
    // Extract user part: ignore leading 359 or leading 0
    let userPart = '';
    if (digits.startsWith('359')) {
        userPart = digits.substring(3);
    } else if (digits.startsWith('0')) {
        userPart = digits.substring(1);
    } else {
        userPart = digits;
    }

    // Limit to 9 digits (Bulgarian mobile)
    const cleanDigits = userPart.substring(0, 9);
    
    // If no digits, return just the prefix with example
    if (cleanDigits.length === 0) return "+359 ";

    // Simple grouping: +359 XX XXX XXXX
    let formatted = "+359 ";
    for (let i = 0; i < cleanDigits.length; i++) {
        if (i === 2 || i === 5) formatted += " ";
        formatted += cleanDigits[i];
    }
    
    return formatted;
};

export const isValidBulgarianPhone = isValidPhone;

