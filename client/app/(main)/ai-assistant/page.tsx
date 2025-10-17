"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Send, Sparkles, PlusCircle, Paperclip, History, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import io, { Socket } from "socket.io-client";
import { useUser } from "@/context/UserContext";

// --- Type Definitions ---
interface Message { role: "user" | "model"; content: string; }
interface ChatSessionInfo { id: string; title: string; }

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8080";
const API_URL = `${SERVER_URL}/api/chats`;

export default function PersonalAIPage(): React.ReactElement {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSessionInfo[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAITyping, setIsAITyping] = useState<boolean>(false);

  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingMessageRef = useRef<string | null>(null);

  const loadChatMessages = useCallback(async (chatId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/${chatId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch messages");
      const messages: Message[] = await res.json();
      setCurrentMessages(messages);
      setCurrentChatId(chatId);
      socketRef.current?.emit("joinChat", chatId);
    } catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  }, []);

  const fetchChatList = useCallback(async (loadLatest = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch chat list");
      const data: ChatSessionInfo[] = await res.json();
      setChatHistory(data);
      if (data.length > 0 && loadLatest) {
        await loadChatMessages(data[0].id);
      } else if (data.length === 0) {
        setCurrentChatId(null);
        setCurrentMessages([]);
        setIsLoading(false);
      }
      return data;
    } catch (error) { 
      console.error(error); 
      setIsLoading(false);
      return [];
    }
  }, [loadChatMessages]);

  const handleCreateNewChat = useCallback(() => {
    if (!socketRef.current?.connected) return;
    setIsLoading(true);
    setCurrentMessages([]);
    setCurrentChatId(null);
    socketRef.current.emit("createNewChat");
  }, []);

  // --- STABLE WebSocket Connection ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/authenticate'; return; }

    const socket = io(SERVER_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    const onConnect = () => { console.log("Socket connected, fetching initial data."); fetchChatList(true); };
    
    const onReceiveMessage = (data: { content: string; chatId: string }) => {
      if (data.chatId === socketRef.current?.auth.chatId) {
        setCurrentMessages((prev) => [...prev, { role: "model", content: data.content }]);
      }
      setIsAITyping(false);
      fetchChatList();
    };

    const onChatCreated = (newChatId: string) => {
      console.log("Server confirmed chat created:", newChatId);
      setCurrentChatId(newChatId);
      setIsLoading(false);
      socket.emit("joinChat", newChatId);
      
      if (pendingMessageRef.current) {
        const msg = pendingMessageRef.current;
        pendingMessageRef.current = null;
        setCurrentMessages([{ role: 'user', content: msg }]);
        socket.emit("sendMessage", { message: msg, chatId: newChatId });
        setIsAITyping(true);
      }
      fetchChatList();
    };

    const onTitleUpdated = (data: { chatId: string; newTitle: string }) => {
      setChatHistory((p) => p.map((c) => (c.id === data.chatId ? { ...c, title: data.newTitle } : c)));
    };
    
    socket.on("connect", onConnect);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("chatCreated", onChatCreated);
    socket.on("titleUpdated", onTitleUpdated);
    socket.on("disconnect", () => console.log("Socket disconnected."));

    return () => {
      console.log("Cleaning up socket connection.");
      socket.disconnect();
    };
  }, [fetchChatList, loadChatMessages]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.auth = { ...socketRef.current.auth, chatId: currentChatId };
    }
  }, [currentChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAITyping) return;

    const messageToSend = input.trim();
    setInput("");

    if (!currentChatId) {
      pendingMessageRef.current = messageToSend;
      handleCreateNewChat();
      return;
    }

    const userMessage: Message = { role: "user", content: messageToSend };
    setCurrentMessages((prev) => [...prev, userMessage]);
    socketRef.current?.emit("sendMessage", { message: messageToSend, chatId: currentChatId });
    setIsAITyping(true);
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [currentMessages, isAITyping]);
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`; } }, [input]);
  
  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) console.log("Selected file:", file.name); };
  const getUserInitials = () => { if (!user?.name) return "U"; const n = user.name.split(" "); return n.length > 1 ? `${n[0][0]}${n[1][0]}`.toUpperCase() : user.name.substring(0, 2).toUpperCase(); };
  
  const FADE_IN_VARIANTS = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  const ChatHistoryContent = (): React.ReactElement => (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">History</h2>
        <Button variant="ghost" size="icon" onClick={handleCreateNewChat} disabled={isLoading}><PlusCircle className="h-5 w-5" /><span className="sr-only">New Chat</span></Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {chatHistory.length > 0 ? chatHistory.map((chat) => (<Button key={chat.id} variant={currentChatId === chat.id ? "secondary" : "ghost"} className="w-full justify-start truncate" onClick={() => loadChatMessages(chat.id)} disabled={isLoading}>{chat.title}</Button>)) : <div className="text-center text-sm text-muted-foreground p-4">No chats yet.</div>}
      </div>
    </div>
  );

  return (
    // FIX: Main container ensures the layout doesn't exceed screen height
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto px-3 sm:px-4">
      <motion.div initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS} className="text-center mb-4 sm:mb-6 shrink-0">
        <div className="absolute top-0 left-0 md:hidden"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon"><History className="h-4 w-4" /><span className="sr-only">View History</span></Button></SheetTrigger><SheetContent side="left" className="p-0 w-full max-w-sm"><ChatHistoryContent /></SheetContent></Sheet></div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 bg-clip-text text-transparent">Personal AI Assistant</h1>
        <p className="text-muted-foreground mt-2 text-xs sm:text-sm md:text-base">Your creative partner for ideas, questions, and more.</p>
      </motion.div>
      {/* FIX: Grid now has min-h-0 to allow children to scroll correctly */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 flex-1 min-h-0">
        <motion.div className="hidden md:flex flex-col min-h-0" initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}><Card className="h-full flex flex-col"><ChatHistoryContent /></Card></motion.div>
        {/* FIX: Chat area now correctly constrained */}
        <motion.div className="flex flex-col min-h-0" initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}>
          <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-2">
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 scroll-smooth">
              {isLoading && currentMessages.length === 0 ? (<div className="flex items-center justify-center h-full"><div className="text-center"><Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-pink-500 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Loading...</p></div></div>) : currentMessages.length === 0 ? (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full text-center px-4"><div className="relative mb-6"><div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full" /><Sparkles className="relative h-16 w-16 sm:h-20 sm:w-20 text-pink-500 animate-pulse" /></div><h3 className="text-lg sm:text-xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Start a conversation</h3><p className="text-sm sm:text-base text-muted-foreground max-w-md">Ask me anything! I&apos;m here to help with creative ideas, questions, and conversations.</p></motion.div>) : (<AnimatePresence initial={false}>{currentMessages.map((message, idx) => (<motion.div key={idx} initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3 }} className={cn("flex items-start gap-2 sm:gap-3", { "justify-end": message.role === "user" })}>{message.role === "model" && (<Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 ring-2 ring-pink-500/20"><div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" /></div></Avatar>)}{<div className={cn("max-w-[80%] sm:max-w-[75%] md:max-w-lg lg:max-w-xl p-3 sm:p-4 rounded-2xl whitespace-pre-wrap break-words shadow-md", { "bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-br-sm": message.role === "user", "bg-muted rounded-bl-sm": message.role === "model" })}><p className="text-sm sm:text-base leading-relaxed">{message.content}</p></div>}{message.role === "user" && (<Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 ring-2 ring-pink-500/20"><AvatarImage src={user?.avatar} alt={user?.name} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs sm:text-sm font-bold">{getUserInitials()}</AvatarFallback></Avatar>)}</motion.div>))}{isAITyping && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-2 sm:gap-3"><Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-2 ring-pink-500/20"><div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500"><Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" /></div></Avatar><div className="bg-muted p-3 sm:p-4 rounded-2xl rounded-bl-sm"><div className="flex gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" /><span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} /><span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} /></div></div></motion.div>)}</AnimatePresence>)}<div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form onSubmit={handleSendMessage} className="w-full flex items-end gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" /><Button type="button" variant="ghost" size="icon" onClick={handleFileButtonClick} className="flex-shrink-0 hover:bg-pink-500/10" disabled={isAITyping}><Paperclip className="h-4 w-4 sm:h-5 sm:w-5" /><span className="sr-only">Attach file</span></Button>
                <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Felicity..." className="flex-1 resize-none min-h-[40px] max-h-[120px] text-sm sm:text-base" rows={1} disabled={isAITyping} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} />
                <Button type="submit" size="icon" disabled={!input.trim() || isAITyping} className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-pink-500/50">{isAITyping ? (<Loader2 className="h-4 w-4 animate-spin" />) : (<Send className="h-4 w-4" />)}</Button>
              </form>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}