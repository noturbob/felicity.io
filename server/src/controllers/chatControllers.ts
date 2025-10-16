import { Request, Response } from 'express';
import Chat from '../models/Chat';
import { UserDocument } from '../models/User'; // Import the UserDocument type for casting

// @desc    Get all chat sessions for the LOGGED-IN user
// @route   GET /api/chats
export const getChatSessions = async (req: Request, res: Response) => {
  try {
    // FIX: Cast req.user to UserDocument to safely access its properties.
    const user = req.user as UserDocument;

    // A safety check to ensure the user object and its ID exist.
    if (!user?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Now use the user's ID to find their specific chats.
    const chats = await Chat.find({ userId: user._id, messages: { $exists: true, $not: { $size: 0 } } })
      .sort({ updatedAt: -1 });

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

// @desc    Get messages for a specific chat session, ensuring it belongs to the logged-in user
// @route   GET /api/chats/:id
export const getChatMessages = async (req: Request, res: Response) => {
  try {
    // FIX: Cast req.user to UserDocument here as well for type safety.
    const user = req.user as UserDocument;

    if (!user?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    // This query now securely finds the chat by its ID AND ensures it belongs to the logged-in user.
    const chatRecord = await Chat.findOne({ _id: req.params.id, userId: user._id });

    if (!chatRecord) {
      return res.status(404).json({ message: 'Chat not found or you do not have permission to view it.' });
    }

    res.json(chatRecord.messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Server Error: Could not load chat messages.' });
  }
};

