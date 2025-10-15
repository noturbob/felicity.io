import express from 'express';
import { getChatSessions, getChatMessages } from '../controllers/chatControllers';

const router = express.Router();

// Route for fetching the list of all chat sessions
router.get('/', getChatSessions);

// Route for fetching messages of a specific session
router.get('/:id', getChatMessages);

export default router;
