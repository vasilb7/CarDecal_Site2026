import React from 'react';
import { getOptimizedUrl, getSrcSet } from '../../lib/cloudinary-utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  widths?: number[];
  sizes?: string;
  priority?: boolean;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  mobileSrc?: string;
  desktopSrc?: string;
  onLoad?: () => void;
}

/**
 * A highly optimized image component for React.
 * Supports:
 * - Responsive images via srcset and sizes
 * - Mobile/Desktop specific assets via <picture>
 * - AVIF/WebP via Cloudinary f_auto
 * - Layout shift prevention via aspect-ratio
 * - High priority loading for Hero/LCP elements
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  widths = [320, 640, 768, 1024, 1280, 1536, 1920, 2560],
  sizes = '100vw',
  priority = false,
  aspectRatio,
  objectFit = 'cover',
  mobileSrc,
  desktopSrc,
  onLoad,
}) => {
  const isCloudinary = src.includes('cloudinary.com');
  
  // Base transformations
  const baseOptions = { crop: 'fit' };

  // If we have specific mobile/desktop assets, we use the <picture> tag
  if (mobileSrc || desktopSrc) {
    return (
      <picture className={className}>
        {/* Desktop Source */}
        {desktopSrc && (
          <source
            media="(min-width: 1024px)"
            srcSet={getSrcSet(desktopSrc, widths.filter(w => w >= 1024), baseOptions)}
            sizes={sizes}
          />
        )}
        {/* Mobile Source */}
        {mobileSrc && (
          <source
            media="(max-width: 1023px)"
            srcSet={getSrcSet(mobileSrc, widths.filter(w => w < 1280), baseOptions)}
            sizes={sizes}
          />
        )}
        {/* Fallback Image */}
        <img
          src={getOptimizedUrl(src, { width: 1280 })}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={onLoad}
          className={`w-full h-full ${className}`}
          style={{ 
            aspectRatio: aspectRatio,
            objectFit: objectFit,
          }}
        />
      </picture>
    );
  }

  // Standard responsive image with srcset
  const srcSet = isCloudinary ? getSrcSet(src, widths, baseOptions) : undefined;
  const mainSrc = isCloudinary ? getOptimizedUrl(src, { width: widths[Math.floor(widths.length / 2)] }) : src;

  return (
    <img
      src={mainSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={onLoad}
      className={className}
      style={{ 
        aspectRatio: aspectRatio,
        objectFit: objectFit,
      }}
    />
  );
};

export default OptimizedImage;
