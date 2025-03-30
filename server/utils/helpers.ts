import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const PROFILE_IMG_DIR = path.join(UPLOAD_DIR, 'profiles');
const SERVICE_IMG_DIR = path.join(UPLOAD_DIR, 'services');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');

// Ensure upload directories exist
[UPLOAD_DIR, PROFILE_IMG_DIR, SERVICE_IMG_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Save a Base64 encoded image to the profile images directory
 * @param imageData Base64 encoded image data
 * @param imageName Original image name
 * @returns Filename of saved image
 */
export async function saveProfileImage(imageData: string, imageName: string): Promise<string> {
  try {
    // Extract MIME type and base64 data
    const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data');
    }
    
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    // Generate a unique filename
    const fileName = `profile-${Date.now()}-${uuidv4()}${path.extname(imageName)}`;
    const filePath = path.join(PROFILE_IMG_DIR, fileName);
    
    // Save the image
    await fs.promises.writeFile(filePath, data);
    
    return fileName;
  } catch (error) {
    console.error('Error saving profile image:', error);
    throw error;
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
    // Extract MIME type and base64 data
    const matches = audioData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 audio data');
    }
    
    const type = matches[1];
    const data = Buffer.from(matches[2], 'base64');
    
    // Generate a unique filename
    const fileName = `audio-${Date.now()}-${uuidv4()}${path.extname(audioName)}`;
    const filePath = path.join(AUDIO_DIR, fileName);
    
    // Save the audio file
    await fs.promises.writeFile(filePath, data);
    
    return fileName;
  } catch (error) {
    console.error('Error saving audio file:', error);
    throw error;
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
  const R = 6371; // Radius of the earth in km
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
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Add '+' if not present
  if (!phoneNumber.startsWith('+')) {
    return `+${digitsOnly}`;
  }
  
  return phoneNumber;
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
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
}
