import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Camera, MapPin, Calendar, Check, Loader2, Edit3, X } from 'lucide-react';
import { AvatarCropModal } from '../components/AvatarCropModal';

const ProfilePage = () => {
    const { user, profile, refreshProfile, loading: authLoading, getSecureNow } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [viewAvatar, setViewAvatar] = useState(false);
    
    // Initial State - Defaults to empty/loading state to avoid flashing mock data
    const [avatarImage, setAvatarImage] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    
    // File state for upload
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('FEED');
    const [tick, setTick] = useState(0); // Trigger re-render for timer
    
    // Sync local state with loaded profile
    useEffect(() => {
        if (profile) {
            setDisplayName(profile.full_name || "");
            setUsername(profile.username || "");
            setBio(profile.bio || ""); 
            if (profile.avatar_url) {
                setAvatarImage(profile.avatar_url);
            }
        }
    }, [profile]);

    // Check if verification is active and not expired
    const isVerifiedActive = useMemo(() => {
        if (!profile?.is_verified) return false;
        if (!profile.verified_until) return true; // Legacy verified without date
        return new Date(profile.verified_until) > getSecureNow();
    }, [profile, tick, getSecureNow]);
    
    // Auto-refresh when verified to catch expiration live
    useEffect(() => {
        if (isVerifiedActive && profile?.verified_until) {
            const interval = setInterval(() => setTick(t => t + 1), 1000);
            return () => clearInterval(interval);
        }
    }, [isVerifiedActive, profile?.verified_until]);

    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleSaveProfile = async () => {
        if (!user) return;
        
        try {
            setIsLoading(true);
            
            let publicAvatarUrl = profile?.avatar_url;

            // 1. Upload new avatar if selected
            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;
                
                // Upload to 'avatars' bucket
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, avatarFile, { upsert: true });
                    
                if (uploadError) {
                    console.error('Upload Error:', uploadError);
                     // If bucket doesn't exist or permissions fail, we might want to alert content
                     // For now, allow failing silently regarding the image but try saving the rest? 
                     // Or throw to stop. Let's throw to be safe for now.
                    throw uploadError;
                }
                
                // Get Public URL
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                    
                publicAvatarUrl = data.publicUrl;
            }
            
            // 2. Update Profile Data
            const updates = {
                username: username,
                full_name: displayName,
                bio: bio,
                avatar_url: publicAvatarUrl,
                updated_at: new Date(),
            };

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // 3. Delete Old Avatar (Cleanup)
            if (avatarFile && profile?.avatar_url) {
                const oldUrl = profile.avatar_url;
                // Check if it's a Supabase URL and specifically from our 'avatars' bucket
                // Also ignore default/external URLs (like Unsplash)
                if (oldUrl.includes('/avatars/') && !oldUrl.includes('unsplash.com')) {
                    try {
                        // Extract the file path relative to the bucket
                        // URL format: .../storage/v1/object/public/avatars/filename.ext
                        const oldFileName = oldUrl.split('/avatars/').pop();
                        
                        if (oldFileName) {
                            // Helper to remove any potential query params or URL encoding if necessary
                            const cleanPath = decodeURIComponent(oldFileName.split('?')[0]);
                            
                            const { error: deleteError } = await supabase.storage
                                .from('avatars')
                                .remove([cleanPath]);

                            if (deleteError) {
                                console.warn('Warning: Failed to delete old avatar:', deleteError);
                            } else {
                                console.log('Old avatar deleted successfully:', cleanPath);
                            }
                        }
                    } catch (err) {
                        console.warn('Error parsing/deleting old avatar:', err);
                    }
                }
            }

            // 4. Refresh State
            await refreshProfile();
            setIsEditing(false);
            setAvatarFile(null);
            
        } catch (error: any) {
            console.error('Error updating profile:', error);
            alert(`Failed to update profile: ${error.message || error.error_description || "Unknown error"}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setImageToCrop(e.target.result as string);
                setCropModalOpen(true);
            }
        };
        reader.readAsDataURL(file);
        
        // Reset input so same file can be selected again if needed
        if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
        }
    };

    const handleCropComplete = async (croppedImageUrl: string) => {
        try {
            // Fetch the blob from the object URL
            const response = await fetch(croppedImageUrl);
            const blob = await response.blob();
            
            // Create a File object from the blob
            const file = new File([blob], "avatar_cropped.jpg", { type: "image/jpeg" });
            
            setAvatarFile(file);
            setAvatarImage(croppedImageUrl); // Show preview
            
            // Ensure we are in editing mode so user can save
            if (!isEditing) setIsEditing(true);

        } catch (error) {
            console.error("Error processing cropped image:", error);
        }
    };
    const handleBuyVerification = async () => {
        if (!user) return;
        try {
            setIsLoading(true);
            // Simulate Payment Processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    is_verified: true,
                    verified_until: new Date(getSecureNow().getTime() + 10000).toISOString() // 10 seconds test (Secure)
                })
                .eq('id', user.id);
                
            if (error) throw error;
            
            await refreshProfile();
            // Optional: Show success toast/alert
        } catch (error) {
            console.error("Error buying verification:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gold-accent animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-text-primary mb-20">
             {/* Lightbox for Avatar */}
            {/* Lightbox for Avatar - Rendered in Portal for "X-like" behavior without z-index bugs */}
            {viewAvatar && (
                <LightboxPortal 
                    isOpen={viewAvatar} 
                    onClose={() => setViewAvatar(false)} 
                    imageSrc={avatarImage} 
                />
            )}


            <div className="container mx-auto max-w-4xl py-8">
                {/* Header Section */}
                <header className="px-4 md:px-0 py-8 flex flex-col md:flex-row items-center md:items-start border-b border-border/50">
                    {/* Avatar */}
                    <div className="relative group shrink-0 cursor-pointer" onClick={() => isEditing ? avatarInputRef.current?.click() : setViewAvatar(true)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-border overflow-hidden relative shadow-2xl bg-black"
                        >
                            <motion.img 
                                src={avatarImage} 
                                alt="Profile Avatar" 
                                className="w-full h-full object-cover"
                            />
                            
                            {/* Avatar Edit Overlay */}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Camera className="w-8 h-8 text-white/90" />
                                </div>
                            )}
                            
                            {/* View Hover Effect (Non-Editing) */}
                            {!isEditing && (
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                            )}
                        </motion.div>
                        <input 
                            type="file" 
                            ref={avatarInputRef} 
                            onChange={handleAvatarUpload} 
                            className="hidden" 
                            accept="image/*"
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Profile Info */}
                    <div className="md:ml-10 mt-6 md:mt-0 text-center md:text-left flex-grow w-full">
                        <div className="flex flex-col md:flex-row items-center md:items-start justify-between">
                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <h1 className="text-3xl md:text-4xl font-serif font-medium text-white min-h-[40px]">
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                value={displayName} 
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="bg-transparent border-b border-gold-accent focus:outline-none w-[200px]"
                                                autoFocus
                                            />
                                        ) : (displayName)}
                                    </h1>
                                    {isVerifiedActive && (
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white shrink-0">
                                            <Check className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1">
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={username} 
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="@nickname"
                                            className="bg-transparent border-b border-gold-accent focus:outline-none text-gold-accent font-medium w-[150px]"
                                        />
                                    ) : (
                                        <p className="text-gold-accent font-medium min-h-[24px]">
                                            {username ? `@${username}` : ""}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions Button */}
                            <div className="mt-4 md:mt-0">
                                {isEditing ? (
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isLoading}
                                        className="px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                        Save
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 bg-surface hover:bg-white/10 border border-white/10 text-white"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Stats / Details */}
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 text-sm text-text-muted">
                            <span className="flex items-center gap-1.5">
                                <span className="text-white font-bold">120</span> posts
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-white font-bold">45.2k</span> followers
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="text-white font-bold">1.2k</span> following
                            </span>
                        </div>

                        <div className="mt-4 text-sm text-text-muted max-w-lg mx-auto md:mx-0 leading-relaxed min-h-[20px]">
                            {isEditing ? (
                                <textarea 
                                    className="bg-transparent border border-white/20 rounded p-2 w-full text-white focus:outline-none focus:border-gold-accent"
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                />
                            ) : (
                                <p>{bio}</p>
                            )}
                        </div>
                        
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-xs text-text-muted opacity-80">
                             <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {profile?.location || "New York, USA"}
                            </span>
                             <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Joined {new Date().getFullYear()}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Navigation Tabs */}
                <div className="flex border-b border-border mt-2">
                    {['FEED', 'ABOUT', 'BOOKINGS', 'SETTINGS'].map((tab) => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-4 text-sm font-medium tracking-widest uppercase transition-colors relative ${activeTab === tab ? 'text-gold-accent' : 'text-text-muted hover:text-white'}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div 
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-accent" 
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="mt-4 min-h-[300px]">
                    {/* FEED TAB */}
                    {activeTab === 'FEED' && (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="grid grid-cols-3 gap-1"
                        >
                            {[1, 2, 3, 4, 5, 6].map((item, index) => (
                                <div key={index} className="relative aspect-square group cursor-pointer bg-surface overflow-hidden">
                                    <img 
                                        src={`https://source.unsplash.com/random/800x800?fashion,model&sig=${index}`} 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        alt={`Post ${index}`}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                         <div className="flex items-center text-white font-bold">
                                             <span className="mr-1">❤️</span> 1.2k
                                         </div>
                                          <div className="flex items-center text-white font-bold">
                                             <span className="mr-1">💬</span> 45
                                         </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'SETTINGS' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="max-w-md mx-auto py-8"
                        >
                            <h2 className="text-xl font-serif text-white mb-6">Subscription Plans</h2>
                            
                            {/* Verified Plan Card */}
                            <div className="bg-zinc-900 border border-gold-accent/30 rounded-2xl p-6 relative overflow-hidden group hover:border-gold-accent/60 transition-colors">
                                <div className="absolute top-0 right-0 bg-gold-accent text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
                                    POPULAR
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                     <div>
                                         <h3 className="text-lg font-bold text-white mb-1">Тикче</h3>
                                         <p className="text-text-muted text-sm">Get verified badge</p>
                                     </div>
                                     <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                                         <Check className="w-5 h-5 text-blue-500" />
                                     </div>
                                </div>
                                
                                <div className="text-3xl font-bold text-white mb-6">
                                    €8<span className="text-sm text-text-muted font-normal">/month</span>
                                </div>
                                
                                <ul className="space-y-3 mb-8 text-sm text-text-muted">
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-gold-accent" />
                                        <span>Blue verified badge on profile</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-gold-accent" />
                                        <span>Priority support</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="w-4 h-4 text-gold-accent" />
                                        <span>Exclusive features access</span>
                                    </li>
                                </ul>
                                
                                {isVerifiedActive ? (
                                    <button 
                                        disabled
                                        className="w-full py-3 rounded-lg font-bold bg-green-500/20 text-green-500 border border-green-500/20 cursor-default"
                                    >
                                        Active Plan (Expires soon)
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleBuyVerification}
                                        disabled={isLoading}
                                        className="w-full py-3 rounded-lg font-bold bg-gold-accent text-black hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe Now"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
            {/* Avatar Crop Modal */}
            <AvatarCropModal 
                isOpen={cropModalOpen}
                onClose={() => setCropModalOpen(false)}
                imageUrl={imageToCrop || ''}
                onCropComplete={handleCropComplete}
            />
        </div>
    );
};

export default ProfilePage;

const LightboxPortal = ({ isOpen, onClose, imageSrc }: { isOpen: boolean; onClose: () => void; imageSrc: string }) => {
    // Lock Body Scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                         className="relative w-auto h-auto flex items-center justify-center p-8"
                    >
                         {/* X-style Circular Lightbox */}
                         <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={imageSrc}
                            className="max-h-[600px] max-w-[600px] w-[80vw] h-[80vw] md:w-[500px] md:h-[500px] rounded-full object-cover shadow-[0_0_100px_-20px_rgba(255,255,255,0.1)] border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25
                            }}
                        />
                         <button
                            onClick={onClose}
                            className="fixed top-6 left-6 md:top-8 md:left-8 text-white/70 hover:text-white hover:rotate-90 transition-all duration-300 p-3 rounded-full bg-black/50 hover:bg-white/10 backdrop-blur-md border border-white/5"
                        >
                             <X className="w-6 h-6" /> 
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
