import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels } from '../hooks/useModels';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { modelsService } from '../lib/modelsService';
import { supabase } from '../lib/supabase';
import { SpotlightCropModal } from '../components/SpotlightCropModal';
import { Upload, Trash2, Plus, Loader2, Pencil } from 'lucide-react';
import { GridIcon, PinIcon, CloseIcon, HeartIcon, ChatBubbleIcon, BookmarkIcon, PaperAirplaneIcon, MoreHorizontalIcon, EmojiIcon, VerifiedIcon } from '../components/IconComponents';
import StoryViewer from '../components/StoryViewer';
import StoriesRing from '../components/StoriesRing';
import { AnimatePresence, motion } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { Post, Highlight, Model, Comment, Story } from '../types';

interface LightboxProps {
    post: Post;
    index: number;
    total: number;
    model: Model;
    onClose: () => void;
    onLike: (postId: string) => Promise<void>;
    onComment: (postId: string, content: string) => Promise<void>;
}

const ImageLightbox: React.FC<LightboxProps> = ({ post, index, total, model, onClose, onLike, onComment }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { user, profile } = useAuth();
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

    const handleSavePost = () => {
        showToast(t('toast.post_saved'), "success");
    };

    const setCurrentImageIndex = (newIndex: number | ((prev: number) => number)) => {
        const nextIdx = typeof newIndex === 'function' ? newIndex(currentImageIndex) : newIndex;
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('img', nextIdx.toString());
            return next;
        }, { replace: true });
    };

    const nextPost = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const currentIndex = model.posts.findIndex(p => p.id === post.id);
        const nextIdx = (currentIndex + 1) % model.posts.length;
        setSearchParams({ post: model.posts[nextIdx].id, img: '0' }, { replace: true });
    };

    const prevPost = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        const currentIndex = model.posts.findIndex(p => p.id === post.id);
        const prevIdx = (currentIndex - 1 + model.posts.length) % model.posts.length;
        setSearchParams({ post: model.posts[prevIdx].id, img: '0' }, { replace: true });
    };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        if (!searchParams.get('img')) {
             setSearchParams(prev => {
                const next = new URLSearchParams(prev);
                next.set('img', '0');
                return next;
             }, { replace: true });
        }
        return () => {
             document.body.style.overflow = 'unset';
        };
    }, [post.id]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            
            // Post-to-post navigation (Always active)
            if (e.key === 'ArrowRight' && e.shiftKey) {
                nextPost();
                return;
            } else if (e.key === 'ArrowLeft' && e.shiftKey) {
                prevPost();
                return;
            }

            // Image-to-image navigation (If images exist)
            if (!post.images || post.images.length <= 1) return;
            
            if (e.key === 'ArrowRight') {
                const nextIdx = (currentImageIndex + 1) % post.images!.length;
                setCurrentImageIndex(nextIdx);
            } else if (e.key === 'ArrowLeft') {
                const nextIdx = (currentImageIndex - 1 + post.images!.length) % post.images!.length;
                setCurrentImageIndex(nextIdx);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [post.images, currentImageIndex, post.id]);

    const hasMultipleImages = post.images && post.images.length > 1;
    const currentSrc = hasMultipleImages && post.images ? post.images[currentImageIndex] : post.src;

    const nextImage = (e: React.MouseEvent) => {
        e && e.stopPropagation && e.stopPropagation();
        if (hasMultipleImages && post.images) {
            setCurrentImageIndex((prev) => (prev + 1) % post.images!.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e && e.stopPropagation && e.stopPropagation();
        if (hasMultipleImages && post.images) {
            setCurrentImageIndex((prev) => (prev - 1 + post.images!.length) % post.images!.length);
        }
    };

    const transformRef = useRef<any>(null);
    const scaleRef = useRef(1);
    const swipeStart = useRef(0);
    const swipeStartY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
             swipeStart.current = e.touches[0].clientX;
             swipeStartY.current = e.touches[0].clientY;
        } else {
             swipeStart.current = -1;
             swipeStartY.current = -1;
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (swipeStart.current < 0) {
             if (scaleRef.current > 1.05) {
                transformRef.current?.resetTransform();
             }
             return;
        }

        const touch = e.changedTouches[0];
        const diffX = swipeStart.current - touch.clientX;
        const diffY = swipeStartY.current - touch.clientY;
        
        if (scaleRef.current < 1.1 && Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) {
                if (hasMultipleImages && currentImageIndex < post.images!.length - 1) {
                    nextImage(e as any);
                } else {
                    nextPost();
                }
            } else {
                if (hasMultipleImages && currentImageIndex > 0) {
                    prevImage(e as any);
                } else {
                    prevPost();
                }
            }
        } else if (scaleRef.current > 1.05) {
            transformRef.current?.resetTransform();
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center md:p-8 backdrop-blur-[2px]" 
            onClick={onClose}
        >
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors hidden md:block z-50 p-2"
            >
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
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-3 bg-surface/95 backdrop-blur border-b border-border w-full">
                    <button onClick={onClose} className="text-text-primary p-1">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div className="text-center">
                        <span className="text-xs font-semibold text-text-muted uppercase tracking-widest">{t('profile.post_mobile')}</span>
                    </div>
                    <div className="w-8" />
                </div>

                <div 
                    className="flex-grow md:flex-grow relative bg-black flex items-center justify-center overflow-hidden h-auto min-h-[50vh] md:h-full md:basis-auto group w-full"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                     <div 
                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-50 transition-all duration-500 scale-110 pointer-events-none"
                        style={{ backgroundImage: `url("${currentSrc}")` }}
                    />
                    <div className="absolute inset-0 bg-black/50 pointer-events-none" />

                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <TransformWrapper
                            key={currentSrc}
                            ref={transformRef}
                            initialScale={1}
                            minScale={1}
                            maxScale={4}
                            centerOnInit={true}
                            onTransformed={(e) => {
                                scaleRef.current = e.state.scale;
                                setIsZoomed(e.state.scale > 1);
                            }}
                        >
                            <TransformComponent 
                                wrapperStyle={{ width: "100%", height: "100%" }}
                                contentStyle={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                            >
                                <div 
                                    onClick={(e) => {
                                        if (isZoomed) {
                                            transformRef.current?.resetTransform();
                                        } else {
                                            handleDoubleTap(e);
                                        }
                                    }}
                                    className={`relative w-full h-full flex items-center justify-center ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                >
                                    <motion.img 
                                        key={currentSrc}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        src={currentSrc} 
                                        alt={post.caption} 
                                        className="max-w-full max-h-full w-auto h-auto object-contain select-none shadow-2xl" 
                                    />
                                    
                                    <AnimatePresence>
                                        {showHeart && (
                                            <motion.div
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                transition={{ duration: 0.8 }}
                                                className="absolute z-30 text-white pointer-events-none"
                                            >
                                                <HeartIcon className="w-24 h-24 fill-current text-white shadow-xl" filled={true} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </TransformComponent>
                        </TransformWrapper>
                    </div>

                    {/* Post Navigation Arrows */}
                    <button onClick={prevPost} className="absolute left-4 z-40 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-all hidden lg:flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button onClick={nextPost} className="absolute right-4 z-40 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition-all hidden lg:flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    {hasMultipleImages && (
                        <>
                            <button onClick={prevImage} className="absolute left-16 z-20 p-1.5 rounded-full bg-white/70 hover:bg-white text-black transition-all hidden md:group-hover:flex items-center justify-center shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <button onClick={nextImage} className="absolute right-16 z-20 p-1.5 rounded-full bg-white/70 hover:bg-white text-black transition-all hidden md:group-hover:flex items-center justify-center shadow-md">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                            <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center space-x-1.5 pointer-events-none">
                                {post.images!.map((_, idx) => (
                                    <div key={idx} className={`w-1.5 h-1.5 rounded-full shadow-sm transition-all ${idx === currentImageIndex ? 'bg-white scale-110' : 'bg-white/40'}`} />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col bg-surface w-full md:w-[335px] lg:w-[400px] shrink-0 h-auto md:h-full">
                    <div className="hidden md:flex items-center justify-between p-3.5 shrink-0">
                        <div className="flex items-center space-x-3">
                            <img src={model.avatar} alt={model.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                            <div className="flex items-center">
                                <span className="font-semibold text-sm text-text-primary mr-1">{model.name}</span>
                                {model.is_verified && <VerifiedIcon className="w-4 h-4" />}
                                <span className="text-xs text-text-muted mx-2">•</span>
                                <span className="text-[10px] uppercase font-bold text-gold-accent">Official</span>
                            </div>
                        </div>
                        <button className="text-text-primary hover:opacity-60">
                            <MoreHorizontalIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-4 md:flex-1 md:overflow-y-auto custom-scrollbar space-y-5 pb-24 md:pb-4">
                        <div className="flex items-start space-x-3">
                            <img src={model.avatar} alt={model.name} className="w-8 h-8 rounded-full object-cover shrink-0 hidden md:block" />
                            <div className="flex-1 text-sm">
                                <p className="text-text-primary leading-tight">
                                    <span className="font-semibold mr-1 hidden md:inline">{model.name}</span>
                                    {model.is_verified && <VerifiedIcon className="w-3.5 h-3.5 inline-block mr-2 align-text-top" />}
                                    {post.caption}
                                </p>
                                <span className="text-[10px] text-text-muted mt-1 uppercase tracking-wider">{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4 pt-4">
                            {post.comments?.map((comment) => (
                                <div key={comment.id} className="flex items-start space-x-3">
                                    <img src={comment.user_avatar || '/default-avatar.png'} alt={comment.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                    <div className="flex-1 text-sm">
                                        <p className="text-text-primary leading-tight">
                                            <span className="font-semibold mr-2">{comment.username}</span>
                                            {comment.content}
                                        </p>
                                        <div className="flex items-center space-x-3 mt-1 text-[10px] text-text-muted">
                                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-surface sticky bottom-0 z-20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                                <button onClick={handleLike} className={`${isLiked ? 'text-red-500' : 'text-text-primary'} transition-colors transform active:scale-125 duration-200`}>
                                    <HeartIcon className="w-6 h-6" filled={isLiked} />
                                </button>
                                <button className="text-text-primary" onClick={() => document.getElementById('comment-input')?.focus()}>
                                    <ChatBubbleIcon className="w-6 h-6" />
                                </button>
                                <button onClick={handleShare} className="text-text-primary"><PaperAirplaneIcon className="w-6 h-6" /></button>
                            </div>
                            <button onClick={handleSavePost} className="text-text-primary"><BookmarkIcon className="w-6 h-6" /></button>
                        </div>
                        <p className="text-sm font-semibold text-text-primary mb-2">{(post.liked_by_users?.length || 0).toLocaleString()} {t('profile.likes')}</p>
                        
                        <form onSubmit={handleCommentSubmit} className="flex items-center space-x-2 border-t border-border/50 pt-3 mt-3">
                            <EmojiIcon className="w-5 h-5 text-text-muted invisible md:visible" />
                            <input 
                                id="comment-input"
                                type="text" 
                                placeholder={t('profile.add_comment')}
                                className="flex-1 bg-transparent text-sm text-text-primary outline-none"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={!commentText.trim() || isSubmittingComment}
                                className={`text-sm font-semibold text-gold-accent disabled:opacity-30`}
                            >
                                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : t('profile.post_comment')}
                            </button>
                        </form>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ModelProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { isAdmin, user, profile } = useAuth();
    const { slug } = useParams<{ slug: string }>();
    const { getModelBySlug, loading, error } = useModels();
    const [model, setModel] = useState<Model | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [bgToCrop, setBgToCrop] = useState<string | null>(null);
    const [avatarToCrop, setAvatarToCrop] = useState<string | null>(null);

    const handleLikePost = async (postId: string) => {
        if (!user || !model) {
            showToast(t('auth.login_required'), "error");
            return;
        }
        
        const updatedPosts = model.posts.map(p => {
            if (p.id === postId) {
                const liked_by_users = p.liked_by_users || [];
                const isLiked = liked_by_users.includes(user.id);
                
                return {
                    ...p,
                    liked_by_users: isLiked 
                        ? liked_by_users.filter(id => id !== user.id)
                        : [...liked_by_users, user.id]
                };
            }
            return p;
        });

        try {
            await modelsService.updateModel(model.id, { posts: updatedPosts });
            setModel({ ...model, posts: updatedPosts });
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleAddComment = async (postId: string, content: string) => {
        if (!user || !profile || !model) {
            showToast(t('auth.login_required'), "error");
            return;
        }
        
        const newComment: Comment = {
            id: `comment_${Date.now()}`,
            user_id: user.id,
            username: profile.username || profile.full_name || 'Anonymous',
            user_avatar: profile.avatar_url,
            content,
            created_at: new Date().toISOString()
        };

        const updatedPosts = model.posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: [...(p.comments || []), newComment]
                };
            }
            return p;
        });

        try {
            await modelsService.updateModel(model.id, { posts: updatedPosts });
            setModel({ ...model, posts: updatedPosts });
            showToast(t('toast.comment_posted'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };
    
    useEffect(() => {
        const fetch = async () => {
            if (slug) {
                const data = await getModelBySlug(slug);
                setModel(data);
            }
        };
        fetch();
    }, [slug, getModelBySlug]);

    // Real-time subscription
    useEffect(() => {
        if (!model?.id) return;

        const channel = supabase
            .channel(`model_${model.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'models',
                    filter: `id=eq.${model.id}`
                },
                (payload) => {
                    console.log('Real-time update received:', payload.new);
                    const m = payload.new as any;
                    
                    setModel(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            ...m,
                            // Map database fields to frontend fields for instant UI update
                            hairColor: m.hair_color ?? prev.hairColor,
                            eyeColor: m.eye_color ?? prev.eye_color,
                            coverImage: m.cover_image ?? prev.coverImage,
                            cardImages: m.card_images ?? prev.cardImages,
                            isTopModel: m.is_top_model !== undefined ? m.is_top_model : prev.isTopModel,
                            isVerified: m.is_verified !== undefined ? m.is_verified : prev.isVerified,
                            nameBg: m.name_bg ?? prev.name_bg
                        } as Model;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [model?.id]);
    
    const [activeTab, setActiveTab] = useState('feed');
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedPost = searchParams.get('post') && model
        ? model.posts.find(p => p.id === searchParams.get('post')) 
        : null;

    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
    const [showStoryViewer, setShowStoryViewer] = useState(false);
    const [activeStories, setActiveStories] = useState<Story[]>([]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-2 border-gold-accent border-t-transparent animate-spin rounded-full" />
                <p className="text-[10px] uppercase tracking-[0.4em] text-gold-accent animate-pulse font-bold">Accessing Profile Data...</p>
            </div>
        );
    }

    if (!model || error) {
        return <div className="text-center py-20 text-text-muted">{t('profile.not_found')}</div>;
    }

    const handleDeletePost = async (postId: string) => {
        if (!model || !window.confirm(t('admin.confirm_delete_post'))) return;

        try {
            const postToDelete = model.posts.find(p => p.id === postId);
            const updatedPosts = model.posts.filter(p => p.id !== postId);
            await modelsService.updateModel(model.id, { posts: updatedPosts });
            
            if (postToDelete && postToDelete.src.includes('supabase.co')) {
                await modelsService.deleteFile(postToDelete.src);
            }

            setModel({ ...model, posts: updatedPosts });
            showToast(t('toast.post_deleted'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleUpdateModel = async (updates: Partial<Model>) => {
        if (!model) return;
        try {
            await modelsService.updateModel(model.id, updates);
            setModel({ ...model, ...updates });
        } catch (error: any) {
            showToast(error.message, "error");
        }
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !model) return;
        const url = URL.createObjectURL(file);
        setBgToCrop(url);
        e.target.value = '';
    };

    const handleCroppedBackground = async (croppedUrl: string) => {
        if (!model) return;
        try {
            setIsUploading(true);
            const res = await fetch(croppedUrl);
            const blob = await res.blob();
            const file = new File([blob], `bg_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const path = `models/${model.slug}/background/${Date.now()}_${file.name}`;
            const publicUrl = await modelsService.uploadFile(file, path);
            await handleUpdateModel({ background_image: publicUrl });
            showToast(t('toast.gallery_updated'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setBgToCrop(null);
            setIsUploading(false);
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !model) return;
        const url = URL.createObjectURL(file);
        setAvatarToCrop(url);
        e.target.value = '';
    };

    const handleCroppedAvatar = async (croppedUrl: string) => {
        if (!model) return;
        try {
            setIsUploading(true);
            const res = await fetch(croppedUrl);
            const blob = await res.blob();
            const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const path = `models/${model.slug}/avatar/${Date.now()}_${file.name}`;
            const publicUrl = await modelsService.uploadFile(file, path);
            await handleUpdateModel({ avatar: publicUrl });
            showToast(t('toast.gallery_updated'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setAvatarToCrop(null);
            setIsUploading(false);
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !model) return;

        try {
            setIsUploading(true);
            const uploadedPosts: Post[] = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const path = `models/${model.slug}/gallery/${Date.now()}_${file.name}`;
                const url = await modelsService.uploadFile(file, path);
                
                uploadedPosts.push({
                    id: `post_${Date.now()}_${i}`,
                    src: url,
                    type: 'image',
                    caption: '',
                    liked_by_users: [],
                    comments: [],
                    date: new Date().toISOString(),
                    tags: []
                });
            }

            const updatedPosts = [...model.posts, ...uploadedPosts];
            await modelsService.updateModel(model.id, { posts: updatedPosts });
            setModel({ ...model, posts: updatedPosts });
            showToast(t('toast.gallery_updated'), "success");
        } catch (error: any) {
            showToast(error.message, "error");
        } finally {
            setIsUploading(false);
        }
    };

    const renderFeed = () => {
        const allPosts = [...model.posts].sort((a, b) => {
            if (sortBy === 'popular') return (b.liked_by_users?.length || 0) - (a.liked_by_users?.length || 0);
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center py-4 gap-4">
                    <div className="flex space-x-6">
                        <button onClick={() => setSortBy('recent')} className={`text-xs uppercase tracking-widest transition-colors ${sortBy === 'recent' ? 'text-gold-accent font-bold' : 'text-text-muted hover:text-text-primary'}`}>
                            {t('profile.sort_recent')}
                        </button>
                        <button onClick={() => setSortBy('popular')} className={`text-xs uppercase tracking-widest transition-colors ${sortBy === 'popular' ? 'text-gold-accent font-bold' : 'text-text-muted hover:text-text-primary'}`}>
                            {t('profile.sort_popular')}
                        </button>
                    </div>

                    {isAdmin && (
                        <div className="flex gap-2">
                             <label className={`flex items-center gap-2 cursor-pointer bg-gold-accent/10 hover:bg-gold-accent/20 text-gold-accent px-4 py-2 border border-gold-accent/20 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                <span className="text-[10px] font-bold uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Add Photos'}</span>
                                <input 
                                    type="file" 
                                    multiple 
                                    className="hidden" 
                                    onChange={handleBulkUpload}
                                    disabled={isUploading}
                                    accept="image/*"
                                />
                            </label>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-1">
                    {allPosts.map((post) => (
                        <div key={post.id} className="relative aspect-square group cursor-pointer">
                            <img src={post.src} alt={post.caption} className="w-full h-full object-cover" onClick={() => setSearchParams({ post: post.id })} />
                            
                            {isAdmin && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }}
                                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}

                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-6 pointer-events-none" onClick={() => setSearchParams({ post: post.id })}>
                                <div className="flex items-center text-white"><HeartIcon className="w-6 h-6 mr-2" /><span className="font-bold">{post.liked_by_users?.length || 0}</span></div>
                                <div className="flex items-center text-white"><ChatBubbleIcon className="w-6 h-6 mr-2" /><span className="font-bold">{post.comments?.length || 0}</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderAbout = () => (
        <div className="p-6 md:p-10 text-text-primary bg-surface">
            <h3 className="text-2xl font-serif mb-4">{t('profile.about_title')} {model.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div><span className="text-text-muted">{t('profile.height')}:</span> {model.height}</div>
                <div><span className="text-text-muted">{t('profile.measurements')}:</span> {model.measurements}</div>
                <div><span className="text-text-muted">{t('profile.hair_color')}:</span> {t(`attributes.hair.${model.hair_color}`, model.hair_color)}</div>
                <div><span className="text-text-muted">{t('profile.eye_color')}:</span> {t(`attributes.eyes.${model.eye_color}`, model.eye_color)}</div>
                <div><span className="text-text-muted">{t('profile.location')}:</span> {t(`attributes.locations.${model.location}`, model.location)}</div>
                <div><span className="text-text-muted">{t('profile.availability')}:</span> {t(`models.availability.${model.availability}_${model.gender || 'Female'}`)}</div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background relative">
            {/* Background Image Hero — Twitter/X-style */}
            <div className={`relative w-full overflow-hidden group/bg ${!model.background_image ? 'bg-zinc-900/50 h-[200px] md:h-[300px]' : ''}`}
                 style={model.background_image ? { aspectRatio: '3/1', maxHeight: '420px' } : undefined}
            >
                {model.background_image ? (
                    <>
                        {/* Layer 1: Blurred backdrop fill for any edge gaps */}
                        <div 
                            className="absolute inset-0 scale-110"
                            style={{
                                backgroundImage: `url("${model.background_image}")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'blur(30px) brightness(0.35) saturate(1.3)',
                            }}
                        />
                        {/* Layer 2: Main cover image — fits 16:9 nicely in 3:1 */}
                        <img 
                            src={model.background_image} 
                            className="absolute inset-0 w-full h-full object-cover z-[1] transition-all duration-700 group-hover/bg:scale-[1.015]" 
                            alt="Background" 
                        />
                        {/* Subtle vignette */}
                        <div className="absolute inset-0 z-[2] pointer-events-none" style={{
                            background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.45) 100%)'
                        }} />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-3xl" />
                )}
                {/* Bottom gradient fade to page bg */}
                <div className="absolute inset-x-0 bottom-0 h-[50%] z-[3] pointer-events-none" style={{
                    background: 'linear-gradient(to top, var(--background) 0%, rgba(11,11,12,0.5) 45%, transparent 100%)'
                }} />
                
                {isAdmin && (
                    <label className="absolute bottom-4 right-4 z-20 cursor-pointer p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all opacity-0 group-hover/bg:opacity-100 border border-white/10">
                        <Plus className="w-5 h-5" />
                        <input type="file" className="hidden" onChange={handleBackgroundUpload} accept="image/*" />
                    </label>
                )}
            </div>

            <div className={`container mx-auto max-w-4xl px-4 md:px-0 relative z-10 pb-20 ${
                model.background_image 
                    ? 'pt-0' 
                    : 'pt-24 md:pt-32'
            }`}>
            <header className="px-4 md:px-0 pb-8 flex flex-col items-center md:items-start group/header relative">
                <div className="relative -mt-20 md:-mt-24 mb-6">
                    <StoriesRing 
                        model={model}
                        isAdmin={isAdmin}
                        onStoriesUpdate={(stories) => setModel({ ...model, stories })}
                        onTriggerUpdate={handleUpdateModel}
                        onViewStory={(stories) => {
                            setActiveStories(stories);
                            setShowStoryViewer(true);
                        }}
                    />
                    {isAdmin && (
                        <label className="absolute inset-0 z-30 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full border-4 border-transparent group-hover:border-gold-accent/20">
                            <div className="bg-gold-accent w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transform scale-75 hover:scale-100 transition-transform">
                                <Pencil className="w-5 h-5 text-black" />
                            </div>
                            <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
                        </label>
                    )}
                </div>
                <div className="text-center md:text-left flex-grow">
                    <div className="flex items-center justify-center md:justify-start">
                        <h1 className="text-3xl md:text-5xl font-serif">{model.name}</h1>
                        {model.is_verified && <VerifiedIcon className="w-6 h-6 ml-2 mt-1" />}
                    </div>
                    {model.nickname && (
                        <p className="text-gold-accent text-base md:text-lg font-medium mt-1 lowercase">@{model.nickname}</p>
                    )}
                    <div className="mt-4 flex justify-center md:justify-start space-x-2">
                        {model.categories.map(cat => (
                            <span key={cat} className="text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 text-text-muted px-4 py-1.5 rounded-none">{t(`attributes.categories.${cat}`, cat)}</span>
                        ))}
                    </div>
                    <p className="mt-6 text-sm md:text-base text-text-muted max-w-xl mx-auto md:mx-0 font-light leading-relaxed">{model.bio}</p>
                </div>
            </header>
            
            <div className="flex">
                <button className={`flex-1 py-4 text-sm font-medium tracking-widest uppercase transition-colors relative ${activeTab === 'feed' ? 'text-gold-accent' : 'text-text-muted hover:text-text-primary'}`} onClick={() => setActiveTab('feed')}>
                    {t('profile.feed')} <span className="ml-1 opacity-50 text-[10px]">({model.posts.length})</span>
                    {activeTab === 'feed' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-accent" />}
                </button>
                <button className={`flex-1 py-4 text-sm font-medium tracking-widest uppercase transition-colors relative ${activeTab === 'about' ? 'text-gold-accent' : 'text-text-muted hover:text-text-primary'}`} onClick={() => setActiveTab('about')}>
                    {t('profile.about_title')}
                    {activeTab === 'about' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-accent" />}
                </button>
            </div>

            <div className="mt-4">
                {activeTab === 'feed' && renderFeed()}
                {activeTab === 'about' && renderAbout()}
            </div>
            
            <AnimatePresence>
                {selectedPost && (
                    <ImageLightbox 
                        key={selectedPost.id}
                        post={selectedPost} 
                        index={model.posts.findIndex(p => p.id === selectedPost.id)}
                        total={model.posts.length}
                        model={model}
                        onClose={() => setSearchParams({}, { replace: true })} 
                        onLike={handleLikePost}
                        onComment={handleAddComment}
                    />
                )}
            </AnimatePresence>

            {selectedHighlight && selectedHighlight.images && (
                <StoryViewer 
                    images={selectedHighlight.images} 
                    title={model.name} 
                    avatar={model.avatar}
                    onClose={() => setSelectedHighlight(null)} 
                    onAllStoriesEnd={() => {}} 
                />
            )}

            {/* Story Viewer for Model Stories */}
            {showStoryViewer && activeStories.length > 0 && (
                <StoryViewer 
                    stories={activeStories} 
                    title={model.name}
                    avatar={model.avatar}
                    onClose={() => {
                        setShowStoryViewer(false);
                        setActiveStories([]);
                    }} 
                    onAllStoriesEnd={() => {
                        setShowStoryViewer(false);
                        setActiveStories([]);
                    }} 
                />
            )}
            </div>

            {/* Background Crop Modal */}
            {bgToCrop && (
                <SpotlightCropModal 
                    isOpen={!!bgToCrop}
                    imageUrl={bgToCrop}
                    onClose={() => setBgToCrop(null)}
                    aspectRatio={32/9}
                    onCropComplete={handleCroppedBackground}
                />
            )}

            {/* Avatar Crop Modal */}
            {avatarToCrop && (
                <SpotlightCropModal 
                    isOpen={!!avatarToCrop}
                    imageUrl={avatarToCrop}
                    onClose={() => setAvatarToCrop(null)}
                    aspectRatio={1/1}
                    onCropComplete={handleCroppedAvatar}
                />
            )}
        </div>
    );
};

export default ModelProfilePage;
