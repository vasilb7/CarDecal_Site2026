
export interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
  avatarColor: string;
}

export interface PostStats {
  likes: number;
  comments: Comment[];
}

const COMMENTS_POOL = [
  "Stunning! 😍", "Absolutely gorgeous", "Love this look! 💖", "Queen! 👑",
  "So elegant ✨", "Perfect lighting 📸", "The best yet", "Iconic.",
  "Obsessed with this", "Beauty", "Wow...", "Incredible work",
  "This aesthetic is everything", "Dreamy", "Perfection 🤍", 
  "So chic!", "This energy >>", "Next level", "Editorial gold"
];

const USERS_POOL = [
  "sarah_m", "fashion_lover", "style_daily", "photo_pro", "lux_life",
  "art_vibe", "mod_el", "trend_setter", "vogue_fan", "design_guru",
  "creative_mind", "visual_diary", "captured_moments", "fashion_week"
];

// Simple hash function for deterministic pseudo-randomness
const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getPostStats = (postId: string): PostStats => {
  const seed = hashString(postId);
  
  // Deterministic random numbers based on seed
  const likes = (seed % 1500) + 120; // 120 to 1620 likes
  
  const commentsCount = (seed % 12) + 3; // 3 to 15 comments
  const comments: Comment[] = [];
  
  // Generate comments
  for(let i = 0; i < commentsCount; i++) {
    const commentSeed = seed + (i * 123); // Spread out the randomness
    const userIndex = commentSeed % USERS_POOL.length;
    const textIndex = (commentSeed * 7) % COMMENTS_POOL.length; // Different stride
    const timeVal = (commentSeed % 20) + 1;
    let timeStr = `${timeVal}h ago`;
    if (timeVal > 23) timeStr = `${Math.floor(timeVal/24) + 1}d ago`;
    
    comments.push({
      id: `${postId}-c-${i}`,
      user: USERS_POOL[userIndex],
      text: COMMENTS_POOL[textIndex],
      time: timeStr,
      avatarColor: ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-red-500', 'bg-indigo-500'][commentSeed % 7]
    });
  }

  return { likes, comments };
};
