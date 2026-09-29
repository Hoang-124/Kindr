// src/services/uploadService.ts
import { api } from './api';

export interface UploadResponse {
  message: string;
  url: string;
  publicId: string;
}

/**
 * Upload an image to Cloudinary Media Cloud via Kindr Backend API.
 * Supports Base64 data URIs, local file URIs, blob URIs on Web, or remote URLs.
 */
export async function uploadImageToCloud(imageUriOrBase64: string, folder: string = 'kindr/products'): Promise<string> {
  try {
    let payload = imageUriOrBase64;

    // Trên Web, chuyển đổi blob: URL sang Base64 data URI để Node.js backend có thể nạp vào Cloudinary
    if (typeof window !== 'undefined' && typeof imageUriOrBase64 === 'string' && imageUriOrBase64.startsWith('blob:')) {
      try {
        const res = await fetch(imageUriOrBase64);
        const blob = await res.blob();
        payload = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (blobErr) {
        console.warn('Failed to convert blob to base64:', blobErr);
      }
    }

    const response = await api.post<UploadResponse>('/upload', {
      image: payload,
      folder,
    });
    return response.data.url;
  } catch (error: any) {
    console.warn('Upload image to cloud warning:', error?.response?.data || error?.message);
    // If upload fails in offline/fallback mode, return the original uri so the app continues gracefully
    return imageUriOrBase64;
  }
}
