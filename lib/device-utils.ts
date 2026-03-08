/**
 * Device Detection Utilities
 * ==========================
 * Privacy-conscious, minimal fingerprinting for device/session display.
 * Generates clean Bulgarian labels for the user profile "Devices" section.
 */

// ── Types ──

export interface DeviceInfo {
    browser_name: string;
    browser_family: string;
    os_name: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    model: string | null;
    label: string;
    userAgent: string;
    device_group_key: string;
    grouping_confidence: 'high' | 'medium' | 'low';
}

// ── Browser Detection ──

export function detectBrowser(ua: string): string {
    // Brave detection via navigator object (synchronous)
    if (typeof navigator !== 'undefined' && (navigator as any)?.brave) return 'Brave';
    
    // Order matters: check more specific strings first
    if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
    if (ua.includes('YaBrowser')) return 'Yandex';
    if (ua.includes('OPR') || ua.includes('Opera')) return 'Opera';
    if (ua.includes('Vivaldi')) return 'Vivaldi';
    if (ua.includes('Brave')) return 'Brave';
    if (ua.includes('Edg/') || ua.includes('EdgA/') || ua.includes('EdgiOS/')) return 'Edge';
    if (ua.includes('Firefox') || ua.includes('FxiOS')) return 'Firefox';
    if (ua.includes('CriOS')) return 'Chrome'; // Chrome on iOS
    if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) return 'Chrome';
    if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('CriOS')) return 'Safari';
    return 'Браузър';
}

// ── Platform / OS Detection ──

export function detectPlatform(ua: string): string {
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Linux') && !ua.includes('Android')) return 'Linux';
    if (ua.includes('CrOS')) return 'Chrome OS';
    return 'Неизвестно';
}

// ── Device Type Detection ──

export function detectDeviceType(ua: string): 'mobile' | 'tablet' | 'desktop' {
    // Check for tablet patterns first
    if (ua.includes('iPad')) return 'tablet';
    if (ua.includes('Android') && !ua.includes('Mobile')) return 'tablet';
    if (ua.includes('Tablet')) return 'tablet';

    // Check for mobile
    if (ua.includes('iPhone')) return 'mobile';
    if (ua.includes('Android') && ua.includes('Mobile')) return 'mobile';
    if (/Mobile|webOS|iPod|BlackBerry|Windows Phone/i.test(ua)) return 'mobile';

    return 'desktop';
}

// ── Model Detection (best-effort, privacy-conscious) ──

export function detectModel(ua: string): string | null {
    // iPhone model (e.g. iPhone)
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';

    // Android model: try to extract from "Build/..." pattern
    // e.g. "SM-G998B" or "Pixel 7"
    const androidMatch = ua.match(/;\s*([^;)]+)\s*Build\//);
    if (androidMatch) {
        const raw = androidMatch[1].trim();
        // Only return if it looks like a real model (not just "Linux" or generic names)
        if (raw.length > 2 && raw.length < 40 && !/^(Linux|Android|en-|KFTT)/.test(raw)) {
            return raw;
        }
    }

    // macOS
    if (ua.includes('Macintosh')) return 'Mac';

    return null;
}

// ── Device Label Generation (Bulgarian) ──

export function generateDeviceLabel(browser: string, platform: string, model: string | null): string {
    const platformPart = platform || 'Неизвестно';
    let label = platformPart;

    // Add model if available and different from platform (helpful for mobile)
    if (model && model !== platform && model !== 'iPhone' && model !== 'iPad' && model !== 'Mac') {
        label += ` \u2022 ${model}`;
    }

    return label;
}

// ── Master Detection Function ──

export function getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const browser_name = detectBrowser(ua);
    const os_name = detectPlatform(ua);
    const deviceType = detectDeviceType(ua);
    const model = detectModel(ua);
    const label = generateDeviceLabel(browser_name, os_name, model);

    // Basic heuristic for browser family
    let browser_family = browser_name;
    if (['Chrome', 'Edge', 'Brave', 'Vivaldi', 'Opera', 'Yandex'].includes(browser_name)) {
        browser_family = 'Chromium';
    } else if (browser_name === 'Safari') {
        browser_family = 'WebKit';
    } else if (browser_name === 'Firefox') {
        browser_family = 'Gecko';
    }

    // Generate a hardware fingerprint (stable across browsers on same device)
    const fingerprint = [
        window.screen.width,
        window.screen.height,
        navigator.hardwareConcurrency || 0,
        Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');

    // Create a physical device ID hash (simple)
    const physical_device_id = btoa(fingerprint).substring(0, 16);

    // Try to retrieve a persistent session ID for the same browser
    let session_id = localStorage.getItem('supabase_device_id');
    if (!session_id) {
        session_id = Math.random().toString(36).substring(2, 15);
        localStorage.setItem('supabase_device_id', session_id);
    }

    // Use physical_device_id for grouping logic
    const device_group_key = `${os_name}-${deviceType}-${physical_device_id}`.toLowerCase();
    const grouping_confidence = 'medium'; 

    return { 
        browser_name, 
        browser_family,
        os_name, 
        deviceType, 
        model, 
        label, 
        userAgent: ua,
        device_group_key,
        grouping_confidence
    };
}

// ── IP Masking (for user-facing display) ──

export function maskIpForUser(ip: string | null): string {
    if (!ip) return '-';

    // IPv4: show first two octets
    const v4Parts = ip.split('.');
    if (v4Parts.length === 4) {
        return `${v4Parts[0]}.${v4Parts[1]}.xxx.xxx`;
    }

    // IPv6: show first half
    if (ip.includes(':')) {
        const v6Parts = ip.split(':');
        const half = Math.ceil(v6Parts.length / 2);
        return v6Parts.slice(0, half).join(':') + ':xxxx';
    }

    return '***';
}

// ── Relative Time (Bulgarian) ──

export function relativeTimeBg(dateStr: string | null): string {
    if (!dateStr) return 'Неизвестно';

    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;

    if (diffMs < 0) return 'Току-що';

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Току-що';
    if (minutes < 60) return `Преди ${minutes} ${minutes === 1 ? 'минута' : 'минути'}`;
    if (hours < 24) return `Преди ${hours} ${hours === 1 ? 'час' : 'часа'}`;
    if (days === 1) return 'Вчера';
    if (days < 7) return `Преди ${days} дни`;
    if (days < 30) return `Преди ${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? 'седмица' : 'седмици'}`;
    if (days < 365) return `Преди ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? 'месец' : 'месеца'}`;

    return new Date(dateStr).toLocaleDateString('bg-BG', { day: 'numeric', month: 'short', year: 'numeric' });
}
