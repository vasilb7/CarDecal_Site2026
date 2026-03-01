
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

export interface Product {
   slug: string;
   name: string;
   avatar: string;
   categories: string[];
   location: string; // Origin / Brand
   dimensions: string;
   size: string;
   finish: string;
   material: string;
   description: string;
   stockStatus?: string;

   highlights: Highlight[];
   posts: Post[];
   coverImage: string;
   cardImages?: string[];
   isBestSeller?: boolean;
   isVerified?: boolean;
   nameBg?: string;
   price?: string | null;
   price_eur?: number;
   wholesalePrice?: string | null;
   wholesalePriceEur?: number;
   isHidden?: boolean;
 }


export interface UserProfile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
  website?: string;
  bio?: string;
  location?: string;
  role?: 'user' | 'editor' | 'admin';
  is_verified?: boolean;
  verified_until?: string;
  is_banned?: boolean;
  banned_reason?: string;
  phone?: string;
}
