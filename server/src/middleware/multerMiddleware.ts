import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary with your credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up the storage engine to upload files to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'felicity-avatars', // A folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg'],
  } as any,
});

// Initialize multer with the Cloudinary storage engine
const upload = multer({ storage: storage });

export default upload;

