
export interface Product {
  id?: string;
  slug: string;
  name: string;
  avatar: string;
  categories: string[];
  location: string;
  size: string;
  wholesale_price_eur?: number;
  // aliases used in existing code
  wholesalePriceEur?: number;
  isBestSeller?: boolean;
  isHidden?: boolean;
  top_order?: number | null;
  display_rank?: number | null;
  // legacy - kept so old references don't break with undefined
  nameBg?: string;
  coverImage?: string;
  cardImages?: string[];
  dimensions?: string;
  price_eur?: number;
  wholesalePrice?: string;
  price?: string;
  posts?: any[];
  highlights?: any[];
  isVerified?: boolean;
  stockStatus?: string;
  finish?: string;
  material?: string;
  description?: string;
  variant_label?: string;
  variants?: { name: string; avatar?: string }[];
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
  is_banned?: boolean;
  banned_reason?: string;
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

export interface Category {
  id: string;
  name: string;
  name_bg: string | null;
  icon?: string | null;
  display_order?: number;
  created_at?: string;
}

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
