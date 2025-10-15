import express from 'express';
import { getUserProfile, updateUserProfile, deleteUser } from "../controllers/userControllers";
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// All routes here are protected by the 'protect' middleware
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile)
    .delete(protect, deleteUser);

export default router;