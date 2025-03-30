import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import 'express';

// Get current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const PROFILE_IMG_DIR = path.join(UPLOAD_DIR, 'profiles');
const SERVICE_IMG_DIR = path.join(UPLOAD_DIR, 'services');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');

// Create directories if they don't exist
[UPLOAD_DIR, PROFILE_IMG_DIR, SERVICE_IMG_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for profile images
const profileStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, PROFILE_IMG_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure storage for service images
const serviceStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, SERVICE_IMG_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `service-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Configure storage for audio files
const audioStorage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, AUDIO_DIR);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `audio-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter for images
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed!'));
};

// File filter for audio
const audioFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const filetypes = /mp3|wav|ogg|m4a/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Only audio files (mp3, wav, ogg, m4a) are allowed!'));
};

// Initialize multer upload instances
export const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
}).single('profileImage');

export const uploadServiceImages = multer({
  storage: serviceStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter
}).array('serviceImages', 5); // Up to 5 images

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: audioFileFilter
}).single('audioFile');

// Process base64 image data
export const processBase64Image = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.imageData && req.body.image_name) {
      const imageData = req.body.imageData;
      const imageName = req.body.image_name;
      
      // Extract MIME type and base64 data
      const matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 image data'
        });
      }
      
      const type = matches[1];
      const data = Buffer.from(matches[2], 'base64');
      
      // Generate a unique filename
      const fileName = `profile-${Date.now()}-${uuidv4()}${path.extname(imageName)}`;
      const filePath = path.join(PROFILE_IMG_DIR, fileName);
      
      // Save the image
      fs.writeFileSync(filePath, data);
      
      // Add the file path to the request
      req.body.profileImage = fileName;
      
      // Remove the base64 data to save memory
      delete req.body.imageData;
    }
    
    next();
  } catch (error) {
    console.error('Error processing base64 image:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing image'
    });
  }
};

// Process base64 audio data
export const processBase64Audio = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body.audio_data && req.body.audio_name) {
      const audioData = req.body.audio_data;
      const audioName = req.body.audio_name;
      
      // Extract MIME type and base64 data
      const matches = audioData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return res.status(400).json({
          success: false,
          message: 'Invalid base64 audio data'
        });
      }
      
      const type = matches[1];
      const data = Buffer.from(matches[2], 'base64');
      
      // Generate a unique filename
      const fileName = `audio-${Date.now()}-${uuidv4()}${path.extname(audioName)}`;
      const filePath = path.join(AUDIO_DIR, fileName);
      
      // Save the audio file
      fs.writeFileSync(filePath, data);
      
      // Add the file path to the request
      req.body.audioName = fileName;
      
      // Remove the base64 data to save memory
      delete req.body.audio_data;
    }
    
    next();
  } catch (error) {
    console.error('Error processing base64 audio:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing audio'
    });
  }
};

// Error handler for multer
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(500).json({
      success: false,
      message: `Error: ${err.message}`
    });
  }
  
  next();
};
