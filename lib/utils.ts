import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isValidBulgarianPhone = (number: string) => {
    if (!number) return false;
    const cleanNumber = number.replace(/[\s-]/g, '');
    
    // Prevent exactly fake phones using repeating digits
    if (/(\d)\1{5}/.test(cleanNumber)) {
        return false;
    }

    const bgRegex = /^(?:\+359|00359|0)(?:[2-9]\d{6,8})$/;
    return bgRegex.test(cleanNumber);
};
