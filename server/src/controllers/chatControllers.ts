import { Request, Response } from 'express';
import Chat from '../models/Chats';

// Placeholder user ID (must match the ID in index.ts)
const BHUMIKA_USER_ID = "bhumika_unique_felicity_user";

// @desc    Get all chat sessions for the user
// @route   GET /api/chats
export const getChatSessions = async (req: Request, res: Response) => {
  try {
    // Finds chats for Bhumika that have at least one message, sorted by last update time
    const chats = await Chat.find({ userId: BHUMIKA_USER_ID, messages: { $exists: true, $not: { $size: 0 } } })
      .sort({ updatedAt: -1 });

    // Map the records to only return the necessary info for the list display
    const chatList = chats.map((c: any) => ({
      id: c._id,
      title: c.title,
      lastMessageTime: c.updatedAt,
    }));

    res.json(chatList);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    res.status(500).json({ message: 'Server Error: Could not retrieve chat history.' });
  }
};

// @desc    Get messages for a specific chat session
// @route   GET /api/chats/:id
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    const chatRecord = await Chat.findById(req.params.id);

    if (!chatRecord) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Only return the messages array
    res.json(chatRecord.messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server Error: Could not load chat messages.' });
  }
};