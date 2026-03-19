/**
 * Turnstile Utility (Frontend)
 * ===========================
 * Manages Cloudflare Turnstile site key selection and environment detection.
 * 
 * Development: 1x00000000000000000000AA (Always passes)
 * Production: VITE_TURNSTILE_SITE_KEY (from environment variables)
 */

const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

export function isLocalEnvironment(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function getTurnstileSiteKey(): string {
    // If we're on localhost or 127.0.0.1, ALWAYS use the Turnstile TEST key.
    // This avoids "Invalid Hostname" errors in Cloudflare for localhost:3000.
    if (isLocalEnvironment()) {
        return TURNSTILE_TEST_SITE_KEY;
    }

    // In production, fallback to the environment variable.
    const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    
    if (!key || key === 'PASTE_YOUR_PRODUCTION_SITE_KEY_HERE') {
        console.warn('[Turnstile] Production site key is not configured. Falling back to TEST key.');
        return TURNSTILE_TEST_SITE_KEY;
    }

    return key;
}
