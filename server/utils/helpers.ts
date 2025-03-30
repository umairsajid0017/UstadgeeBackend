import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Save a Base64 encoded image to the profile images directory
 * @param imageData Base64 encoded image data
 * @param imageName Original image name
 * @returns Filename of saved image
 */
export async function saveProfileImage(imageData: string, imageName: string): Promise<string> {
  try {
    // Extract the actual base64 data by removing the data URL prefix
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
    // Get file extension from the original name or default to .jpg
    const ext = path.extname(imageName) || '.jpg';
    
    // Generate a unique filename
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    
    // Make sure uploads/profiles directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save the file
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, base64Data, 'base64');
    
    return filename;
  } catch (error) {
    console.error('Error saving profile image:', error);
    throw new Error('Failed to save profile image');
  }
}

/**
 * Save a Base64 encoded audio file to the audio directory
 * @param audioData Base64 encoded audio data
 * @param audioName Original audio file name
 * @returns Filename of saved audio file
 */
export async function saveAudioFile(audioData: string, audioName: string): Promise<string> {
  try {
    // Extract the actual base64 data by removing the data URL prefix
    const base64Data = audioData.replace(/^data:audio\/\w+;base64,/, '');
    
    // Get file extension from the original name or default to .mp3
    const ext = path.extname(audioName) || '.mp3';
    
    // Generate a unique filename
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    
    // Make sure uploads/audio directory exists
    const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save the file
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, base64Data, 'base64');
    
    return filename;
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw new Error('Failed to save audio file');
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Degrees
 * @returns Radians
 */
function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

/**
 * Format phone number to E.164 format
 * @param phoneNumber Raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If the number doesn't have a country code, add +92 (Pakistan) as default
  if (cleaned.length <= 10) {
    return `+92${cleaned.slice(-10)}`;
  }
  
  // If it already has a country code, add + at the beginning if missing
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Generate pagination metadata
 * @param page Current page
 * @param limit Items per page
 * @param total Total number of items
 * @returns Pagination metadata
 */
export function getPaginationMetadata(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}