// ─── Password Validation & Strength Utilities ──────────────────────────────
// Matches Supabase Auth password policy:
// - Min 10 characters
// - At least 1 lowercase letter
// - At least 1 uppercase letter
// - At least 1 digit
// - At least 1 special symbol

export interface PasswordCheck {
    id: string;
    label: string;
    passed: boolean;
}

export interface PasswordValidation {
    checks: PasswordCheck[];
    isValid: boolean;
}

export interface PasswordStrength {
    score: number;       // 0-5
    level: 'none' | 'weak' | 'medium' | 'strong';
    label: string;
    color: string;
    barColor: string;
    percent: number;
}

/**
 * Validate password against Supabase policy requirements.
 */
export function validatePassword(password: string): PasswordValidation {
    const checks: PasswordCheck[] = [
        { id: 'length', label: 'Минимум 10 символа', passed: password.length >= 10 },
        { id: 'lowercase', label: 'Малка буква (a-z)', passed: /[a-z]/.test(password) },
        { id: 'uppercase', label: 'Главна буква (A-Z)', passed: /[A-Z]/.test(password) },
        { id: 'digit', label: 'Цифра (0-9)', passed: /\d/.test(password) },
        { id: 'symbol', label: 'Специален символ (!@#$...)', passed: /[^A-Za-z0-9]/.test(password) },
    ];

    return {
        checks,
        isValid: checks.every(c => c.passed),
    };
}

/**
 * Calculate password strength score and visual properties.
 */
export function getPasswordStrength(password: string): PasswordStrength {
    if (!password) {
        return { score: 0, level: 'none', label: '', color: 'text-zinc-600', barColor: 'bg-zinc-800', percent: 0 };
    }

    const { checks } = validatePassword(password);
    const score = checks.filter(c => c.passed).length;

    if (score <= 2) {
        return { score, level: 'weak', label: 'Слаба', color: 'text-red-500', barColor: 'bg-red-500', percent: (score / 5) * 100 };
    }
    if (score <= 4) {
        return { score, level: 'medium', label: 'Средна', color: 'text-yellow-500', barColor: 'bg-yellow-500', percent: (score / 5) * 100 };
    }
    return { score, level: 'strong', label: 'Силна', color: 'text-emerald-500', barColor: 'bg-emerald-500', percent: 100 };
}

/**
 * Translate Supabase auth errors into user-friendly Bulgarian messages.
 * Handles error codes, messages, and common patterns.
 */
export function translateAuthError(error: any): string {
    if (!error) return 'Възникна неочаквана грешка.';

    const code = error.code || error.error_code || '';
    const msg = (error.message || error.msg || '').toLowerCase();

    // By error code
    const codeMap: Record<string, string> = {
        'weak_password': 'Паролата е твърде слаба. Трябва да съдържа минимум 10 символа, главна и малка буква, цифра и специален символ.',
        'same_password': 'Новата парола не може да е същата като текущата.',
        'email_exists': 'Този имейл адрес вече е регистриран.',
        'user_already_exists': 'Потребител с този имейл вече съществува.',
        'invalid_credentials': 'Невалиден имейл или парола.',
        'email_not_confirmed': 'Имейлът не е потвърден. Проверете пощата си.',
        'signup_disabled': 'Регистрацията временно не е достъпна.',
        'user_not_found': 'Не е намерен потребител с този имейл.',
        'user_banned': 'Акаунтът ви е временно блокиран.',
        'reauthentication_needed': 'За сигурност, моля влезте отново в акаунта си преди да промените паролата.',
        'reauthentication_not_valid': 'Удостоверяването е невалидно. Моля, опитайте отново.',
        'session_expired': 'Сесията ви е изтекла. Моля, влезте отново.',
        'over_request_rate_limit': 'Твърде много опити. Моля, изчакайте малко и опитайте отново.',
        'over_email_send_rate_limit': 'Изпратени са твърде много имейли. Моля, изчакайте преди да опитате отново.',
        'otp_expired': 'Кодът за потвърждение е изтекъл. Моля, заявете нов.',
        'validation_failed': 'Невалидни данни. Моля, проверете въведената информация.',
        'phone_exists': 'Този телефонен номер вече е регистриран.',
        'conflict': 'Конфликт с друг акаунт. Моля, свържете се с поддръжката.',
    };

    if (code && codeMap[code]) return codeMap[code];

    // By message patterns
    if (msg.includes('user already registered')) return 'Потребител с този имейл вече съществува.';
    if (msg.includes('invalid login credentials')) return 'Невалиден имейл или парола.';
    if (msg.includes('email rate limit')) return 'Твърде много опити. Моля, изчакайте преди да опитате отново.';
    if (msg.includes('password') && msg.includes('weak')) return 'Паролата е твърде слаба. Минимум 10 символа с главна буква, малка буква, цифра и символ.';
    if (msg.includes('password') && msg.includes('short')) return 'Паролата е твърде кратка. Минимум 10 символа.';
    if (msg.includes('email') && msg.includes('invalid')) return 'Моля, въведете валиден имейл адрес.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Проблем с връзката. Проверете интернет свързаността си.';
    if (msg.includes('timeout')) return 'Заявката отне твърде дълго. Моля, опитайте отново.';
    if (msg.includes('reauthentication')) return 'За сигурност, моля влезте отново преди да промените паролата.';

    // Fallback: return a clean message
    return 'Възникна грешка. Моля, опитайте отново.';
}
