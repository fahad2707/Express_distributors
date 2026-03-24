import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

function assertCloudinaryEnv() {
  const missing: string[] = [];
  if (!process.env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (missing.length) {
    throw new Error(`Cloudinary is not configured. Missing: ${missing.join(', ')}`);
  }
}

export async function uploadImageBufferToCloudinary(
  fileBuffer: Buffer,
  mimeType: string,
  folder: string,
  resourceType: 'image' | 'auto' = 'image'
): Promise<{ url: string; publicId: string }> {
  assertCloudinaryEnv();
  ensureConfigured();

  const baseFolder = process.env.CLOUDINARY_FOLDER?.trim();
  const fullFolder = baseFolder ? `${baseFolder}/${folder}` : folder;

  const safeMimeType = mimeType && mimeType.includes('/') ? mimeType : 'image/jpeg';
  const dataUri = `data:${safeMimeType};base64,${fileBuffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: fullFolder,
    resource_type: resourceType,
    overwrite: false,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

