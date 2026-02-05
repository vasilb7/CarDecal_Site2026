import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
    User, 
    Camera, 
    Settings, 
    LogOut, 
    Grid, 
    Bookmark, 
    ChevronRight, 
    Mail, 
    MapPin, 
    Calendar, 
    Instagram, 
    Send, 
    Ruler, 
    Lock, 
    Trash2, 
    Eye, 
    ShieldCheck, 
    Save, 
    Loader2, 
    ChevronLeft, 
    X,
    CheckCircle2,
    Check,
    Edit3
} from 'lucide-react';

// New Settings Components
import SettingsShell from '../components/Settings/SettingsShell';
import SettingsMenu from '../components/Settings/SettingsMenu';
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import { SETTINGS_CONFIG, SettingsSectionId } from '../components/Settings/config';

import { AvatarCropModal } from '../components/AvatarCropModal';
import { useNavigate } from 'react-router-dom';
import { hasProfanity } from '../lib/profanity';
import { useTranslation } from 'react-i18next';
import { useToast } from '../components/Toast/ToastProvider';
import LightboxPortal from '../components/LightboxPortal.tsx';

// Helper to get consistent current time
const getSecureNow = () => new Date();

const validateImageFile = async (file: File) => {
    return { isSafe: true, reason: "" }; // Placeholder
};

// --- SETTINGS CONTROLLER ---
const PICK_KEYS = [
    'full_name','username','bio','location',
    'instagram_handle','telegram_handle',
    'height','measurements_bust','measurements_waist','measurements_hips',
    'shoe_size','hair_color','eye_color'
] as const;

const norm = (v: any) => (v === null || v === undefined ? '' : String(v).trim());

const SettingsPageController: React.FC<{ profile: any, onUpdate: (data: any) => Promise<void>, isLoading: boolean }> = ({ profile, onUpdate, isLoading }) => {
    const [activeSection, setActiveSection] = useState<SettingsSectionId | null>(null);
    const [currentData, setCurrentData] = useState<any>(null);
    const [isDirty, setIsDirty] = useState(false);

    // Initial Sync - Only run once or if profile changes and we are NOT dirty
    useEffect(() => {
        if (profile && (!currentData || !isDirty)) {
            setCurrentData(profile);
        }
    }, [profile, isDirty]);

    // Robust Dirty Check
    useEffect(() => {
        if (!profile || !currentData) return;
        const changed = PICK_KEYS.some(k => norm(profile[k]) !== norm(currentData[k]));
        setIsDirty(changed);
    }, [currentData, profile]);

    const handleSave = async () => {
        await onUpdate(currentData);
        setIsDirty(false);
    };

    if (!activeSection) return <SettingsMenu onSelect={setActiveSection} />;

    return (
        <SettingsShell 
            title={activeSection.toUpperCase()} 
            onBack={() => setActiveSection(null)}
            onSave={handleSave}
            isDirty={isDirty}
            isSaving={isLoading}
        >
            {activeSection === 'profile' && (
                <ProfileSettings data={currentData} onChange={(f, v) => setCurrentData((p: any) => ({ ...p, [f]: v }))} />
            )}
            
            {activeSection !== 'profile' && (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <Settings className="w-12 h-12 animate-pulse mb-4" />
                    <p className="text-xs uppercase tracking-widest font-black">Coming Soon / Подготовка</p>
                </div>
            )}
        </SettingsShell>
    );
};

// --- MAIN PROFILE PAGE ---
const ProfilePage: React.FC = () => {
    const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [viewAvatar, setViewAvatar] = useState(false);
    
    // Legacy states for compatibility with existing logic
    const [avatarImage, setAvatarImage] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");
    const [instagram, setInstagram] = useState("");
    const [telegram, setTelegram] = useState("");
    const [website, setWebsite] = useState("");
    const [height, setHeight] = useState("");
    const [bust, setBust] = useState("");
    const [waist, setWaist] = useState("");
    const [hips, setHips] = useState("");
    const [shoes, setShoes] = useState("");
    const [hairColor, setHairColor] = useState("");
    const [eyeColor, setEyeColor] = useState("");

    const [activeTab, setActiveTab] = useState('FEED');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [tick, setTick] = useState(0);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!authLoading && !user) navigate('/');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        if (profile) {
            setDisplayName(profile.full_name || "");
            setUsername(profile.username || "");
            setBio(profile.bio || "");
            setAvatarImage(profile.avatar_url || "");
            setLocation(profile.location || "");
            setInstagram(profile.instagram_handle || "");
            setTelegram(profile.telegram_handle || "");
            setWebsite(profile.website_url || "");
            setHeight(profile.height?.toString() || "");
            setBust(profile.measurements_bust || "");
            setWaist(profile.measurements_waist || "");
            setHips(profile.measurements_hips || "");
            setShoes(profile.shoe_size || "");
            setHairColor(profile.hair_color || "");
            setEyeColor(profile.eye_color || "");
        }
    }, [profile]);

    const isVerifiedActive = useMemo(() => {
        if (!profile?.is_verified) return false;
        if (!profile.verified_until) return true;
        return new Date(profile.verified_until) > getSecureNow();
    }, [profile, tick]);

    const handleUpdateProfile = async (updatedData?: any) => {
        if (!user) return;
        try {
            setIsLoading(true);
            const dataToSave = updatedData || {
                full_name: displayName,
                username: username,
                bio: bio,
                location: location,
                instagram_handle: instagram,
                telegram_handle: telegram,
                height: height ? parseFloat(height) : null,
                measurements_bust: bust,
                measurements_waist: waist,
                measurements_hips: hips,
                shoe_size: shoes,
                hair_color: hairColor,
                eye_color: eyeColor,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').update(dataToSave).eq('id', user.id);
            if (error) throw error;

            await refreshProfile();
            setIsEditing(false);
            showToast(t('toast.profile_update_success'), "success");
        } catch (error: any) {
            showToast(t('toast.profile_update_error', { message: error.message }), "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUpdateProfile();
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                setImageToCrop(ev.target.result as string);
                setCropModalOpen(true);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImageUrl: string) => {
        try {
            const res = await fetch(croppedImageUrl);
            const blob = await res.blob();
            const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
            
            setIsLoading(true);
            const fileName = `${user?.id}-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user?.id);
            
            await refreshProfile();
            // Don't manually setAvatarImage here, let it come from refreshed profile
            showToast(t('toast.profile_update_success'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsLoading(false);
            setCropModalOpen(false);
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 text-gold-accent animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {viewAvatar && <LightboxPortal isOpen={viewAvatar} onClose={() => setViewAvatar(false)} imageSrc={avatarImage} />}
            
            <div className="container mx-auto max-w-4xl pt-12">
                {/* Header */}
                <header className="px-6 flex flex-col md:flex-row items-center gap-10 border-b border-white/5 pb-12">
                    <div className="relative group cursor-pointer" onClick={() => isEditing ? avatarInputRef.current?.click() : setViewAvatar(true)}>
                        <div className="w-32 h-32 md:w-44 md:h-44 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-900 shadow-2xl">
                            {avatarImage ? <img src={avatarImage} className="w-full h-full object-cover" /> : <User className="w-full h-full p-8 text-white/10" />}
                            {isEditing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><Camera className="w-8 h-8" /></div>}
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                    </div>

                    <div className="flex-grow text-center md:text-left">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-serif font-bold flex items-center gap-3">
                                    {isEditing ? <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-transparent border-b border-gold-accent outline-none" /> : displayName}
                                    {isVerifiedActive && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                                </h1>
                                <p className="text-gold-accent font-medium mt-1">@{username}</p>
                            </div>
                            <button 
                                onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                                disabled={isLoading}
                                className={`px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${isEditing ? 'bg-green-500 text-black' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'} disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (isEditing ? 'Save' : 'Edit Profile')}
                            </button>
                        </div>
                        <div className="mt-6 flex justify-center md:justify-start gap-8 text-text-muted text-sm uppercase tracking-widest">
                            <span><b className="text-white">120</b> posts</span>
                            <span><b className="text-white">45k</b> followers</span>
                        </div>
                        <p className="mt-6 text-text-muted max-w-lg leading-relaxed">{bio}</p>
                    </div>
                </header>

                {/* Tabs Nav */}
                <nav className="flex justify-center border-b border-white/5 mt-4">
                    {['FEED', 'ABOUT', 'SETTINGS'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-6 text-[10px] font-black tracking-[0.3em] transition-all border-b-2 ${activeTab === tab ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-muted hover:text-white'}`}>
                            {tab}
                        </button>
                    ))}
                </nav>

                <div className="mt-12">
                    {activeTab === 'FEED' && <div className="grid grid-cols-3 gap-1 px-4"><div className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-2xl" /></div>}
                    {activeTab === 'SETTINGS' && <SettingsPageController profile={profile} onUpdate={handleUpdateProfile} isLoading={isLoading} />}
                </div>
            </div>

            {cropModalOpen && imageToCrop && <AvatarCropModal isOpen={cropModalOpen} imageUrl={imageToCrop} onCropComplete={handleCropComplete} onClose={() => setCropModalOpen(false)} />}
        </div>
    );
};

export default ProfilePage;
