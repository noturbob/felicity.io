import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import { GoogleGenerativeAI, ChatSession, GenerativeModel, Content, Part } from '@google/generative-ai';
import { configurePassport } from './config/passport';
import connectDB from './config/db';
import grievanceRoutes from './routes/grievanceRoutes';
import chatRoutes from './routes/chatRoutes';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import Chat from './models/Chats';

// Load environment variables at the very beginning
dotenv.config();

// Connect to Database
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
  methods: ["GET", "POST", "PUT", "DELETE"] // Allow all necessary HTTP methods
};

const io = new SocketIOServer(server, { cors: corsOptions });

app.use(cors(corsOptions));
app.use(express.json());

// --- PASSPORT & AUTH MIDDLEWARE ---
app.use(passport.initialize());
configurePassport();

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/grievances', grievanceRoutes);
app.use('/api/chats', chatRoutes);

// --- GEMINI & WEBSOCKET SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const activeChatSessions = new Map<string, { chat: ChatSession, dbId: string }>();
const BHUMIKA_USER_ID = "bhumika_unique_felicity_user"; // Placeholder

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
            model: "gemini-1.5-flash",
            systemInstruction: "You are a chat titler. Based on the user's message, create a short, concise title (max 5 words) that summarizes the conversation topic. Only respond with the title, nothing else.",
        });
        const result = await titleModel.generateContent(firstMessage);
        return result.response.text().trim().replace(/['".,]/g, '');
    } catch (error) {
        console.error("Error generating chat title:", error);
        return "Chat Topic";
    }
};

const initializeChatSession = async (socketId: string, chatId: string, model: GenerativeModel) => {
    const chatRecord = await Chat.findById(chatId);
    const history = chatRecord ? toGeminiContent(chatRecord.messages || []) : [];
    const chat = model.startChat({ history, generationConfig: { maxOutputTokens: 1000 } });
    activeChatSessions.set(socketId, { chat, dbId: chatId });
    return chat;
};

// --- WEBSOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: "You are Felicity, a kind, supportive, and brilliant AI assistant created for a biotech student named Bhumika...",
    });

    socket.on('joinChat', (chatId: string) => {
        initializeChatSession(socket.id, chatId, model).catch(err => console.error("Failed to join chat session:", err));
    });
    
    socket.on('createNewChat', async () => {
        try {
            const newChatRecord = new Chat({ userId: BHUMIKA_USER_ID, title: "New Chat Session" });
            await newChatRecord.save();
            socket.emit('chatCreated', newChatRecord._id.toString());
            await initializeChatSession(socket.id, newChatRecord._id.toString(), model);
        } catch (error) {
            console.error("Failed to create new chat:", error);
            socket.emit('chatCreationError', 'Could not create a new chat session.');
        }
    });

    socket.on('sendMessage', async (data: { message: string, chatId: string }) => {
        const { message, chatId } = data;
        let sessionData = activeChatSessions.get(socket.id);

        if (!sessionData || sessionData.dbId !== chatId) {
            await initializeChatSession(socket.id, chatId, model);
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

            const result = await sessionData.chat.sendMessage(message); 
            const aiText = result.response.text();

            await Chat.findByIdAndUpdate(chatId, { $push: { messages: { role: 'model', content: aiText } } });

            socket.emit('receiveMessage', { content: aiText, chatId });
        } catch (error) {
            console.error("Error calling Gemini API or saving to DB:", error);
            socket.emit('receiveMessage', { content: "Sorry, an error occurred with the AI.", chatId });
        }
    });

    socket.on('disconnect', () => {
        activeChatSessions.delete(socket.id);
        console.log('User disconnected:', socket.id);
    });
});

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});