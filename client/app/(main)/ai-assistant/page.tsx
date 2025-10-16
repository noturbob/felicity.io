"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Send, Sparkles, PlusCircle, Paperclip, History } from "lucide-react";
import { cn } from "@/lib/utils";
import io, { Socket } from "socket.io-client";

// --- Type Definitions ---
interface Message {
  role: "user" | "model";
  content: string;
}
interface ChatSessionInfo {
  id: string;
  title: string;
  lastMessageTime: string;
}
interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

const SERVER_URL = "http://localhost:8080";
const API_URL = "http://localhost:8080/api/chats";

export default function PersonalAIPage(): React.ReactElement {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSessionInfo[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingChat, setIsCreatingChat] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);
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
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchChatList = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch chat list");
      const data: ChatSessionInfo[] = await res.json();
      setChatHistory(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch chat list:", error);
      return [];
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/users/profile`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error("Failed to fetch user profile");
      const userData: User = await res.json();
      setUser(userData);
      console.log("User profile loaded:", userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, []);

  const handleCreateNewChat = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
        console.error("Socket not connected. Cannot create new chat.");
        return;
    }
    setIsCreatingChat(true);
    setCurrentMessages([]);
    setCurrentChatId(null);
    setIsLoading(true);
    socketRef.current.emit("createNewChat");
  }, []);

  // --- WebSocket Connection ---
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/authenticate';
      return;
    }

    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    const onConnect = async () => {
      console.log("Socket connected, fetching initial data.");
      await fetchUserProfile(); // Fetch user profile first
      const chats = await fetchChatList();
      if (chats && chats.length > 0) {
        await loadChatMessages(chats[0].id);
      } else {
        setIsLoading(false);
      }
    };

    const onReceiveMessage = (data: { content: string; chatId: string }) => {
      if (data.chatId === currentChatId) {
        setCurrentMessages((prev) => [...prev, { role: "model", content: data.content }]);
      }
      setIsLoading(false);
      fetchChatList();
    };

    const onChatCreated = async (newChatId: string) => {
      console.log("Server confirmed chat created:", newChatId);
      setCurrentChatId(newChatId);
      setCurrentMessages([]);
      setIsCreatingChat(false);
      setIsLoading(false);
      socket.emit("joinChat", newChatId);
      await fetchChatList();
      
      // Send pending message if exists
      if (pendingMessageRef.current) {
        const messageToSend = pendingMessageRef.current;
        pendingMessageRef.current = null;
        const userMessage: Message = { role: "user", content: messageToSend };
        setCurrentMessages([userMessage]);
        socket.emit("sendMessage", { message: messageToSend, chatId: newChatId });
        setIsLoading(true);
      }
    };

    const onTitleUpdated = (data: { chatId: string; newTitle: string }) => {
      setChatHistory((prev) =>
        prev.map((chat) => (chat.id === data.chatId ? { ...chat, title: data.newTitle } : chat))
      );
    };

    const onDisconnect = () => console.log("Socket disconnected.");

    socket.on("connect", onConnect);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("chatCreated", onChatCreated);
    socket.on("titleUpdated", onTitleUpdated);
    socket.on("disconnect", onDisconnect);

    return () => {
      console.log("Cleaning up socket connection.");
      socket.off("connect", onConnect);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("chatCreated", onChatCreated);
      socket.off("titleUpdated", onTitleUpdated);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, [fetchChatList, fetchUserProfile]); // Include both dependencies

  // Separate effect to handle currentChatId changes for receiveMessage
  useEffect(() => {
    if (!socketRef.current) return;

    const onReceiveMessage = (data: { content: string; chatId: string }) => {
      if (data.chatId === currentChatId) {
        setCurrentMessages((prev) => [...prev, { role: "model", content: data.content }]);
      }
      setIsLoading(false);
      fetchChatList();
    };

    socketRef.current.off("receiveMessage");
    socketRef.current.on("receiveMessage", onReceiveMessage);

    return () => {
      socketRef.current?.off("receiveMessage", onReceiveMessage);
    };
  }, [currentChatId, fetchChatList]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isCreatingChat) return;

    const messageToSend = input.trim();
    setInput("");

    // If no chat exists, create one and save the message to send after creation
    if (!currentChatId) {
      pendingMessageRef.current = messageToSend;
      handleCreateNewChat();
      return;
    }

    // Send message to existing chat
    const userMessage: Message = { role: "user", content: messageToSend };
    setCurrentMessages((prev) => [...prev, userMessage]);
    socketRef.current?.emit("sendMessage", { message: messageToSend, chatId: currentChatId });
    setIsLoading(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) console.log("Selected file:", file.name);
  };

  const FADE_IN_VARIANTS = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

  const ChatHistoryContent = (): React.ReactElement => (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">History</h2>
        <Button variant="ghost" size="icon" onClick={handleCreateNewChat} disabled={isLoading || isCreatingChat}>
          <PlusCircle className="h-5 w-5" />
          <span className="sr-only">New Chat</span>
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <Button
              key={chat.id}
              variant={currentChatId === chat.id ? "secondary" : "ghost"}
              className="w-full justify-start truncate"
              onClick={() => loadChatMessages(chat.id)}
              disabled={isLoading || isCreatingChat}
            >
              {chat.title}
            </Button>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground p-4">
            No chats yet.
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <motion.div className="text-center mb-4 sm:mb-6 relative" initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}>
        <div className="absolute top-0 left-0 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon"><History className="h-4 w-4" /><span className="sr-only">View Chat History</span></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-full max-w-sm"><ChatHistoryContent /></SheetContent>
          </Sheet>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          Personal AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">Your creative partner for ideas, questions, and more.</p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 flex-1">
        <motion.div className="hidden md:flex flex-col" initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}>
          <Card className="h-full flex flex-col"><ChatHistoryContent /></Card>
        </motion.div>
        <motion.div className="flex-1" initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}>
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {isLoading && currentMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full"><span className="text-pink-500 animate-pulse">Loading...</span></div>
              ) : !currentChatId && chatHistory.length === 0 && !isCreatingChat ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <Sparkles className="h-12 w-12 text-pink-400 mb-4" />
                  <h3 className="font-semibold">Start your first conversation</h3>
                  <p className="text-sm">Ask Felicity anything about your studies or just for fun.</p>
                  <Button className="mt-4" onClick={handleCreateNewChat} disabled={isCreatingChat}>
                    {isCreatingChat ? "Creating..." : "Start Chat"}
                  </Button>
                </div>
              ) : currentMessages.length === 0 && (currentChatId || isCreatingChat) ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <h3 className="font-semibold">{isCreatingChat ? "Creating Chat..." : "Chat Ready"}</h3>
                  <p className="text-sm">{isCreatingChat ? "Please wait..." : "Type your first message to begin!"}</p>
                </div>
              ) : (
                currentMessages.map((message, index) => (
                  <div key={index} className={cn("flex items-start gap-3", { "justify-end": message.role === "user" })}>
                    {message.role === "model" && (<Avatar className="h-8 w-8"><div className="h-full w-full flex items-center justify-center bg-pink-500 rounded-full"><Sparkles className="h-5 w-5 text-white" /></div></Avatar>)}
                    <div className={cn("max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl whitespace-pre-wrap", { "bg-primary text-primary-foreground": message.role === "user", "bg-muted": message.role === "model" })}>{message.content}</div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ec4899&color=fff`} 
                          alt={user?.name || "User"} 
                        />
                        <AvatarFallback className="bg-pink-500 text-white">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              {isLoading && currentMessages.length > 0 && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8"><div className="h-full w-full flex items-center justify-center bg-pink-500 rounded-full"><Sparkles className="h-5 w-5 text-white animate-pulse" /></div></Avatar>
                  <div className="bg-muted p-3 rounded-xl"><span className="animate-pulse">Thinking...</span></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>
            <CardFooter className="p-2 border-t sm:p-4">
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="ghost" size="icon" onClick={handleFileButtonClick} disabled={!currentChatId || isCreatingChat}><Paperclip className="h-5 w-5" /><span className="sr-only">Attach file</span></Button>
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={currentChatId ? "Ask Felicity..." : isCreatingChat ? "Creating chat..." : "Click '+' or 'Start Chat' to begin."} className="flex-1 resize-none" rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e as any); } }} disabled={isLoading || isCreatingChat} />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim() || isCreatingChat}><Send className="h-4 w-4" /></Button>
              </form>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}