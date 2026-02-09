import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Image, Video } from 'lucide-react';
import { modelsService } from '../lib/modelsService';
import { useToast } from '../hooks/useToast';
import { useTranslation } from 'react-i18next';
import type { Story, Model } from '../types';

interface StoriesRingProps {
  model: Model;
  isAdmin: boolean;
  onStoriesUpdate: (stories: Story[]) => void;
  onViewStory: (stories: Story[]) => void;
  onTriggerUpdate?: (updates: { stories: Story[] }) => Promise<void>;
}

export const StoriesRing: React.FC<StoriesRingProps> = ({ 
  model, 
  isAdmin, 
  onStoriesUpdate,
  onViewStory,
  onTriggerUpdate
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showToast } = useToast();
  const { t } = useTranslation();

  const activeStories = (model.stories || []).filter(story => {
    if (!story.expires_at) return true;
    return new Date(story.expires_at) > new Date();
  });

  const [viewedStoryIds, setViewedStoryIds] = useState<string[]>([]);

  useEffect(() => {
    const handleStorageChange = () => {
      const viewed = JSON.parse(localStorage.getItem('viewed_stories') || '[]');
      setViewedStoryIds(viewed);
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    // Also listen for a custom event since localStorage event only fires between windows
    window.addEventListener('storyViewed', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storyViewed', handleStorageChange);
    };
  }, []);

  const hasActiveStories = activeStories.length > 0;
  const allViewed = hasActiveStories && activeStories.every(story => viewedStoryIds.includes(story.id));

  const handleAddStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      const newStories: Story[] = [];
      const totalFiles = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          console.warn('Unsupported file type:', file.type);
          continue;
        }

        // Check video size (max 50MB)
        if (isVideo && file.size > 50 * 1024 * 1024) {
          showToast('Video is too large (max 50MB)', 'error');
          continue;
        }

        // Check video duration (max 30 seconds)
        if (isVideo) {
          const duration = await getVideoDuration(file);
          if (duration > 30) {
            showToast(`Video is too long (${Math.round(duration)}s). Maximum 30 seconds allowed.`, 'error');
            continue;
          }
        }

        const fileType = isVideo ? 'video' : 'image';
        // Sanitize filename - remove special characters
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${model.slug}/stories/${Date.now()}_${sanitizedName}`;
        
        console.log('Uploading file:', { name: file.name, type: file.type, size: file.size, path });
        
        const url = await modelsService.uploadFile(file, path);
        console.log('Upload successful:', url);

        newStories.push({
          id: `story_${Date.now()}_${i}`,
          src: url,
          type: fileType,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h expiry
        });

        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      if (newStories.length > 0) {
        const updatedStories = [...(model.stories || []), ...newStories];
        if (onTriggerUpdate) {
          await onTriggerUpdate({ stories: updatedStories });
        } else {
          await modelsService.updateModel(model.id, { stories: updatedStories });
        }
        onStoriesUpdate(updatedStories);
        showToast(t('toast.story_uploaded'), 'success');
      }
      setShowAddModal(false);
    } catch (error: any) {
      console.error('Error uploading story:', error);
      showToast(t('toast.story_upload_error', { message: error.message || 'Unknown error' }), 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to get video duration
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        resolve(0); // If error, allow upload
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Delete this story?')) return;
    
    try {
      const storyToDelete = model.stories?.find(s => s.id === storyId);
      const updatedStories = (model.stories || []).filter(s => s.id !== storyId);
      if (onTriggerUpdate) {
        await onTriggerUpdate({ stories: updatedStories });
      } else {
        await modelsService.updateModel(model.id, { stories: updatedStories });
      }
      
      // Clean up storage
      if (storyToDelete && storyToDelete.src.includes('supabase.co')) {
        await modelsService.deleteFile(storyToDelete.src);
      }
      
      onStoriesUpdate(updatedStories);
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  // Check if story is video
  const isVideoStory = (story: Story) => {
    return story.type === 'video' || story.src.match(/\.(mp4|webm|mov|avi)$/i);
  };

  return (
    <div className="relative">
      {/* Avatar with Story Ring */}
      <div 
        className={`relative cursor-pointer`}
        onClick={() => hasActiveStories && onViewStory(activeStories)}
      >
        {/* Ring when there are stories */}
        {hasActiveStories && (
          <div className={`absolute -inset-1 rounded-full p-[3px] ${
            allViewed 
              ? 'bg-white/20' // Subtle grey/white ring for viewed stories
              : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 animate-pulse'
          }`}>
            <div className="w-full h-full rounded-full bg-background" />
          </div>
        )}
        
        {/* Avatar */}
        <img 
          src={model.avatar} 
          alt={model.name} 
          className={`relative z-10 w-32 h-32 md:w-44 md:h-44 rounded-full object-cover border-4 ${
            hasActiveStories ? 'border-background' : 'border-background'
          } shadow-2xl`} 
        />

        {/* Add Story Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddModal(true);
            }}
            className="absolute bottom-1 right-1 z-20 w-8 h-8 bg-gold-accent rounded-full flex items-center justify-center border-2 border-background shadow-lg hover:scale-110 transition-transform"
          >
            <Plus className="w-5 h-5 text-black" />
          </button>
        )}
      </div>

      {/* Add Story Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !uploading && setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-serif text-white">Add Story</h3>
                <button 
                  onClick={() => !uploading && setShowAddModal(false)}
                  className="text-text-muted hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Stories Preview */}
              {model.stories && model.stories.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-widest text-text-muted mb-3">Current Stories</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {model.stories.map((story) => (
                      <div key={story.id} className="relative shrink-0 group">
                        {isVideoStory(story) ? (
                          <div className="w-16 h-16 rounded-lg bg-black flex items-center justify-center relative overflow-hidden">
                            <video 
                              src={story.src} 
                              className="w-full h-full object-cover"
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={story.src} 
                            alt="Story" 
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Section */}
              <label 
                className={`block border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-gold-accent/50 transition-colors ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-gold-accent animate-spin" />
                    <p className="text-sm text-text-muted">Uploading... {uploadProgress}%</p>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gold-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="flex flex-col items-center">
                        <Image className="w-8 h-8 text-text-muted" />
                        <span className="text-[10px] text-text-muted mt-1">Photos</span>
                      </div>
                      <div className="w-px h-10 bg-white/10" />
                      <div className="flex flex-col items-center">
                        <Video className="w-8 h-8 text-text-muted" />
                        <span className="text-[10px] text-text-muted mt-1">Videos</span>
                      </div>
                    </div>
                    <p className="text-white font-medium mb-1">Add Photos or Videos</p>
                    <p className="text-xs text-text-muted">Stories expire after 24 hours</p>
                    <p className="text-[10px] text-text-muted/60 mt-2">📷 Photos: 5s • 🎬 Videos: max 30s, 50MB</p>
                  </>
                )}
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,video/*" 
                  className="hidden" 
                  onChange={handleAddStory}
                  disabled={uploading}
                />
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoriesRing;
