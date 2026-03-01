export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
};

if (!cloudinaryConfig.cloudName || !cloudinaryConfig.apiKey) {
  console.error('Missing Cloudinary environment variables');
}
