
import { modelsData } from '../data/models';
import type { Model } from '../types';

export const useModels = () => {
  const getAllModels = (): Model[] => {
    return modelsData;
  };

  const getModelBySlug = (slug: string): Model | undefined => {
    return modelsData.find(model => model.slug === slug);
  };
  
  const getFeaturedModels = (count: number = 6): Model[] => {
    return modelsData.slice(0, count);
  };

  return { getAllModels, getModelBySlug, getFeaturedModels };
};
