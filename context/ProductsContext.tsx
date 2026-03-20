import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Post, Highlight, Category } from '../types';
import { supabase } from '../lib/supabase';

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapRow = (p: any): Product => ({
  id:               p.id             ?? undefined,
  slug:             p.slug           ?? '',
  name:             p.name           ?? '',
  avatar:           p.avatar         ?? '',
  categories:       Array.isArray(p.categories) ? p.categories : [],
  location:         p.location       ?? '',
  size:             p.size           ?? '',
  wholesale_price_eur: p.wholesale_price_eur as number | undefined,
  wholesalePriceEur:   p.wholesale_price_eur as number | undefined, // alias
  isBestSeller:     !!p.is_best_seller,
  isHidden:         !!p.is_hidden,
  top_order:        p.top_order      ?? null,
  variant_label:    p.variant_label  || '',
  variants:         Array.isArray(p.variants) ? p.variants : [],
  // legacy - undefined in new schema
  nameBg:           undefined,
  coverImage:       undefined,
  cardImages:       [],
  dimensions:       p.size           ?? '', // map size -> dimensions for filter compat
  price_eur:        p.wholesale_price_eur as number | undefined,
  posts:            [],
  highlights:       [],
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
  fetchAll: () => Promise<void>;
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
          .select("id,slug,name,avatar,categories,location,size,wholesale_price_eur,is_best_seller,is_hidden,top_order,variants,variant_label")
          .order('top_order', { ascending: true, nullsFirst: false })
          .order('is_best_seller', { ascending: false })
          .order('id', { ascending: false })
          .range(rFrom, rFrom + rSize - 1);
          
        if (error) throw error;
        if (!data || data.length === 0) break;
        
        allRows.push(...data);
        if (data.length < rSize) break;
        rFrom += rSize;
      }

      // Map and assign display ranks sequentially for all top-priority products
      // They are already sorted by Supabase (top_order ASC -> is_best_seller DESC -> id DESC)
      let currentRank = 1;
      const finalProducts = allRows.map(mapRow).map(p => {
        if (!p.isHidden && (p.top_order !== null || p.isBestSeller)) {
          p.display_rank = currentRank++;
        }
        return p;
      });
      
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
    <ProductsContext.Provider value={{ products, loading, getAllProducts, getProductBySlug, getFeaturedProducts, categories,    fetchCategories,
    fetchAll
  }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = (): ProductsContextType => {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within a ProductsProvider');
  return ctx;
};
