import { cloudinaryConfig } from './cloudinary';

/**
 * Generates a SHA-1 signature for Cloudinary signed uploads.
 * Note: This uses the API Secret which is exposed via VITE_ prefix.
 */
async function generateSignature(params: Record<string, any>, secret: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
    
  const signatureString = sortedParams + secret;
  const msgUint8 = new TextEncoder().encode(signatureString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadToCloudinary(file: File, folder: string = 'general', resourceType: 'image' | 'video' | 'auto' = 'auto'): Promise<string> {
  if (!cloudinaryConfig.apiKey || !cloudinaryConfig.apiSecret || !cloudinaryConfig.cloudName) {
    console.error('Missing Cloudinary config:', cloudinaryConfig);
    throw new Error('Липсва Cloudinary конфигурация (API Key/Secret). Моля, рестартирайте локалния сървър (npm run dev)!');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params: any = {
    folder,
    timestamp,
  };

  if (resourceType !== 'auto') {
    params.resource_type = resourceType;
  }

  const signature = await generateSignature(params, cloudinaryConfig.apiSecret);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', cloudinaryConfig.apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  if (resourceType !== 'auto') {
    formData.append('resource_type', resourceType);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/${resourceType === 'auto' ? 'upload' : resourceType + '/upload'}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url;
}

/**
 * Optimizes a Cloudinary URL by adding auto-format, auto-quality, and optional resizing.
 */
export function getOptimizedUrl(url: string, options: { width?: number; height?: number; crop?: string; blur?: number } = {}): string {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Split into base and public_id/version part
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const baseUrl = url.substring(0, uploadIndex + 8); // Includes /upload/
  const remainingUrl = url.substring(uploadIndex + 8);

  const { width, height, crop = 'fit', blur } = options;
  // f_auto sets WebP/AVIF format automatically
  // q_auto balances file size and visual fidelity without making images blurry
  // fl_progressive makes JPEGs load progressively instead of top-to-bottom
  const transformations = ['f_auto', 'q_auto', 'fl_progressive'];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  if (blur) transformations.push(`e_blur:${blur}`);

  // Construct optimized URL - ensure transformations are the first segment after /upload/
  return `${baseUrl}${transformations.join(',')}/${remainingUrl}`;
}

/**
 * Generates a srcset string for Cloudinary images.
 */
export function getSrcSet(url: string, widths: number[], options: { height?: number; crop?: string } = {}): string {
  if (!url || !url.includes('cloudinary.com')) return '';
  
  return widths
    .map(width => `${getOptimizedUrl(url, { ...options, width })} ${width}w`)
    .join(', ');
}
