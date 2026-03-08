
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
   stockStatus?: string;
   finish?: string;
   material?: string;
   description?: string;

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


export type ModerationStatus = 'active' | 'temporarily_suspended' | 'permanently_banned';

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
  phone?: string;
  // Legacy ban fields (kept for backward compat)
  is_banned?: boolean;
  banned_reason?: string;
  // New moderation system
  moderation_status?: ModerationStatus;
  banned_until?: string | null;
  public_reason?: string | null;
  internal_reason?: string | null;
  moderator_notes?: string | null;
  banned_by?: string | null;
  unbanned_by?: string | null;
  unban_reason?: string | null;
  deletion_requested_at?: string | null;
  deletion_request_status?: string | null;
  deletion_admin_notes?: string | null;
  // Existing fields
  deletion_scheduled_at?: string | null;
  deletion_reason?: string | null;
  has_password?: boolean;
}

export interface ModerationHistoryEntry {
  id: string;
  user_id: string;
  action_type: 'temp_ban' | 'perm_ban' | 'unban' | 'extend_ban' | 'edit_ban' | 'convert_to_perm' | 'delete_request' | 'restore' | 'note_added';
  admin_id: string | null;
  admin_email: string | null;
  public_reason: string | null;
  internal_reason: string | null;
  moderator_notes: string | null;
  banned_until: string | null;
  metadata: Record<string, any>;
  created_at: string;
}
