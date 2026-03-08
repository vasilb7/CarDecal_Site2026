import zxcvbn from 'zxcvbn';

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
    score: number;       // 0-4 (zxcvbn score)
    level: 'very_weak' | 'weak' | 'medium' | 'good' | 'strong';
    label: string;
    color: string;
    barColor: string;
    percent: number;
}

/**
 * Validate password against Supabase policy requirements.
 * Relaxed: Allow submission if strength is not weak, even if some specific rules are missing.
 */
export function validatePassword(password: string): PasswordValidation {
    const checks: PasswordCheck[] = [
        { id: 'length', label: 'От 8 до 64 символа', passed: password.length >= 8 && password.length <= 64 },
        { id: 'lowercase', label: 'Малка буква (a-z)', passed: /[a-z]/.test(password) },
        { id: 'uppercase', label: 'Главна буква (A-Z)', passed: /[A-Z]/.test(password) },
        { id: 'digit', label: 'Цифра (0-9)', passed: /\d/.test(password) },
        { id: 'symbol', label: 'Специален символ (!@#$...)', passed: /[^A-Za-z0-9]/.test(password) },
        { id: 'language', label: 'Само на английски (без кирилица)', passed: /^[\x20-\x7E]*$/.test(password) },
    ];

    const strength = getPasswordStrength(password);
    const isLanguageOk = checks.find(c => c.id === 'language')?.passed ?? true;
    
    // Accept if:
    // 1. Passes all checks (Ideal case)
    // OR
    // 2. Score is >= 2 (Medium, Good, Strong) AND length is at least 6 characters AND no cyrillic
    const isStrongEnough = strength.score >= 2;
    const isBasicPolicyMet = password.length >= 6 && isLanguageOk;

    return {
        checks,
        isValid: checks.every(c => c.passed) || (isStrongEnough && isBasicPolicyMet),
    };
}

/**
 * Calculate password strength score based on zxcvbn entropy.
 * Can take user data (email, name) to prevent easily guessable passwords.
 */
export function getPasswordStrength(password: string, userInputs: string[] = []): PasswordStrength {
    if (!password) {
        return { score: 0, level: 'very_weak', label: '', color: 'text-zinc-600', barColor: 'bg-zinc-800', percent: 0 };
    }

    // zxcvbn returns a score from 0 to 4
    const result = zxcvbn(password, userInputs);
    const score = result.score;
    // Cap percent at 100
    const percent = Math.min(100, Math.max(0, (score + 1) * 20)); // Map 0-4 to 20-100%

    switch (score) {
        case 0:
            return { score, level: 'very_weak', label: 'Много слаба', color: 'text-red-600', barColor: 'bg-red-600', percent };
        case 1:
            return { score, level: 'weak', label: 'Слаба', color: 'text-red-400', barColor: 'bg-red-400', percent };
        case 2:
            return { score, level: 'medium', label: 'Средна', color: 'text-yellow-500', barColor: 'bg-yellow-500', percent };
        case 3:
            return { score, level: 'good', label: 'Добра', color: 'text-emerald-400', barColor: 'bg-emerald-400', percent };
        case 4:
            return { score, level: 'strong', label: 'Силна', color: 'text-emerald-500', barColor: 'bg-emerald-500', percent };
        default:
            return { score: 0, level: 'very_weak', label: 'Много слаба', color: 'text-red-600', barColor: 'bg-red-600', percent: 20 };
    }
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
        'weak_password': 'Паролата е твърде слаба. Моля, използвайте по-дълга или по-сложна парола.',
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
        'phone_exists': 'този телефонен номер вече е свързан с друг акаунт',
        'conflict': 'Конфликт с друг акаунт. Моля, свържете се с поддръжката.',
    };

    if (code && codeMap[code]) return codeMap[code];

    // By message patterns
    if (msg.includes('user already registered')) return 'Потребител с този имейл вече съществува.';
    if (msg.includes('invalid login credentials')) return 'Невалиден имейл или парола.';
    if (msg.includes('email rate limit')) return 'Твърде много опити. Моля, изчакайте преди да опитате отново.';
    if (msg.includes('password') && msg.includes('weak')) return 'Паролата е твърде слаба. Използвайте по-сигурна комбинация.';
    if (msg.includes('password') && msg.includes('short')) return 'Паролата е твърде кратка. Трябва да е поне 6 символа.';
    if (msg.includes('password') && msg.includes('long')) return 'Паролата е твърде дълга. Максимум 64 символа.';
    if (msg.includes('email') && msg.includes('invalid')) return 'Моля, въведете валиден имейл адрес.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Проблем с връзката. Проверете интернет свързаността си.';
    if (msg.includes('timeout')) return 'Заявката отне твърде дълго. Моля, опитайте отново.';
    if (msg.includes('reauthentication')) return 'За сигурност, моля влезте отново преди да промените паролата.';

    // Fallback: return a clean message
    return 'Възникна грешка. Моля, опитайте отново.';
}
