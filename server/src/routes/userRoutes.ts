import express from 'express';
import { getUserProfile, updateUserProfile, deleteUser, updateUserAvatar } from '../controllers/userControllers';
import { protect } from '../middleware/authMiddleware';
import upload from '../middleware/multerMiddleware';

const router = express.Router();

// This group handles text-based profile updates and account deletion.
// All requests to these endpoints must pass the 'protect' middleware first.
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)
    .delete(protect, deleteUser);

// This new route specifically handles the avatar image upload.
// It first protects the route, then uses the 'upload' middleware to handle the file,
// and finally passes control to the 'updateUserAvatar' controller.
router.route('/profile/avatar').put(protect, upload.single('avatar'), updateUserAvatar);

export default router;

