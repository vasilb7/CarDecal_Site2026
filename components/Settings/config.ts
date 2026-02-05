import { 
    User, 
    Lock, 
    Eye, 
    ShieldCheck, 
    Bell, 
    Briefcase, 
    Trash2 
} from 'lucide-react';

export type SettingsSectionId = 'profile' | 'security' | 'privacy' | 'bookings' | 'notifications' | 'danger';

export interface SettingsSection {
    id: SettingsSectionId;
    title: string;
    description: string;
    icon: any;
    color?: string;
}

export const SETTINGS_CONFIG: SettingsSection[] = [
    {
        id: 'profile',
        title: 'settings_page.menu.profile.title',
        description: 'settings_page.menu.profile.desc',
        icon: User
    },
    {
        id: 'security',
        title: 'settings_page.menu.security.title',
        description: 'settings_page.menu.security.desc',
        icon: Lock
    },
    {
        id: 'privacy',
        title: 'settings_page.menu.privacy.title',
        description: 'settings_page.menu.privacy.desc',
        icon: Eye
    },
    {
        id: 'bookings',
        title: 'settings_page.menu.bookings.title',
        description: 'settings_page.menu.bookings.desc',
        icon: Briefcase
    },
    {
        id: 'notifications',
        title: 'settings_page.menu.notifications.title',
        description: 'settings_page.menu.notifications.desc',
        icon: Bell
    },
    {
        id: 'danger',
        title: 'settings_page.menu.danger.title',
        description: 'settings_page.menu.danger.desc',
        icon: Trash2,
        color: 'text-red-500'
    }
];
