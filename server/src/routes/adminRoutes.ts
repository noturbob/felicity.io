import express from 'express';
import { getAllGrievances, respondToGrievance } from '../controllers/adminControllers';
import { protect } from '../middleware/authMiddleware';
import { admin } from '../middleware/adminMiddleware';

const router = express.Router();

// All routes are protected and require admin access
router.route('/grievances').get(protect, admin, getAllGrievances);
router.route('/grievances/:id').put(protect, admin, respondToGrievance);

export default router;
