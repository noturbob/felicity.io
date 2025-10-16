import express from 'express';
// FIX: Corrected the import path from 'chatControllers' to 'chatController'
import { getChatSessions, getChatMessages } from '../controllers/chatControllers';
import { protect } from '../middleware/authMiddleware'; // Import the protect middleware

const router = express.Router();

// Apply the 'protect' middleware to both routes, ensuring only authenticated users can access them.
router.route('/').get(protect, getChatSessions);
router.route('/:id').get(protect, getChatMessages);

export default router;