import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Story {
  id: string;
  type: "image" | "video";
  src: string;
  duration?: number;
}

export interface StoryViewerProps {
  stories: Story[];
  username: string;
  avatar: string;
  timestamp?: string;
  onStoryView?: (storyId: string) => void;
  onAllStoriesViewed?: () => void;
  className?: string;
}

const DEFAULT_IMAGE_DURATION = 5000;

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
  }),
  center: {
    x: 0,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
  }),
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.floor(diffHours / 24)}d ago`;
}

interface StoryThumbnailProps {
  stories: Story[];
  username: string;
  viewedIndices: Set<number>;
  onClick: () => void;
  className?: string;
}

function StoryThumbnail({
  stories,
  username,
  viewedIndices,
  onClick,
  className,
}: StoryThumbnailProps) {
  const segmentCount = stories.length;
  const gapDegrees = segmentCount > 1 ? 12 : 0;
  const segmentDegrees = (360 - gapDegrees * segmentCount) / segmentCount;
  const allViewed = viewedIndices.size === stories.length;

  const lastStory = stories[stories.length - 1];
  const thumbnailImage = React.useMemo(() => {
    for (let i = stories.length - 1; i >= 0; i--) {
      if (stories[i].type === "image") {
        return stories[i].src;
      }
    }
    return null;
  }, [stories]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 group cursor-pointer",
        "bg-transparent border-none outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
        className
      )}
      aria-label={`View ${username}'s stories`}
    >
      <div className="relative w-[72px] h-[72px]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
        >
          {stories.map((_, index) => {
            const startAngle = -90 + index * (segmentDegrees + gapDegrees);
            const endAngle = startAngle + segmentDegrees;
            const isViewed = viewedIndices.has(index);

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const radius = 46;
            const x1 = 50 + radius * Math.cos(startRad);
            const y1 = 50 + radius * Math.sin(startRad);
            const x2 = 50 + radius * Math.cos(endRad);
            const y2 = 50 + radius * Math.sin(endRad);
            const largeArc = segmentDegrees > 180 ? 1 : 0;

            return (
              <path
                key={index}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                strokeWidth="5"
                strokeLinecap="round"
                className={cn(
                  "transition-colors duration-300",
                  isViewed || allViewed
                    ? "stroke-muted-foreground/30"
                    : "stroke-primary"
                )}
              />
            );
          })}
        </svg>

        <div className="absolute inset-[5px] rounded-full bg-background p-[2px]">
          <div className="w-full h-full rounded-full overflow-hidden bg-muted">
            {lastStory.type === "video" ? (
              <video
                src={lastStory.src}
                poster={thumbnailImage || undefined}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={lastStory.src}
                alt={`${username}'s story`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>
        </div>
      </div>

      <span className="text-xs text-muted-foreground truncate max-w-[80px]">
        {username}
      </span>
    </button>
  );
}

interface ProgressBarProps {
  count: number;
  currentIndex: number;
  progress: number;
  viewedIndices: Set<number>;
}

function ProgressBar({ count, currentIndex, progress, viewedIndices }: ProgressBarProps) {
  return (
    <div className="flex gap-1 w-full px-2">
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === currentIndex;
        const isCompleted = viewedIndices.has(index) && index < currentIndex;
        const isPast = index < currentIndex;

        return (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: isPast || isCompleted ? "100%" : "0%" }}
              animate={{
                width: isActive ? `${progress}%` : isPast ? "100%" : "0%",
              }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        );
      })}
    </div>
  );
}

interface StoryContentProps {
  story: Story;
  isMuted: boolean;
  isInitialLoading: boolean;
  isBuffering: boolean;
  onVideoReady: (storyId: string, duration: number) => void;
  onVideoTimeUpdate: (storyId: string, currentTime: number, duration: number) => void;
  onVideoWaiting: (storyId: string) => void;
  onVideoPlaying: (storyId: string) => void;
  onVideoEnded: (storyId: string) => void;
  onImageLoad: (storyId: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

function StoryContent({
  story,
  isMuted,
  isInitialLoading,
  isBuffering,
  onVideoReady,
  onVideoTimeUpdate,
  onVideoWaiting,
  onVideoPlaying,
  onVideoEnded,
  onImageLoad,
  videoRef,
}: StoryContentProps) {
  const showSpinner = isInitialLoading || isBuffering;

  // Safety timeout: if content doesn't load in 3s, force it to be "ready"
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialLoading) {
        if (story.type === "video") onVideoReady(story.id, 15000); // Default to 15s if failed
        else onImageLoad(story.id);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [story.id, isInitialLoading, onVideoReady, onImageLoad, story.type]);

  return (
    <>
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin opacity-50" />
        </div>
      )}
      {story.type === "video" ? (
        <video
          ref={videoRef}
          src={story.src}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isInitialLoading ? "opacity-0" : "opacity-100"
          )}
          autoPlay
          playsInline
          muted={isMuted}
          onLoadedData={(e) => {
            const video = e.currentTarget;
            onVideoReady(story.id, (video.duration || 15) * 1000);
          }}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            onVideoTimeUpdate(story.id, video.currentTime, video.duration);
          }}
          onWaiting={() => onVideoWaiting(story.id)}
          onPlaying={() => onVideoPlaying(story.id)}
          onEnded={() => onVideoEnded(story.id)}
          onError={() => {
            onVideoReady(story.id, 5000); // Fallback on error
          }}
        />
      ) : (
        <img
          src={story.src}
          alt=""
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isInitialLoading ? "opacity-0" : "opacity-100"
          )}
          onLoad={() => onImageLoad(story.id)}
          onError={() => onImageLoad(story.id)} // Handle broken images
        />
      )}
    </>
  );
}

export interface StoryViewerModalProps {
  stories: Story[];
  username: string;
  avatar: string;
  timestamp?: string;
  initialIndex: number;
  viewedIndices: Set<number>;
  onClose: () => void;
  onStoryChange: (index: number) => void;
}

function StoryViewerModal({
  stories,
  username,
  avatar,
  timestamp,
  initialIndex,
  viewedIndices,
  onClose,
  onStoryChange,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [progress, setProgress] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [duration, setDuration] = React.useState(DEFAULT_IMAGE_DURATION);
  const [localViewedIndices, setLocalViewedIndices] = React.useState(() => viewedIndices);
  const [completedIndices, setCompletedIndices] = React.useState<Set<number>>(new Set());
  const [direction, setDirection] = React.useState(0);
  const [isVideoReady, setIsVideoReady] = React.useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = React.useRef<number>(0);
  const elapsedRef = React.useRef<number>(0);
  const hasPushedState = React.useRef(false);

  const handleManualClose = React.useCallback(() => {
    if (window.history.state?.storyOpen) {
      window.history.back();
    }
    onClose();
  }, [onClose]);

  const currentStory = stories[currentIndex];

  const goToNext = React.useCallback(() => {
    if (isAnimating) return;
    if (currentIndex < stories.length - 1) {
      setCompletedIndices(prev => new Set([...prev, currentIndex]));
      setIsAnimating(true);
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      handleManualClose();
    }
  }, [currentIndex, stories.length, handleManualClose, isAnimating]);

  const goToPrevious = React.useCallback(() => {
    if (isAnimating) return;
    if (currentIndex > 0) {
      setIsAnimating(true);
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      setProgress(0);
      elapsedRef.current = 0;
    }
  }, [currentIndex, isAnimating]);

  React.useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.classList.add("story-viewer-open");
    
    if (!hasPushedState.current) {
      window.history.pushState({ storyOpen: true }, "");
      hasPushedState.current = true;
    }

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.body.classList.remove("story-viewer-open");
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);

  React.useEffect(() => {
    setLocalViewedIndices((prev) => new Set([...prev, currentIndex]));
    onStoryChange(currentIndex);
  }, [currentIndex, onStoryChange]);

  React.useEffect(() => {
    if (currentStory.type === "image") {
      setDuration(currentStory.duration || DEFAULT_IMAGE_DURATION);
    }
  }, [currentStory]);

  React.useEffect(() => {
    if (currentStory.type === "video") {
      if (isPaused) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      } else if (isVideoReady && !isVideoBuffering) {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }
      return;
    }

    if (isPaused || !isVideoReady) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    startTimeRef.current = Date.now() - elapsedRef.current;

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      elapsedRef.current = elapsed;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress >= 100) {
        goToNext();
      }
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, duration, goToNext, currentStory.type, isVideoReady, isVideoBuffering]);

  React.useEffect(() => {
    // Instant reset when story changes
    setProgress(0);
    elapsedRef.current = 0;
    startTimeRef.current = Date.now();
    setIsVideoReady(false);
    setIsVideoBuffering(false);
    
    // Clear any pending intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [currentIndex]);

  const handleVideoReady = React.useCallback((storyId: string, videoDuration: number) => {
    if (storyId !== currentStory.id) return;
    setDuration(videoDuration);
    setIsVideoReady(true);
    setIsVideoBuffering(false);
  }, [currentStory.id]);

  const handleVideoTimeUpdate = React.useCallback((storyId: string, currentTime: number, videoDuration: number) => {
    if (storyId !== currentStory.id || isAnimating) return;
    if (videoDuration > 0) {
      const newProgress = (currentTime / videoDuration) * 100;
      setProgress(newProgress);
    }
  }, [currentStory.id, isAnimating]);

  const handleVideoWaiting = React.useCallback((storyId: string) => {
    if (storyId !== currentStory.id) return;
    setIsVideoBuffering(true);
  }, [currentStory.id]);

  const handleVideoPlaying = React.useCallback((storyId: string) => {
    if (storyId !== currentStory.id) return;
    setIsVideoBuffering(false);
  }, [currentStory.id]);

  const handleVideoEnded = React.useCallback((storyId: string) => {
    if (storyId !== currentStory.id) return;
    goToNext();
  }, [currentStory.id, goToNext]);

  const handleImageLoad = React.useCallback((storyId: string) => {
    if (storyId !== currentStory.id) return;
    setIsVideoReady(true);
  }, [currentStory.id]);

  const handlePointerDown = React.useCallback(() => {
    setIsPaused(true);
  }, []);

  const handlePointerUp = React.useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleTap = React.useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isAnimating) return;
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.changedTouches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const halfWidth = rect.width / 2;

      if (x < halfWidth) {
        goToPrevious();
      } else {
        goToNext();
      }
    },
    [goToNext, goToPrevious, isAnimating]
  );

  const handleDragEnd = React.useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (isAnimating) return;
      const { offset, velocity } = info;
      const swipeThreshold = 50;
      const velocityThreshold = 500;

      if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > velocityThreshold) {
        if (offset.x > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }

      if (offset.y > 100 || velocity.y > 500) {
        handleManualClose();
      }
    },
    [goToNext, goToPrevious, handleManualClose, isAnimating]
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          handleManualClose();
          break;
        case " ":
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrevious, handleManualClose]);



  const modalContent = (
    <motion.div
      className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Strict 9:16 Container */}
      <motion.div
        ref={containerRef}
        className="relative shadow-2xl overflow-hidden bg-black md:rounded-2xl flex items-center justify-center self-center"
        style={{
          width: '100%',
          maxWidth: 'min(calc(100vh * 9/16), 100%)',
          height: '100vh',
          maxHeight: '100vh',
        }}
        initial={{ scale: 0.5, y: 100, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.5, y: 100, opacity: 0 }}
        transition={{ 
          type: "spring",
          damping: 25,
          stiffness: 200,
          mass: 0.8
        }}
        onClick={(e) => e.stopPropagation()}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Full Media Content */}
        <div className="absolute inset-0 bg-black">
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStory.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "tween", ease: "easeInOut", duration: 0.35 },
              }}
              onAnimationComplete={() => setIsAnimating(false)}
              className="absolute inset-0 bg-black"
            >
              <StoryContent
                story={currentStory}
                isMuted={isMuted}
                isInitialLoading={!isVideoReady}
                isBuffering={isVideoBuffering}
                onVideoReady={handleVideoReady}
                onVideoTimeUpdate={handleVideoTimeUpdate}
                onVideoWaiting={handleVideoWaiting}
                onVideoPlaying={handleVideoPlaying}
                onVideoEnded={handleVideoEnded}
                onImageLoad={handleImageLoad}
                videoRef={videoRef}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimal Controls Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col pointer-events-none">
          {/* Progress Indicators (Timeline) - Instagram Style with scaleX */}
          <div className="flex gap-1.5 px-3 pt-3 pb-2 pointer-events-none">
            {stories.map((_, index) => {
              // Calculate progress scale (0 to 1)
              let progressScale = 0;
              
              if (index < currentIndex) {
                // Past stories are always full
                progressScale = 1;
              } else if (index === currentIndex) {
                // Current story shows actual progress
                progressScale = Math.min(1, Math.max(0, progress / 100));
              }
              // Future stories stay at 0
              
              return (
                <div
                  key={`story-progress-${index}`}
                  className="h-[3px] flex-1 bg-white/30 rounded-full overflow-hidden"
                  style={{
                    transform: 'translateZ(0)',
                  }}
                >
                  <div
                    className="h-full w-full bg-white rounded-full"
                    style={{
                      transformOrigin: 'left center',
                      transform: `scaleX(${progressScale})`,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Controls */}
          <div className="flex justify-between items-center p-4 pointer-events-auto">
            <div className="flex items-center gap-3">
              <img 
                src={avatar} 
                alt={username} 
                className="w-8 h-8 rounded-full border border-white/20"
              />
              <span className="text-white text-sm font-medium drop-shadow-md">
                {username}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {currentStory.type === "video" && (
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted((prev) => !prev);
                  }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-sm rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleManualClose();
                }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Tap Zones */}
          <div className="flex-1 flex pointer-events-auto select-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
            <div 
              className="w-1/2 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            />
            <div 
              className="w-1/2 h-full cursor-pointer" 
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
            />
          </div>
        </div>
      </motion.div>


    </motion.div>
  );

  return createPortal(modalContent, document.body);
}

const StoryViewer = React.forwardRef<HTMLDivElement, StoryViewerProps>(
  (
    {
      stories,
      username,
      avatar,
      timestamp,
      onStoryView,
      onAllStoriesViewed,
      className,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [viewedIndices, setViewedIndices] = React.useState<Set<number>>(() => new Set());
    const thumbnailRef = React.useRef<HTMLDivElement>(null);

    const firstUnviewedIndex = React.useMemo(() => {
      for (let i = 0; i < stories.length; i++) {
        if (!viewedIndices.has(i)) return i;
      }
      return 0;
    }, [stories.length, viewedIndices]);

    const handleOpen = React.useCallback(() => {
      setIsOpen(true);
    }, []);

    const handleClose = React.useCallback(() => {
      setIsOpen(false);
    }, []);

    const handleStoryChange = React.useCallback(
      (index: number) => {
        setViewedIndices((prev) => {
          const next = new Set(prev);
          next.add(index);

          if (next.size === stories.length && onAllStoriesViewed) {
            onAllStoriesViewed();
          }

          return next;
        });

        if (onStoryView) {
          onStoryView(stories[index].id);
        }
      },
      [stories, onStoryView, onAllStoriesViewed]
    );

    return (
      <>
        <div ref={ref} className={className}>
          <div ref={thumbnailRef}>
            <StoryThumbnail
              stories={stories}
              username={username}
              viewedIndices={viewedIndices}
              onClick={handleOpen}
            />
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <StoryViewerModal
              stories={stories}
              username={username}
              avatar={avatar}
              timestamp={timestamp}
              initialIndex={firstUnviewedIndex}
              viewedIndices={viewedIndices}
              onClose={handleClose}
              onStoryChange={handleStoryChange}
            />
          )}
        </AnimatePresence>
      </>
    );
  }
);

StoryViewer.displayName = "StoryViewer";

export { StoryViewer, StoryViewerModal };
