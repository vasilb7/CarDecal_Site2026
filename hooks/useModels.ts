import { useState, useEffect, useCallback } from 'react';
import { modelsService } from '../lib/modelsService';
import type { Model } from '../types';

export const useModels = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAllModels = useCallback(async (): Promise<Model[]> => {
    setLoading(true);
    try {
      const data = await modelsService.getAllModels();
      // Map database snake_case to frontend camelCase if necessary, 
      // but here we kept them mostly consistent in lib/modelsService or manually map
      return data.map((m: any) => ({
        ...m,
        hairColor: m.hair_color,
        eyeColor: m.eye_color,
        coverImage: m.cover_image,
        cardImages: m.card_images,
        isTopModel: m.is_top_model,
        isVerified: m.is_verified,
        nameBg: m.name_bg
      })) as Model[];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getModelBySlug = useCallback(async (slug: string): Promise<Model | null> => {
    setLoading(true);
    try {
      const m = await modelsService.getModelBySlug(slug);
      if (!m) return null;
      return {
        ...m,
        hairColor: m.hair_color,
        eyeColor: m.eye_color,
        coverImage: m.cover_image,
        cardImages: m.card_images,
        isTopModel: m.is_top_model,
        isVerified: m.is_verified,
        nameBg: m.name_bg
      } as Model;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const getTopModel = useCallback(async (): Promise<Model | null> => {
    setLoading(true);
    try {
      const m = await modelsService.getTopModel();
      if (!m) return null;
      return {
        ...m,
        hairColor: m.hair_color,
        eyeColor: m.eye_color,
        coverImage: m.cover_image,
        cardImages: m.card_images,
        isTopModel: m.is_top_model,
        isVerified: m.is_verified,
        nameBg: m.name_bg
      } as Model;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFeaturedModels = useCallback(async (count: number = 6): Promise<Model[]> => {
    const all = await getAllModels();
    return all.slice(0, count);
  }, [getAllModels]);

  return { getAllModels, getModelBySlug, getFeaturedModels, getTopModel, loading, error };
};
