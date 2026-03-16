import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface WishlistItem {
    id: string;
    slug: string;
    added_at: string;
}

interface WishlistContextType {
    wishlist: WishlistItem[];
    toggleWishlist: (slug: string) => void;
    isInWishlist: (slug: string) => boolean;
    clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

    // Storage key depends on user ID for persistence across devices/sessions per user
    const getStorageKey = useCallback(() => {
        return user ? `wishlist_${user.id}` : 'wishlist_guest';
    }, [user]);

    // Load wishlist on mount or user change
    useEffect(() => {
        const key = getStorageKey();
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                setWishlist(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse wishlist", e);
                setWishlist([]);
            }
        } else {
            setWishlist([]);
        }
    }, [getStorageKey]);

    // Save wishlist whenever it changes
    useEffect(() => {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(wishlist));
    }, [wishlist, getStorageKey]);

    const toggleWishlist = useCallback((slug: string) => {
        setWishlist(prev => {
            const exists = prev.find(item => item.slug === slug);
            if (exists) {
                return prev.filter(item => item.slug !== slug);
            }
            return [...prev, { 
                id: Math.random().toString(36).substring(7),
                slug, 
                added_at: new Date().toISOString() 
            }];
        });
    }, []);

    const isInWishlist = useCallback((slug: string) => {
        return wishlist.some(item => item.slug === slug);
    }, [wishlist]);

    const clearWishlist = useCallback(() => {
        setWishlist([]);
    }, []);

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist, clearWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};
