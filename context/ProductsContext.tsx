import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Post, Highlight, Category } from '../types';
import { supabase } from '../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRow = (p: any): Product => ({
  slug:             p.slug           ?? '',
  name:             p.name           ?? '',
  nameBg:           p.name_bg        ?? '',
  avatar:           p.avatar         ?? '',
  coverImage:       p.cover_image    ?? '',
  categories:       Array.isArray(p.categories)  ? p.categories  : [],
  location:         p.location       ?? '',
  dimensions:       p.dimensions     ?? '',
  size:             p.size           ?? '',

  isBestSeller:     !!p.is_best_seller,
  isVerified:       !!p.is_verified,
  price:            p.price          ?? '',
  price_eur:        p.price_eur      as number | undefined,
  wholesalePrice:   p.wholesale_price   ?? '',
  wholesalePriceEur: p.wholesale_price_eur as number | undefined,
  cardImages:       Array.isArray(p.card_images) ? p.card_images  : [],
  isHidden:         !!p.is_hidden,
  posts:            Array.isArray(p.posts)        ? (p.posts        as Post[])      : [],
  highlights:       Array.isArray(p.highlights)   ? (p.highlights   as Highlight[]) : [],
  top_order:        p.top_order      ?? null,
});

const naturalSort = (a: Product, b: Product) => {
  const numA = parseInt(a.slug.match(/\d+/)?.[0] ?? '0', 10);
  const numB = parseInt(b.slug.match(/\d+/)?.[0] ?? '0', 10);
  if (numA !== numB) return numA - numB;
  return a.slug.localeCompare(b.slug);
};

// ── Context ──────────────────────────────────────────────────────────────────

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  getAllProducts: () => Product[];
  getProductBySlug: (slug: string) => Product | undefined;
  getFeaturedProducts: (count?: number) => Product[];
  categories: Category[];
  fetchCategories: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

export const ProductsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const allRows: any[] = [];
      let rFrom = 0;
      const rSize = 1000;
      
      // Fetch all products in batches of 1000
      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select("slug,name,avatar,categories,dimensions,size,wholesale_price_eur,is_best_seller,is_hidden,top_order,card_images,price_eur")
          .order('id', { ascending: false })
          .range(rFrom, rFrom + rSize - 1);
          
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allRows.push(...data);
        if (data.length < rSize) break;
        rFrom += rSize;
      }

      // Map and sort once at the very end for total stability
      const finalProducts = allRows.map(mapRow);
      finalProducts.sort(naturalSort);
      
      setProducts(finalProducts);
      setLoading(false);
    } catch (err) {
      console.error('Error in ProductsContext:', err);
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchCategories();

    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          fetchAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          fetchCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, fetchCategories]);

  const getAllProducts       = ()                  : Product[]           => products;
  const getProductBySlug    = (slug: string)       : Product | undefined => products.find(p => p.slug.toLowerCase() === (slug || '').toLowerCase());
  const getFeaturedProducts = (count = 6)          : Product[]           => products.filter(p => p.isBestSeller).slice(0, count);

  return (
    <ProductsContext.Provider value={{ products, loading, getAllProducts, getProductBySlug, getFeaturedProducts, categories, fetchCategories }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within a ProductsProvider');
  return ctx;
};
