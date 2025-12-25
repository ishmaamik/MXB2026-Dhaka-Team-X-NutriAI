import cloudinary from '../config/cloudinary';
import { UploadedFile } from 'express-fileupload';

export const uploadToCloudinary = async (file: UploadedFile): Promise<string> => {
  try {
    // Upload using file buffer
    const result = await cloudinary.uploader.upload(
      `data:${file.mimetype};base64,${file.data.toString('base64')}`,
      {
        folder: 'nutritrack-receipts',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1600, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      }
    );

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteFromCloudinary = async (imageUrl: string): Promise<void> => {
  try {
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1];
    const publicId = `nutritrack-receipts/${filename.split('.')[0]}`;
    
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
  }
};