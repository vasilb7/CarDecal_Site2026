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
    Edit3,
    Plus,
    Upload
} from 'lucide-react';

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../hooks/useToast';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { GridIcon, PinIcon, CloseIcon, HeartIcon, ChatBubbleIcon, BookmarkIcon, PaperAirplaneIcon, MoreHorizontalIcon, EmojiIcon, VerifiedIcon } from '../components/IconComponents';
import StoryViewer from '../components/StoryViewer';
import StoriesRing from '../components/StoriesRing';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { hasProfanity } from '../lib/profanity';
import type { Post, Highlight, Model, Comment, Story } from '../types';

// New Settings Components
import SettingsShell from '../components/Settings/SettingsShell';
import SettingsMenu from '../components/Settings/SettingsMenu';
import ProfileSettings from '../components/Settings/sections/ProfileSettings';
import { SETTINGS_CONFIG, SettingsSectionId } from '../components/Settings/config';

// Helper to get consistent current time
const getSecureNow = () => new Date();

interface LightboxProps {
    post: Post;
    index: number;
    total: number;
    model: any;
    onClose: () => void;
    onLike: (postId: string) => Promise<void>;
    onComment: (postId: string, content: string) => Promise<void>;
}

const ImageLightbox: React.FC<LightboxProps> = ({ post, index, total, model, onClose, onLike, onComment }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const imgParam = searchParams.get('img');
    const currentImageIndex = imgParam ? parseInt(imgParam, 10) : 0;
    
    const isLiked = user ? (post.liked_by_users || []).includes(user.id) : false;
    const [isZoomed, setIsZoomed] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const lastTap = useRef<number>(0);

    const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            handleLike();
        }
        lastTap.current = now;
    };

    const handleLike = async () => {
        if (!user) {
            showToast(t('auth.login_required'), "error");
            return;
        }
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
        await onLike(post.id);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showToast(t('auth.login_required'), "error");
            return;
        }
        if (!commentText.trim()) return;

        try {
            setIsSubmittingComment(true);
            await onComment(post.id, commentText.trim());
            setCommentText('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            showToast(t('toast.link_copied'), "success");
        });
    };

    const nextPost = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const currentIndex = model.posts.findIndex((p: any) => p.id === post.id);
        const nextIdx = (currentIndex + 1) % model.posts.length;
        setSearchParams({ post: model.posts[nextIdx].id, img: '0' }, { replace: true });
    };

    const prevPost = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const currentIndex = model.posts.findIndex((p: any) => p.id === post.id);
        const prevIdx = (currentIndex - 1 + model.posts.length) % model.posts.length;
        setSearchParams({ post: model.posts[prevIdx].id, img: '0' }, { replace: true });
    };

    useEffect(() => {
        document.body.classList.add('modal-open');
        if (!searchParams.get('img')) {
             setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('img', '0');
                return next;
             }, { replace: true });
        }
        return () => {
             document.body.classList.remove('modal-open');
        };
    }, [post.id]);

    const hasMultipleImages = post.images && post.images.length > 1;
    const currentSrc = hasMultipleImages && post.images ? post.images[currentImageIndex] : post.src;

    const transformRef = useRef<any>(null);
    const scaleRef = useRef(1);

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center md:p-8 backdrop-blur-[2px]" 
            onClick={onClose}
        >
            <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors hidden md:block z-50 p-2">
                <CloseIcon className="w-6 h-6" />
            </button>

            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.2 }}
                className="relative w-full h-full md:max-w-6xl md:h-[95vh] md:max-h-[900px] flex flex-col md:flex-row bg-surface overflow-y-auto overflow-x-hidden md:overflow-hidden md:rounded-[4px] shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                {/* Media Section */}
                <div className="flex-grow relative bg-black flex items-center justify-center overflow-hidden h-auto min-h-[50vh] md:h-full group w-full">
                    <div className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 scale-110 pointer-events-none" style={{ backgroundImage: `url("${currentSrc}")` }} />
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <TransformWrapper
                            key={currentSrc}
                            ref={transformRef}
                            onTransformed={(e) => { scaleRef.current = e.state.scale; }}
                        >
                            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <div onClick={handleDoubleTap} className="relative w-full h-full flex items-center justify-center cursor-zoom-in">
                                    <motion.img src={currentSrc} className="max-w-full max-h-full w-auto h-auto object-contain select-none shadow-2xl" />
                                    <AnimatePresence>
                                        {showHeart && (
                                            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }} transition={{ duration: 0.8 }} className="absolute z-30 text-white pointer-events-none">
                                                <HeartIcon className="w-24 h-24 fill-current text-white shadow-xl" filled={true} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    </div>

                    {/* Navigation */}
                    <button onClick={prevPost} className="absolute left-4 z-40 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-all hidden lg:flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                    </button>
                    <button onClick={nextPost} className="absolute right-4 z-40 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-all hidden lg:flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                </div>

                {/* Info Section */}
                <div className="flex flex-col bg-surface w-full md:w-[335px] lg:w-[400px] shrink-0 h-full">
                    <div className="hidden md:flex items-center justify-between p-3.5 shrink-0">
                        <div className="flex items-center space-x-3">
                            <img src={model.avatar} alt={model.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                            <div className="flex items-center">
                                <span className="font-semibold text-sm text-text-primary mr-1">{model.name}</span>
                                {model.is_verified && <VerifiedIcon className="w-4 h-4" />}
                            </div>
                        </div>
                        <button className="text-text-primary hover:opacity-60">
                            <MoreHorizontalIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 md:flex-1 md:overflow-y-auto custom-scrollbar space-y-5">
                        <div className="flex items-start space-x-3">
                            <img src={model.avatar} className="w-8 h-8 rounded-full object-cover shrink-0 hidden md:block" />
                            <div className="flex-1 text-sm">
                                <p className="text-text-primary leading-tight"><span className="font-semibold mr-1">{model.name}</span>{post.caption}</p>
                                <span className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-4 pt-4">
                            {post.comments?.map((comment: any) => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <img src={comment.user_avatar || '/default-avatar.png'} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                    <div className="flex-1 text-sm">
                                        <p className="text-text-primary leading-tight"><span className="font-semibold mr-2">{comment.username}</span>{comment.content}</p>
                                        <span className="text-[10px] text-text-muted mt-1">{new Date(comment.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-surface mt-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                                <button onClick={handleLike} className={`${isLiked ? 'text-red-500' : 'text-text-primary'} transition-colors transform active:scale-125`}><HeartIcon className="w-6 h-6" filled={isLiked} /></button>
                                <button className="text-text-primary" onClick={() => document.getElementById('comment-input')?.focus()}><ChatBubbleIcon className="w-6 h-6" /></button>
                                <button onClick={handleShare} className="text-text-primary"><PaperAirplaneIcon className="w-6 h-6" /></button>
                            </div>
                            <button className="text-text-primary"><BookmarkIcon className="w-6 h-6" /></button>
                        </div>
                        <p className="text-sm font-semibold text-text-primary mb-2">{(post.liked_by_users?.length || 0).toLocaleString()} {t('profile.likes')}</p>
                        
                        <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 border-t border-border/50 pt-3 mt-3">
                            <EmojiIcon className="w-5 h-5 text-text-muted" />
                            <input id="comment-input" type="text" placeholder={t('profile.add_comment')} className="flex-1 bg-transparent text-sm text-text-primary outline-none" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                            <button type="submit" disabled={!commentText.trim() || isSubmittingComment} className="text-sm font-semibold text-gold-accent disabled:opacity-30">{isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : t('profile.post_comment')}</button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
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

    useEffect(() => {
        if (profile && (!currentData || !isDirty)) {
            setCurrentData(profile);
        }
    }, [profile, isDirty]);

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
        <SettingsShell title={activeSection.toUpperCase()} onBack={() => setActiveSection(null)} onSave={handleSave} isDirty={isDirty} isSaving={isLoading}>
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
    const { user, profile, loading: authLoading, refreshProfile, isAdmin, isVerified } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language.split("-")[0] || "bg";
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showStoryViewer, setShowStoryViewer] = useState(false);
    const [activeStories, setActiveStories] = useState<Story[]>([]);
    const [activeTab, setActiveTab] = useState('feed');

    const [posts, setPosts] = useState<Post[]>([]);
    useEffect(() => { if (profile) setPosts(profile.posts || []); }, [profile]);

    const modelLike = useMemo(() => {
        if (!profile) return null;
        return {
            ...profile,
            id: profile.id,
            slug: profile.username || profile.id,
            name: profile.full_name || 'User',
            avatar: profile.avatar_url || '',
            stories: profile.stories || [],
            posts: posts || [],
            is_verified: isVerified,
            nickname: profile.username,
            bio: profile.bio,
            background_image: profile.background_image,
            categories: profile.categories || [],
            location: profile.location,
            height: profile.height,
            measurements: profile.measurements || [
                profile.measurements_bust,
                profile.measurements_waist,
                profile.measurements_hips
            ].filter(Boolean).join('-'),
            hair_color: profile.hair_color,
            eye_color: profile.eye_color,
            highlights: [],
            cover_image: [],
            gender: 'Female' as const
        } as Model;
    }, [profile, posts, isVerified]);

    const selectedPost = searchParams.get('post') && modelLike
        ? modelLike.posts.find((p: any) => p.id === searchParams.get('post')) 
        : null;

    const handleUpdateProfile = async (updatedData?: any, silent = false) => {
        if (!user || !profile) return;
        try {
            setIsLoading(true);
            
            // Check if we are updating a model profile (if the user role is admin/model and they have a record in models table)
            // For now, prioritize updating the 'profiles' table which is the source of truth for the current user
            const { error } = await supabase.from('profiles').update(updatedData).eq('id', user.id);
            if (error) throw error;
            
            await refreshProfile();
            if (!silent) showToast(t('toast.profile_update_success'), "success");
        } catch (error: any) {
            showToast(t('toast.profile_update_error', { message: error.message }), "error");
        } finally { setIsLoading(false); }
    };

    const handleLikePost = async (postId: string) => {
        if (!user || !profile) return;
        const updatedPosts = posts.map(p => {
            if (p.id === postId) {
                const liked = p.liked_by_users || [];
                return { ...p, liked_by_users: liked.includes(user.id) ? liked.filter(id => id !== user.id) : [...liked, user.id] };
            }
            return p;
        });
        await handleUpdateProfile({ posts: updatedPosts });
    };

    const handleAddComment = async (postId: string, content: string) => {
        if (!user || !profile) return;
        const comment: Comment = { id: `c_${Date.now()}`, user_id: user.id, username: profile.username || 'User', user_avatar: profile.avatar_url, content, created_at: new Date().toISOString() };
        const updatedPosts = posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p);
        await handleUpdateProfile({ posts: updatedPosts });
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm(t('admin.confirm_delete_post'))) return;
        const updatedPosts = posts.filter(p => p.id !== postId);
        await handleUpdateProfile({ posts: updatedPosts });
    };

    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !user) return;
        try {
            setIsLoading(true);
            const newPosts: Post[] = [];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const path = `profiles/${user.id}/gallery/${Date.now()}_${file.name}`;
                await supabase.storage.from('models').upload(path, file);
                const { data } = supabase.storage.from('models').getPublicUrl(path);
                newPosts.push({ id: `p_${Date.now()}_${i}`, src: data.publicUrl, type: 'image', caption: '', liked_by_users: [], comments: [], date: new Date().toISOString(), tags: [] });
            }
            await handleUpdateProfile({ posts: [...posts, ...newPosts] });
        } catch (error: any) { showToast(error.message, "error"); }
        finally { setIsLoading(false); }
    };

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        try {
            setIsLoading(true);
            const path = `profiles/${user.id}/background/${Date.now()}_${file.name}`;
            
            // Upload to models bucket (confirmed public and existing)
            const { error: uploadError } = await supabase.storage
                .from('models')
                .upload(path, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('models').getPublicUrl(path);
            
            await handleUpdateProfile({ background_image: publicUrl });
        } catch (error: any) { 
            console.error('Upload Error:', error);
            showToast(error.message || 'Upload failed', "error"); 
        } finally { 
            setIsLoading(false); 
        }
    };

    if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="w-10 h-10 text-gold-accent animate-spin" /></div>;
    if (!profile || !modelLike) return null;

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background Hero */}
            <div className="relative h-[30vh] md:h-[40vh] overflow-hidden group/bg">
                {modelLike.background_image ? (
                    <img src={modelLike.background_image} className="w-full h-full object-cover opacity-60 transition-all duration-1000 group-hover/bg:opacity-80" alt="Background" />
                ) : (
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-3xl" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent z-10" />
                
                {/* Upload Background Label */}
                <label className={`absolute bottom-4 right-4 z-20 cursor-pointer p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all opacity-0 group-hover/bg:opacity-100 border border-white/10 ${isLoading ? 'pointer-events-none' : ''}`}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    <input type="file" className="hidden" onChange={handleBackgroundUpload} accept="image/*" disabled={isLoading} />
                </label>
            </div>

            <div className="container mx-auto max-w-4xl px-4 md:px-0 relative z-10 pb-20 -mt-32">
                <header className="flex flex-col items-center md:items-start pb-8">
                    <div className="relative mb-6">
                        <StoriesRing 
                            model={modelLike} isAdmin={true} 
                            onStoriesUpdate={() => {}} 
                            onTriggerUpdate={(updates) => handleUpdateProfile(updates, true)}
                            onViewStory={(stories) => { setActiveStories(stories); setShowStoryViewer(true); }}
                        />
                    </div>
                    <div className="text-center md:text-left w-full">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-center md:justify-start">
                                    <h1 className="text-3xl md:text-5xl font-serif">{modelLike.name}</h1>
                                    {modelLike.is_verified && <VerifiedIcon className="w-6 h-6 ml-2 mt-1" />}
                                </div>
                                <p className="text-gold-accent text-base md:text-lg font-medium mt-1 lowercase">@{modelLike.nickname}</p>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setActiveTab(activeTab === 'settings' ? 'feed' : 'settings')}
                                    className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                        activeTab === 'settings' 
                                            ? 'bg-gold-accent text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                                            : 'bg-white text-black hover:bg-white/90'
                                    }`}
                                >
                                    {activeTab === 'settings' ? t('profile.view_mode', 'View Mode') : t('profile.edit_mode', 'Edit Mode')}
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
                            {modelLike.categories?.map((cat: string) => (
                                <span key={cat} className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 text-text-muted px-4 py-1.5 rounded-none">
                                    {t(`attributes.categories.${cat}`, cat)}
                                </span>
                            ))}
                        </div>
                        <p className="mt-6 text-sm text-text-muted max-w-xl mx-auto md:mx-0 font-light leading-relaxed">{modelLike.bio}</p>
                    </div>
                </header>

                <div className="flex">
                    {['feed', 'about', 'settings'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-xs font-bold tracking-widest uppercase transition-all relative ${activeTab === tab ? 'text-gold-accent' : 'text-text-muted hover:text-white'}`}>
                            {t(`profile.${tab}`, tab)} {tab === 'feed' && <span className="ml-1 opacity-50">({posts.length})</span>}
                            {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-accent" />}
                        </button>
                    ))}
                </div>

                <div className="mt-8">
                    {activeTab === 'feed' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-4">
                                <h3 className="text-[10px] uppercase tracking-widest font-black text-text-muted">Personal Gallery</h3>
                                <label className="flex items-center gap-2 cursor-pointer bg-gold-accent/10 hover:bg-gold-accent/20 text-gold-accent px-4 py-2 border border-gold-accent/20 transition-all">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Photos</span>
                                    <input type="file" multiple className="hidden" onChange={handleGalleryUpload} accept="image/*" />
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                {posts.map((post) => (
                                    <div key={post.id} className="relative aspect-square group cursor-pointer overflow-hidden">
                                        <img src={post.src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onClick={() => setSearchParams({ post: post.id })} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 pointer-events-none">
                                            <div className="flex items-center text-white"><HeartIcon className="w-5 h-5 mr-1" filled={true} /><span>{post.liked_by_users?.length || 0}</span></div>
                                            <div className="flex items-center text-white"><ChatBubbleIcon className="w-5 h-5 mr-1" /><span>{post.comments?.length || 0}</span></div>
                                        </div>
                                        <button onClick={() => handleDeletePost(post.id)} className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'about' && (
                        <div className="p-10 bg-surface border border-border">
                            <h3 className="text-2xl font-serif mb-6">{t('profile.about_title')} {modelLike.name}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                <div><span className="text-text-muted">{t('profile.location')}:</span> {modelLike.location}</div>
                                <div><span className="text-text-muted">{t('profile.height')}:</span> {modelLike.height} cm</div>
                                <div><span className="text-text-muted space-x-2">{t('profile.measurements')}:</span> {modelLike.measurements}</div>
                                <div><span className="text-text-muted">{t('profile.hair_color')}:</span> {modelLike.hair_color}</div>
                                <div><span className="text-text-muted">{t('profile.eye_color')}:</span> {modelLike.eye_color}</div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'settings' && <SettingsPageController profile={profile} onUpdate={handleUpdateProfile} isLoading={isLoading} />}
                </div>
            </div>

            <AnimatePresence>
                {selectedPost && (
                    <ImageLightbox 
                        post={selectedPost} index={posts.indexOf(selectedPost)} total={posts.length} model={modelLike} 
                        onClose={() => setSearchParams({})} onLike={handleLikePost} onComment={handleAddComment}
                    />
                )}
            </AnimatePresence>

            {showStoryViewer && activeStories.length > 0 && (
                <StoryViewer stories={activeStories} title={modelLike.name} avatar={modelLike.avatar} onClose={() => setShowStoryViewer(false)} />
            )}
        </div>
    );
};

export default ProfilePage;
