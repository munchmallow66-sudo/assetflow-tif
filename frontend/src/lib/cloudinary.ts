import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

let configured = false;

function ensureConfig() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  configured = true;
}

export async function uploadImage(
  fileBuffer: Buffer,
  folder: string = 'thai-inter-flying',
): Promise<UploadApiResponse> {
  ensureConfig();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) return reject(error);
        resolve(result!);
      })
      .end(fileBuffer);
  });
}
