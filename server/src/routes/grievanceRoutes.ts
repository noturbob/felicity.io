import express from 'express';
import { getGrievances, createGrievance } from '../controllers/grievanceController';

const router = express.Router();

router.route('/').get(getGrievances).post(createGrievance);

export default router;