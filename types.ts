
export interface Comment {
  id: string;
  user_id: string;
  username: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

export interface Post {
  id: string;
  src: string;
  type: 'image' | 'video';
  caption: string;
  tags: string[];
  pinned?: boolean;
  images?: string[];
  liked_by_users: string[]; // Store IDs of users who liked
  comments: Comment[];
  date: string;
}

export interface Highlight {
  id: string;
  name: string;
  coverImage: string;
  images?: string[];
}

export interface Story {
  id: string;
  src: string;
  type: 'image' | 'video';
  created_at: string;
  expires_at?: string; // Optional: stories can expire after 24h
  caption?: string;
}

export interface Model {
  id: string;
  slug: string;
  name: string;
  nickname?: string;
  avatar: string;
  categories: string[];
  location: string;
  height: string;
  measurements: string;
  hair_color: string;
  hairColor?: string;
  eye_color: string;
  eyeColor?: string;
  bio: string;
  availability: 'Available' | 'On Option' | 'Booked';
  status?: 'pending' | 'active' | 'rejected';
  highlights: Highlight[];
  posts: Post[];
  stories?: Story[];
  cover_image: string[];
  coverImage?: string[];
  card_images?: string[];
  cardImages?: string[];
  is_top_model?: boolean;
  isTopModel?: boolean;
  is_verified?: boolean;
  isVerified?: boolean;
  name_bg?: string;
  nameBg?: string;
  gender: 'Male' | 'Female';
  background_image?: string;
  spotlight_projects?: number;
  spotlight_awards?: number;
  spotlight_bio?: string;
  spotlight_bio_bg?: string;
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
  background_image?: string;
  stories?: any[];
  posts?: any[];
  categories?: string[];
  height?: string;
  measurements?: string;
  measurements_bust?: string;
  measurements_waist?: string;
  measurements_hips?: string;
  hair_color?: string;
  eye_color?: string;
  availability?: 'Available' | 'On Option' | 'Booked';
  active_plan?: string;
}

export interface Casting {
  id: string;
  project_name: string;
  client_name?: string;
  description: string;
  shoot_date?: string;
  location?: string;
  roles: string[];
  status: 'active' | 'closed' | 'draft';
  applicants_count?: number;
  created_at?: string;
}
