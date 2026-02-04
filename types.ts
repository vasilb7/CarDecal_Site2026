
export interface Post {
  id: string;
  src: string;
  type: 'image' | 'video';
  caption: string;
  tags: string[];
  pinned?: boolean;
  images?: string[];
  likes: number;
  date: string;
}

export interface Highlight {
  id: string;
  name: string;
  coverImage: string;
  images?: string[];
}

export interface Model {
  slug: string;
  name: string;
  avatar: string;
  categories: string[];
  location: string;
  height: string;
  measurements: string;
  hairColor: string;
  eyeColor: string;
  bio: string;
  availability: 'Available' | 'On Option' | 'Booked';
  highlights: Highlight[];
  posts: Post[];
  coverImage: string;
  cardImages?: string[];
  isTopModel?: boolean;
  isVerified?: boolean;
  nameBg?: string;
}

export interface UserProfile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  bio?: string;
  location?: string;
  role?: string;
  is_verified?: boolean;
  verified_until?: string;
}
