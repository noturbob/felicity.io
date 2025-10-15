import mongoose from 'mongoose';

// Defines the structure of a single message within the chat session
const messageSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: ['user', 'model'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
});

// Defines the structure of the entire chat session
const chatSchema = new mongoose.Schema({
  // Placeholder for user identification (we will use a hardcoded value for now)
  userId: { 
    type: String, 
    required: true 
  }, 
  title: { 
    type: String, 
    required: true,
    default: "New Chat" // Default title for new chats
  },
  messages: [messageSchema], // Array of messages
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;