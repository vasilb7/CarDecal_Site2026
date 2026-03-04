import { useState, useEffect, useCallback } from 'react';
import type { Product, Post, Highlight } from '../types';
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
  finish:           p.finish         ?? '',
  material:         p.material       ?? '',
  description:      p.description    ?? '',

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
});

const naturalSort = (a: Product, b: Product) => {
  const numA = parseInt(a.slug.match(/\d+/)?.[0] ?? '0', 10);
  const numB = parseInt(b.slug.match(/\d+/)?.[0] ?? '0', 10);
  if (numA !== numB) return numA - numB;
  return a.slug.localeCompare(b.slug);
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState<boolean>(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      let allData: any[] = [];
      let rFrom = 0;
      const rSize = 1000;
      
      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select('slug,name,name_bg,avatar,cover_image,categories,location,dimensions,size,finish,material,description,is_best_seller,is_verified,price,price_eur,wholesale_price,wholesale_price_eur,card_images,is_hidden')
          .order('id', { ascending: false })
          .range(rFrom, rFrom + rSize - 1);
          
        if (error) throw error;
        if (data) allData = [...allData, ...data];
        if (!data || data.length < rSize) break;
        rFrom += rSize;
      }

      const mapped = allData.map(mapRow);
      mapped.sort(naturalSort);
      setProducts(mapped);

    } catch (err) {
      console.error('❌ Error in useProducts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Първоначално зареждане
    fetchAll();

    // ── Supabase Realtime ─────────────────────────────────────────────────
    // При всякаква промяна (INSERT / UPDATE / DELETE) в таблица products
    // state се обновява мигновено — без нужда от refresh на страницата.
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {

          fetchAll();
        }
      )
      .subscribe((status) => {

      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const getAllProducts       = ()                  : Product[]           => products;
  const getProductBySlug    = (slug: string)       : Product | undefined => products.find(p => p.slug === slug);
  const getFeaturedProducts = (count = 6)          : Product[]           => products.filter(p => p.isBestSeller).slice(0, count);

  return { getAllProducts, getProductBySlug, getFeaturedProducts, loading, products };
};
