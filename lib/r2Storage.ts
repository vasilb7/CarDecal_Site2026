import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Environment variables from your .env file
const R2_BUCKET_NAME = import.meta.env.VITE_R2_BUCKET_NAME;
const R2_ACCOUNT_ID = import.meta.env.VITE_R2_ACCOUNT_ID;
const ACCESS_KEY_ID = import.meta.env.VITE_R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_DOMAIN = import.meta.env.VITE_R2_PUBLIC_DOMAIN; // e.g., https://media.yourdomain.com

// Initialize S3 Client for Cloudflare R2
const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to Cloudflare R2 and returns the public URL.
 * @param file The file object to upload.
 * @param folder Optional folder path (e.g., 'models', 'campaigns').
 */
export const uploadFileToR2 = async (file: File, folder = 'uploads') => {
  if (!R2_BUCKET_NAME || !R2_ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error("Missing Cloudflare R2 configuration. check your .env file.");
  }

  try {
    // Generate a unique file name
    const fileExtension = file.name.split('.').pop();
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileName = `${folder}/${uniqueId}.${fileExtension}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      // ACL: 'public-read', // Uncomment if your bucket ACL allows user-defined ACLs
    });

    await S3.send(command);

    // Return the public URL
    // If you have a custom domain mapped to your R2 bucket, use it.
    // Otherwise, use the R2.dev URL if enabled.
    const publicUrl = R2_PUBLIC_DOMAIN 
      ? `${R2_PUBLIC_DOMAIN}/${fileName}`
      : `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${fileName}`; // Fallback (often requires specific setup)
    
    return publicUrl;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw error;
  }
};
