/**
 * Device Session Service
 * ======================
 * Manages user_devices records in Supabase.
 * Tracks device sessions, updates last_seen_at, and handles sign-out actions.
 * Uses Realtime subscriptions for instant revocation across devices.
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

// ── Session ID Management ──

let cachedSessionId: string | null = null;

export function getCurrentSessionId(): string | null {
    if (cachedSessionId) return cachedSessionId;
    try {
        let deviceId = localStorage.getItem('supabase_device_id');
        if (!deviceId) {
            deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
            localStorage.setItem('supabase_device_id', deviceId);
        }
        cachedSessionId = deviceId;
        return deviceId;
    } catch {
        return null;
    }
}

// ── Register Device Session ──

export async function registerDeviceSession(userId: string, sessionId?: string | null, isExplicitLogin = false): Promise<boolean> {
    try {
        const device = getDeviceInfo();
        const ip = await getClientIp();
        const maskedIp = maskIpForUser(ip);

        if (!sessionId) {
            sessionId = getCurrentSessionId();
        }

        if (sessionId) {
            const { data: existingList } = await supabase
                .from('user_devices')
                .select('id, is_active')
                .eq('user_id', userId)
                .eq('session_id', sessionId)
                .order('created_at', { ascending: false })
                .limit(1);
                
            const existing = existingList?.[0];

            if (existing) {
                if (!existing.is_active && !isExplicitLogin) {
                    return false;
                }

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
                        is_active: true,
                        revoked_at: null
                    })
                    .eq('id', existing.id);
                
                await supabase
                    .from('profiles')
                    .update({
                        last_ip_address: ip,
                        last_device_info: device.label,
                        last_login_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                return true;
            }
        }

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

        await supabase
            .from('profiles')
            .update({
                last_ip_address: ip,
                last_device_info: device.label,
                last_login_at: new Date().toISOString()
            })
            .eq('id', userId);
            
        return true;
    } catch (err) {
        console.error('[DeviceService] Failed to register device session:', err);
        return true;
    }
}

// ── Update Last Seen ──

export async function updateLastSeen(userId: string): Promise<boolean> {
    try {
        const sessionId = getCurrentSessionId();
        if (!sessionId) return true;

        const { data } = await supabase
            .from('user_devices')
            .select('is_active')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
        if (data && data.is_active === false) {
            return false;
        }

        await supabase
            .from('user_devices')
            .update({ last_seen_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .eq('is_active', true);
            
        return true;
    } catch (err) {
        console.error('[DeviceService] Failed to update last_seen:', err);
        return true;
    }
}

// ── Fetch Devices ──

export async function fetchUserDevices(userId: string): Promise<UserDevice[]> {
    try {
        const currentSessionId = getCurrentSessionId();
        const { data, error } = await supabase
            .from('user_devices')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('last_seen_at', { ascending: false });

        if (error) throw error;
        
        const sessions = (data || []) as UserDevice[];
        const groupedMap = new Map<string, UserDevice>();
        
        for (const session of sessions) {
            const groupKey = session.device_group_key || session.session_id || session.id;
            
            if (!groupedMap.has(groupKey)) {
                groupedMap.set(groupKey, { ...session });
            } else {
                // If this session is more recently active, or is the CURRENT ONE,
                // update the representative session for this group.
                const existing = groupedMap.get(groupKey)!;
                
                const isThisCurrent = session.session_id === currentSessionId;
                const isExistingCurrent = existing.session_id === currentSessionId;

                if (isThisCurrent || (!isExistingCurrent && new Date(session.last_seen_at) > new Date(existing.last_seen_at))) {
                    groupedMap.set(groupKey, { ...session });
                }
            }
        }
        
        return Array.from(groupedMap.values());
    } catch (err) {
        console.error('[DeviceService] Failed to fetch devices:', err);
        return [];
    }
}

// ── Revoke Operations ──

/**
 * Revoke a device group or specific session.
 * If deviceGroupKey is provided, it revokes ALL active sessions in that group.
 */
export async function revokeDevice(deviceId: string, groupKey?: string | null): Promise<boolean> {
    try {
        let query = supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            });

        if (groupKey) {
            query = query.eq('device_group_key', groupKey);
        } else {
            query = query.eq('id', deviceId);
        }

        const { error } = await query;
        return !error;
    } catch {
        return false;
    }
}

export async function revokeAllOtherDevices(userId: string): Promise<boolean> {
    try {
        const currentSessionId = getCurrentSessionId();

        let query = supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('is_active', true);

        if (currentSessionId) {
            query = query.neq('session_id', currentSessionId);
        }

        const { error } = await query;
        if (error) throw error;

        return true;
    } catch (err) {
        console.error('[DeviceService] Failed to revoke other devices:', err);
        return false;
    }
}

export async function revokeCurrentDevice(userId: string): Promise<void> {
    try {
        const currentSessionId = getCurrentSessionId();
        if (!currentSessionId) return;

        await supabase
            .from('user_devices')
            .update({
                is_active: false,
                revoked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('session_id', currentSessionId);
    } catch (err) {
        console.error('[DeviceService] Failed to revoke current device:', err);
    }
}

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

// ── Realtime Subscription ──

/**
 * Subscribe to changes on user_devices for the current user's session.
 * When the current session is revoked (is_active set to false), the callback fires.
 * Returns an unsubscribe function.
 */
export function subscribeToDeviceRevocation(
    userId: string,
    onRevoked: () => void
): () => void {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return () => {};
    
    const channel = supabase
        .channel(`device-revoke:${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'user_devices',
                filter: `user_id=eq.${userId}`,
            },
            (payload) => {
                const newRecord = payload.new as any;
                // If the updated record is for our session and is_active is now false
                if (newRecord.session_id === sessionId && newRecord.is_active === false) {
                    onRevoked();
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
