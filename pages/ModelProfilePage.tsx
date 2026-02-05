import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels } from '../hooks/useModels';
import { useToast } from '../hooks/useToast';
import { GridIcon, PinIcon, CloseIcon, HeartIcon, ChatBubbleIcon, BookmarkIcon, PaperAirplaneIcon, MoreHorizontalIcon, EmojiIcon, VerifiedIcon } from '../components/IconComponents';
import StoryViewer from '../components/StoryViewer';
import type { Post, Highlight, Model } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import { getPostStats } from '../data/mock_social_data';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ImageLightbox: React.FC<{ post: Post; index: number; total: number; model: Model; onClose: () => void }> = ({ post, index, total, model, onClose }) => {
    const { t, i18n } = useTranslation();
    const { showToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();
    const imgParam = searchParams.get('img');
    const currentImageIndex = imgParam ? parseInt(imgParam, 10) : 0;
    
    const [isLiked, setIsLiked] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const lastTap = useRef<number>(0);

    const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            handleLike();
        }
        lastTap.current = now;
    };

    const handleLike = () => {
        setIsLiked(true);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
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

                <div className="flex flex-col bg-surface w-full md:w-[335px] lg:w-[400px] shrink-0 h-auto md:h-full md:border-l md:border-border">
                    <div className="hidden md:flex items-center justify-between p-3.5 border-b border-border shrink-0">
                        <div className="flex items-center space-x-3">
                            <img src={model.avatar} alt={model.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-border" />
                            <div className="flex items-center">
                                <span className="font-semibold text-sm text-text-primary mr-1">{model.name}</span>
                                {model.isVerified && <VerifiedIcon className="w-4 h-4" />}
                                <span className="text-xs text-text-muted mx-2">•</span>
                                <button className="text-xs font-semibold text-gold-accent">{t('profile.follow')}</button>
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
                                    {model.isVerified && <VerifiedIcon className="w-3.5 h-3.5 inline-block mr-2 align-text-top" />}
                                    {post.caption}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-border bg-surface sticky bottom-0 z-20">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setIsLiked(!isLiked)} className={`${isLiked ? 'text-red-500' : 'text-text-primary'} transition-colors transform active:scale-125 duration-200`}>
                                    <HeartIcon className="w-6 h-6" filled={isLiked} />
                                </button>
                                <button className="text-text-primary"><ChatBubbleIcon className="w-6 h-6" /></button>
                                <button onClick={handleShare} className="text-text-primary"><PaperAirplaneIcon className="w-6 h-6" /></button>
                            </div>
                            <button onClick={handleSavePost} className="text-text-primary"><BookmarkIcon className="w-6 h-6" /></button>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{(post.likes + (isLiked ? 1 : 0)).toLocaleString()} {t('profile.likes')}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ModelProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { slug } = useParams<{ slug: string }>();
    const { getModelBySlug } = useModels();
    const model = getModelBySlug(slug || '');
    
    const [activeTab, setActiveTab] = useState('feed');
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent');
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedPost = searchParams.get('post') 
        ? model?.posts.find(p => p.id === searchParams.get('post')) 
        : null;

    const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

    if (!model) {
        return <div className="text-center py-20 text-text-muted">{t('profile.not_found')}</div>;
    }

    const renderFeed = () => {
        const allPosts = [...model.posts].sort((a, b) => {
            if (sortBy === 'popular') return b.likes - a.likes;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        return (
            <div className="space-y-6">
                <div className="flex justify-center space-x-6 py-4 border-b border-border/50">
                    <button onClick={() => setSortBy('recent')} className={`text-xs uppercase tracking-widest transition-colors ${sortBy === 'recent' ? 'text-gold-accent font-bold' : 'text-text-muted hover:text-text-primary'}`}>
                        {t('profile.sort_recent')}
                    </button>
                    <button onClick={() => setSortBy('popular')} className={`text-xs uppercase tracking-widest transition-colors ${sortBy === 'popular' ? 'text-gold-accent font-bold' : 'text-text-muted hover:text-text-primary'}`}>
                        {t('profile.sort_popular')}
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-1">
                    {allPosts.map((post) => (
                        <div key={post.id} className="relative aspect-square group cursor-pointer" onClick={() => setSearchParams({ post: post.id })}>
                            <img src={post.src} alt={post.caption} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-6">
                                <div className="flex items-center text-white"><HeartIcon className="w-6 h-6 mr-2" /><span className="font-bold">{post.likes}</span></div>
                                <div className="flex items-center text-white"><ChatBubbleIcon className="w-6 h-6 mr-2" /><span className="font-bold">{Math.floor(post.likes / 10)}</span></div>
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
                <div><span className="text-text-muted">{t('profile.hair_color')}:</span> {t(`attributes.hair.${model.hairColor}`, model.hairColor)}</div>
                <div><span className="text-text-muted">{t('profile.eye_color')}:</span> {t(`attributes.eyes.${model.eyeColor}`, model.eyeColor)}</div>
                <div><span className="text-text-muted">{t('profile.location')}:</span> {t(`attributes.locations.${model.location}`, model.location)}</div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-4xl py-8">
            <header className="px-4 md:px-0 py-8 flex flex-col md:flex-row items-center md:items-start">
                <img src={model.avatar} alt={model.name} className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-2 border-border" />
                <div className="md:ml-10 mt-6 md:mt-0 text-center md:text-left flex-grow">
                    <div className="flex items-center justify-center md:justify-start">
                        <h1 className="text-3xl md:text-4xl font-serif">{model.name}</h1>
                        {model.isVerified && <VerifiedIcon className="w-6 h-6 ml-2 mt-1" />}
                    </div>
                    <div className="mt-2 flex justify-center md:justify-start space-x-2">
                        {model.categories.map(cat => (
                            <span key={cat} className="text-sm bg-surface text-text-muted px-3 py-1 rounded-full">{t(`attributes.categories.${cat}`, cat)}</span>
                        ))}
                    </div>
                    <p className="mt-6 text-sm text-text-muted max-w-lg mx-auto md:mx-0">{model.bio}</p>
                </div>
            </header>
            
            <div className="flex border-b border-border">
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
                    />
                )}
            </AnimatePresence>

            {selectedHighlight && selectedHighlight.images && (
                <StoryViewer images={selectedHighlight.images} title={model.name} onClose={() => setSelectedHighlight(null)} onAllStoriesEnd={() => {}} />
            )}
        </div>
    );
};

export default ModelProfilePage;
