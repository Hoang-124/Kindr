// src/services/uploadService.ts
import { api } from './api';

export interface UploadResponse {
  message: string;
  url: string;
  publicId: string;
}

/**
 * Upload an image to Cloudinary Media Cloud via Kindr Backend API.
 * Supports Base64 data URIs, local file URIs, or remote URLs.
 */
export async function uploadImageToCloud(imageUriOrBase64: string, folder: string = 'kindr/products'): Promise<string> {
  try {
    const response = await api.post<UploadResponse>('/upload', {
      image: imageUriOrBase64,
      folder,
    });
    return response.data.url;
  } catch (error: any) {
    console.warn('Upload image to cloud warning:', error?.response?.data || error?.message);
    // If upload fails in offline/fallback mode, return the original uri so the app continues gracefully
    return imageUriOrBase64;
  }
}
