import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI, ChatSession, GenerativeModel, Content, Part } from '@google/generative-ai';
import { configurePassport } from './config/passport';
import connectDB from './config/db';
import grievanceRoutes from './routes/grievanceRoutes';
import chatRoutes from './routes/chatRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import Chat from './models/Chat'; // FIX: Corrected import path from 'Chats' to 'Chat'
import User from './models/User';

// Load environment variables and connect to the database
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION FOR CORS & DEPLOYMENT ---
const allowedOrigins = [
  "http://localhost:3000",
  process.env.RENDER_EXTERNAL_URL,
  "https://felicity-io-client.vercel.app"
].filter(Boolean);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"]
};

const io = new SocketIOServer(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());
app.use(passport.initialize());
configurePassport();

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const activeChatSessions = new Map<string, { chat: ChatSession, dbId: string }>();

// --- WEBSOCKET AUTHENTICATION MIDDLEWARE ---
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error: No token provided.'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return next(new Error('Authentication error: User not found.'));
        }
        (socket as any).user = user;
        next();
    } catch (err) {
        return next(new Error('Authentication error: Invalid token.'));
    }
});

// --- HELPER FUNCTIONS ---
const toGeminiContent = (messages: any[]): Content[] => {
    return messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content } as Part],
    }));
};

const generateChatTitle = async (firstMessage: string) => {
    try {
        const titleModel = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", // Use a stable model
            systemInstruction: "You are a chat titler. Based on the user's message, create a short, concise title (max 5 words) that summarizes the conversation topic. Only respond with the title, nothing else." 
        });
        const result = await titleModel.generateContent(firstMessage);
        return result.response.text().trim().replace(/['".,]/g, '');
    } catch (error) {
        console.error("Error generating chat title:", error);
        return "New Chat";
    }
};

const initializeChatSession = async (socketId: string, chatId: string, model: GenerativeModel) => {
    try {
        const chatRecord = await Chat.findById(chatId);
        if (!chatRecord) {
            console.error(`Chat ${chatId} not found in database`);
            return false;
        }
        const history = chatRecord.messages ? toGeminiContent(chatRecord.messages) : [];
        const chat = model.startChat({ 
            history, 
            generationConfig: { maxOutputTokens: 2000 } 
        });
        activeChatSessions.set(socketId, { chat, dbId: chatId });
        console.log(`Initialized chat session for socket ${socketId} with chat ${chatId}`);
        return true;
    } catch (error) {
        console.error("Error initializing chat session:", error);
        return false;
    }
};

// --- WEBSOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.name} (${socket.id})`);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // FIX: Use a stable, working model
      systemInstruction: `You are Felicity, a kind, supportive, and brilliant AI assistant. You are speaking with ${user.name}. Your purpose is to help them with their studies, answer questions about science and life, and provide encouragement. Always be positive and insightful. Never mention that you are a language model.`,
    });

    socket.on('joinChat', async (chatId: string) => {
        console.log(`Socket ${socket.id} joining chat ${chatId}`);
        const success = await initializeChatSession(socket.id, chatId, model);
        if (!success) {
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });
    
    socket.on('createNewChat', async () => {
        console.log(`Creating new chat for user ${user.name}`);
        try {
            const newChatRecord = new Chat({ 
                userId: user._id, 
                title: "New Chat",
                messages: []
            });
            await newChatRecord.save();
            const chatId = newChatRecord._id.toString();
            console.log(`New chat created with ID: ${chatId}`);
            await initializeChatSession(socket.id, chatId, model);
            socket.emit('chatCreated', chatId);
        } catch (error) {
            console.error("Failed to create new chat:", error);
            socket.emit('error', { message: 'Failed to create new chat' });
        }
    });

    socket.on('sendMessage', async (data: { message: string, chatId: string }) => {
        const { message, chatId } = data;
        console.log(`Received message for chat ${chatId}: ${message.substring(0, 50)}...`);
        let sessionData = activeChatSessions.get(socket.id);
        
        if (!sessionData || sessionData.dbId !== chatId) {
            console.log(`Reinitializing session for socket ${socket.id}`);
            const success = await initializeChatSession(socket.id, chatId, model);
            if (!success) {
                return socket.emit('receiveMessage', { content: "Sorry, I couldn't connect to this chat.", chatId });
            }
            sessionData = activeChatSessions.get(socket.id)!;
        }

        try {
            await Chat.findByIdAndUpdate(chatId, { $push: { messages: { role: 'user', content: message } } });
            
            const chatRecord = await Chat.findById(chatId);
            if (chatRecord && chatRecord.messages.length === 1) {
                const newTitle = await generateChatTitle(message);
                await Chat.findByIdAndUpdate(chatId, { title: newTitle });
                socket.emit('titleUpdated', { chatId, newTitle });
            }

            console.log(`Sending message to Gemini...`);
            const result = await sessionData.chat.sendMessage(message); 
            const aiText = result.response.text();
            console.log(`Received response from Gemini: ${aiText.substring(0, 50)}...`);
            
            await Chat.findByIdAndUpdate(chatId, { $push: { messages: { role: 'model', content: aiText } } });
            
            socket.emit('receiveMessage', { content: aiText, chatId });
        } catch (error) {
            console.error("Error in sendMessage:", error);
            socket.emit('receiveMessage', { content: "Sorry, an error occurred. Please try again.", chatId });
        }
    });

    socket.on('disconnect', () => {
        activeChatSessions.delete(socket.id);
        console.log(`User disconnected: ${user.name} (${socket.id})`);
    });
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});