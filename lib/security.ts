/**
 * Security Utilities
 * ==================
 * Minimal, privacy-conscious security helpers for:
 * - Login event logging
 * - Device fingerprinting (non-invasive)
 * - IP address masking for non-super-admin display
 * - Suspicious login detection support
 *
 * Retention policy:
 * - General logs: 90 days (auto-cleaned by pg_cron)
 * - Ban-related logs: 1 year
 * - Session data: until logout or expiry
 * - Remember-me: up to 30 days
 *
 * Access control:
 * - Full IP/device data: admin role only
 * - Other roles: masked data or no access
 */

import { supabase } from './supabase';

// ── Types ──
export type SecurityEventType =
    | 'login_success'
    | 'login_failed'
    | 'logout'
    | 'password_change'
    | 'session_revoke'
    | 'session_revoke_all'
    | 'ban_applied'
    | 'ban_bypass_attempt'
    | 'suspicious_login'
    | 'account_locked'
    | 'account_unlocked'
    | 'remember_me_set'
    | 'failed_rate_limit';

export interface SecurityLog {
    id: string;
    user_id: string | null;
    event_type: SecurityEventType;
    ip_address: string | null;
    device_info: string | null;
    metadata: Record<string, any>;
    created_at: string;
}

// ── IP Fetching (cached per session) ──

let cachedIp: string | null = null;

export async function getClientIp(): Promise<string | null> {
    if (cachedIp) return cachedIp;
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        cachedIp = data.ip || null;
        return cachedIp;
    } catch {
        return null;
    }
}

// ── Device Info (minimal, non-invasive) ──

export function getDeviceInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Macintosh')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
}

export function getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Edg/')) return 'Edge';
    if (ua.includes('Chrome/')) return 'Chrome';
    if (ua.includes('Firefox/')) return 'Firefox';
    if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
    if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
    return 'Other';
}

export function getDeviceFingerprint(): string {
    return `${getDeviceInfo()} / ${getBrowserInfo()}`;
}

// ── IP Masking (for non-super-admin display) ──

export function maskIpAddress(ip: string | null): string {
    if (!ip) return '—';
    const parts = ip.split('.');
    if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.*.*`;
    }
    // IPv6 - mask last half
    if (ip.includes(':')) {
        const v6parts = ip.split(':');
        return v6parts.slice(0, Math.ceil(v6parts.length / 2)).join(':') + ':****';
    }
    return '***';
}

// ── Security Event Logging ──

export async function logSecurityEvent(
    eventType: SecurityEventType,
    userId?: string | null,
    extraMetadata?: Record<string, any>
): Promise<void> {
    try {
        const ip = await getClientIp();
        const device = getDeviceFingerprint();

        await supabase.rpc('log_security_event', {
            p_user_id: userId || null,
            p_event_type: eventType,
            p_ip_address: ip,
            p_device_info: device,
            p_metadata: extraMetadata || {},
        });
    } catch (err) {
        console.error('[Security] Failed to log event:', err);
    }
}

// ── Failed Login Recording ──

export async function recordFailedLogin(email: string): Promise<{ locked: boolean; attempts: number }> {
    try {
        const ip = await getClientIp();
        const device = getDeviceFingerprint();

        const { data, error } = await supabase.rpc('record_failed_login', {
            p_email: email,
            p_ip_address: ip,
            p_device_info: device,
        });

        if (error) throw error;
        return data as { locked: boolean; attempts: number };
    } catch (err) {
        console.error('[Security] Failed to record failed login:', err);
        return { locked: false, attempts: 0 };
    }
}

// ── Successful Login Recording ──

export async function recordSuccessfulLogin(userId?: string | null): Promise<{ new_ip: boolean; suspicious: boolean }> {
    try {
        const ip = await getClientIp();
        const device = getDeviceFingerprint();

        const { data, error } = await supabase.rpc('record_successful_login', {
            p_ip_address: ip,
            p_device_info: device,
            p_user_id: userId || null,
        });

        if (error) throw error;
        return data as { new_ip: boolean; suspicious: boolean };
    } catch (err) {
        console.error('[Security] Failed to record successful login:', err);
        return { new_ip: false, suspicious: false };
    }
}

// ── Admin: Fetch Security Logs ──

export async function fetchSecurityLogs(
    userId?: string | null,
    limit = 50,
    offset = 0
): Promise<SecurityLog[]> {
    try {
        const { data, error } = await supabase.rpc('get_security_logs', {
            p_user_id: userId || null,
            p_limit: limit,
            p_offset: offset,
        });

        if (error) throw error;
        return (data || []) as SecurityLog[];
    } catch (err) {
        console.error('[Security] Failed to fetch logs:', err);
        return [];
    }
}

// ── Event Type Labels (Bulgarian) ──

export const securityEventLabels: Record<SecurityEventType, string> = {
    login_success: 'Успешен вход',
    login_failed: 'Неуспешен вход',
    logout: 'Изход',
    password_change: 'Смяна на парола',
    session_revoke: 'Прекратена сесия',
    session_revoke_all: 'Всички сесии прекратени',
    ban_applied: 'Бан наложен',
    ban_bypass_attempt: 'Опит за заобикаляне на бан',
    suspicious_login: 'Подозрителен вход',
    account_locked: 'Акаунт заключен',
    account_unlocked: 'Акаунт отключен',
    remember_me_set: '"Запомни ме" активирано',
    failed_rate_limit: 'Достигнат лимит на опити',
};

// ── Event Type Colors (for admin UI) ──

export const securityEventColors: Record<SecurityEventType, string> = {
    login_success: 'text-green-400',
    login_failed: 'text-yellow-400',
    logout: 'text-zinc-400',
    password_change: 'text-blue-400',
    session_revoke: 'text-orange-400',
    session_revoke_all: 'text-orange-500',
    ban_applied: 'text-red-500',
    ban_bypass_attempt: 'text-red-600',
    suspicious_login: 'text-amber-500',
    account_locked: 'text-red-400',
    account_unlocked: 'text-green-500',
    remember_me_set: 'text-sky-400',
    failed_rate_limit: 'text-red-400',
};
