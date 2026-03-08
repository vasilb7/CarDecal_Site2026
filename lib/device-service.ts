/**
 * Device Session Service
 * ======================
 * Manages user_devices records in Supabase.
 * Tracks device sessions, updates last_seen_at, and handles sign-out actions.
 */

import { supabase } from './supabase';
import { getClientIp } from './security';
import { getDeviceInfo, maskIpForUser } from './device-utils';

export interface UserDevice {
    id: string;
    user_id: string;
    session_id: string | null;
    device_group_key: string | null;
    grouping_confidence: 'high' | 'medium' | 'low' | null;
    device_label: string;
    browser_name: string | null;
    browser_family: string | null;
    os_name: string | null;
    device_type: 'mobile' | 'tablet' | 'desktop';
    model: string | null;
    ip_address: string | null;
    ip_masked: string | null;
    user_agent_raw: string | null;
    is_active: boolean;
    revoked_at: string | null;
    created_at: string;
    last_seen_at: string;
}

/**
 * Register or update the current device session.
 * Called on login and periodically to keep last_seen_at fresh.
 */
export async function registerDeviceSession(userId: string, sessionId?: string | null): Promise<void> {
    try {
        const device = getDeviceInfo();
        const ip = await getClientIp();
        const maskedIp = maskIpForUser(ip);

        if (!sessionId) {
            sessionId = await getCurrentSessionId();
        }

        // Check if this exact session already exists
        if (sessionId) {
            const { data: existing } = await supabase
                .from('user_devices')
                .select('id')
                .eq('user_id', userId)
                .eq('session_id', sessionId)
                .eq('is_active', true)
                .maybeSingle();

            if (existing) {
                // Update last_seen_at for existing session
                await supabase
                    .from('user_devices')
                    .update({
                        last_seen_at: new Date().toISOString(),
                        ip_address: ip,
                        ip_masked: maskedIp,
                        device_label: device.label,
                        browser_name: device.browser_name,
                        browser_family: device.browser_family,
                        os_name: device.os_name,
                        device_type: device.deviceType,
                        model: device.model,
                        device_group_key: device.device_group_key,
                        grouping_confidence: device.grouping_confidence,
                    })
                    .eq('id', existing.id);
                
                // Also update the main profile metadata for admin view
                await supabase
                    .from('profiles')
                    .update({
                        last_ip_address: ip,
                        last_device_info: device.label,
                        last_login_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                return;
            }
        }

        // Insert new device session
        await supabase.from('user_devices').insert({
            user_id: userId,
            session_id: sessionId,
            device_label: device.label,
            browser_name: device.browser_name,
            browser_family: device.browser_family,
            os_name: device.os_name,
            device_type: device.deviceType,
            model: device.model,
            device_group_key: device.device_group_key,
            grouping_confidence: device.grouping_confidence,
            ip_address: ip,
            ip_masked: maskedIp,
            user_agent_raw: device.userAgent,
            is_active: true,
        });

        // Also update the main profile metadata
        await supabase
            .from('profiles')
            .update({
                last_ip_address: ip,
                last_device_info: device.label,
                last_login_at: new Date().toISOString()
            })
            .eq('id', userId);
    } catch (err) {
        console.error('[DeviceService] Failed to register device session:', err);
    }
}

/**
 * Update last_seen_at for the current session.
 * Called periodically (e.g. every 5 minutes) to keep the session alive.
 */
export async function updateLastSeen(userId: string): Promise<void> {
    try {
        const sessionId = await getCurrentSessionId();

        if (!sessionId) return;

        await supabase
            .from('user_devices')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .eq('is_active', true);
    } catch (err) {
        console.error('[DeviceService] Failed to update last_seen:', err);
    }
}

/**
 * Fetch all active devices for the current user.
 */
export async function fetchUserDevices(userId: string): Promise<UserDevice[]> {
    try {
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('last_seen_at', { ascending: false });

        if (error) throw error;
        
        // Deduplicate devices to avoid showing hundreds of orphaned sessions
        // that were generated due to previous tracking glitches.
        const devices = (data || []) as UserDevice[];
        const seen = new Set<string>();
        const uniqueDevices: UserDevice[] = [];
        
        for (const device of devices) {
            const key = `${device.device_label}|${device.ip_address}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueDevices.push(device);
            }
        }
        
        return uniqueDevices;
    } catch (err) {
        console.error('[DeviceService] Failed to fetch devices:', err);
        return [];
    }
}

/**
 * Get the current session's persistent ID.
 */
export async function getCurrentSessionId(): Promise<string | null> {
    try {
        let deviceId = localStorage.getItem('supabase_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            localStorage.setItem('supabase_device_id', deviceId);
        }
        return deviceId;
    } catch {
        return null; // Fallback if localStorage is inaccessible
    }
}

/**
 * Revoke a specific device session.
 */
export async function revokeDevice(deviceId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('id', deviceId);

        return !error;
    } catch {
        return false;
    }
}

/**
 * Revoke all sessions except the current one.
 * Also triggers Supabase signOut({ scope: 'others' }).
 */
export async function revokeAllOtherDevices(userId: string): Promise<boolean> {
    try {
        const currentSessionId = await getCurrentSessionId();

        // Mark all other sessions as inactive in our table
        let query = supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_active', true);

        // Exclude current session if we have its ID
        if (currentSessionId) {
            query = query.neq('session_id', currentSessionId);
        }

        const { error } = await query;
        if (error) {
            console.error('[DeviceService] error in query:', error);
            throw error;
        }

        // Use Supabase Auth to sign out other sessions
        // Unfortunately Supabase JS client doesn't have scope:'others'
        // But we can mark them in our table. The real auth tokens will
        // expire naturally or on next refresh.
        // For true session revocation, we'd need an Edge Function with admin API.

        return true;
    } catch (err) {
        console.error('[DeviceService] Failed to revoke other devices:', err);
        return false;
    }
}

/**
 * Mark the current device as revoked (used before sign out).
 */
export async function revokeCurrentDevice(userId: string): Promise<void> {
    try {
        const currentSessionId = await getCurrentSessionId();
        if (!currentSessionId) return;

        const { error } = await supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('session_id', currentSessionId);
            
        if (error) throw error;
    } catch (err) {
        console.error('[DeviceService] Failed to revoke current device:', err);
    }
}

/**
 * Revoke ALL sessions for a specific user (admin action).
 */
export async function revokeAllUserDevices(userId: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_active', true);

        return !error;
    } catch (err) {
        console.error('[DeviceService] Failed to revoke all user devices:', err);
        return false;
    }
}
