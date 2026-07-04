import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { logger } from '../middleware/logger';

// Setup local multer storage
const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const uploadMiddleware = multer({
  storage: localDiskStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export class UploadService {
  private static instance: UploadService;
  private isCloudinaryConfigured = false;

  private constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        });
        this.isCloudinaryConfigured = true;
        logger.info('Cloudinary initialized successfully.');
      } catch (err: any) {
        logger.warn(`Failed to initialize Cloudinary: ${err.message}. Defaulting to Local Storage.`);
      }
    } else {
      logger.info('Cloudinary credentials missing. Defaulting to Local Storage for attachments.');
    }
  }

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  /**
   * Uploads file to Cloudinary, or keeps local storage if Cloudinary is not configured.
   * Returns final accessible path/URL and file info.
   */
  public async uploadFile(file: Express.Multer.File): Promise<{ path: string; filename: string }> {
    if (this.isCloudinaryConfigured) {
      try {
        logger.debug(`Uploading file ${file.originalname} to Cloudinary...`);
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'ai-task-manager',
          resource_type: 'auto',
        });
        
        // Remove temp file from local disk
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          logger.warn(`Could not remove temp local file: ${file.path}`);
        }

        return {
          path: result.secure_url,
          filename: file.originalname,
        };
      } catch (err: any) {
        logger.error(`Cloudinary upload failed: ${err.message}. Retaining local file.`);
      }
    }

    // Local Disk Fallback
    // Return relative URL that Express can serve statically
    const relativePath = `/uploads/${file.filename}`;
    logger.debug(`File ${file.originalname} saved locally at ${relativePath}`);
    
    return {
      path: relativePath,
      filename: file.originalname,
    };
  }
}

export const uploadService = UploadService.getInstance();
