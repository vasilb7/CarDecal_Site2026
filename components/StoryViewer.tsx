/**
 * Legacy StoryViewer adapter
 * Uses the new shadcn StoryViewerModal for display while maintaining backward compatibility
 */

import React, { useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { StoryViewerModal, type Story as ShadcnStory } from './ui/story-viewer';
import type { Story } from '../types';

interface StoryViewerProps {
  // Support both old format (string[]) and new format (Story[])
  images?: string[];
  stories?: Story[];
  onClose: () => void;
  onAllStoriesEnd?: () => void;
  title: string;
  avatar?: string;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ 
  images, 
  stories, 
  onClose, 
  onAllStoriesEnd, 
  title,
  avatar 
}) => {
  // Convert stories to shadcn format
  const normalizedStories: ShadcnStory[] = useMemo(() => {
    if (stories && stories.length > 0) {
      return stories.map((s, idx) => ({
        id: s.id || `story_${idx}`,
        type: s.type || 'image',
        src: s.src,
        duration: s.duration
      }));
    }
    
    // Convert old images array format
    if (images && images.length > 0) {
      return images.map((src, idx) => ({
        id: `image_${idx}`,
        type: 'image' as const,
        src
      }));
    }
    
    return [];
  }, [stories, images]);

  // Get timestamp from first story if available
  const timestamp = useMemo(() => {
    if (stories && stories.length > 0 && stories[0].created_at) {
      return stories[0].created_at;
    }
    return undefined;
  }, [stories]);

  if (normalizedStories.length === 0) {
    return null;
  }

  const viewedStories = JSON.parse(localStorage.getItem('viewed_stories') || '[]');
  const firstUnviewedIndex = stories ? stories.findIndex(s => !viewedStories.includes(s.id)) : 0;
  const initialIndex = firstUnviewedIndex === -1 ? 0 : firstUnviewedIndex;

  const handleStoryChange = (index: number) => {
    if (stories && stories[index]) {
      const storyId = stories[index].id;
      const viewed = JSON.parse(localStorage.getItem('viewed_stories') || '[]');
      if (!viewed.includes(storyId)) {
        const newViewed = [...viewed, storyId];
        localStorage.setItem('viewed_stories', JSON.stringify(newViewed));
        // Dispatch custom event to notify StoriesRing in the same window
        window.dispatchEvent(new Event('storyViewed'));
      }
    }
  };

  return (
    <AnimatePresence>
      <StoryViewerModal
        stories={normalizedStories}
        username={title}
        avatar={avatar || '/placeholder-avatar.png'}
        timestamp={timestamp}
        initialIndex={initialIndex}
        viewedIndices={new Set()}
        onClose={onClose}
        onStoryChange={handleStoryChange}
      />
    </AnimatePresence>
  );
};

export default StoryViewer;
