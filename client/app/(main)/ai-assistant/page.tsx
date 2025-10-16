"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send, Sparkles, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import io, { Socket } from "socket.io-client";

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

// Dynamic URLs: local for dev, production from environment variables
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:8080";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/chats";

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

  const fetchWithAuth = async (url: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    return res.json();
  };

  const loadChatMessages = useCallback(async (chatId: string) => {
    try {
      const messages: Message[] = await fetchWithAuth(`${API_URL}/${chatId}`);
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
    try {
      const chats: ChatSessionInfo[] = await fetchWithAuth(API_URL);
      setChatHistory(chats);
      return chats;
    } catch (error) {
      console.error("Failed to fetch chat list:", error);
      return [];
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      const userData: User = await fetchWithAuth(`${SERVER_URL}/api/users/profile`);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }, []);

  const handleCreateNewChat = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) return;
    setIsCreatingChat(true);
    setCurrentMessages([]);
    setCurrentChatId(null);
    setIsLoading(true);
    socketRef.current.emit("createNewChat");
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/authenticate";
      return;
    }

    const socket = io(SERVER_URL, { auth: { token } });
    socketRef.current = socket;

    const onConnect = async () => {
      await fetchUserProfile();
      const chats = await fetchChatList();
      if (chats && chats.length > 0) await loadChatMessages(chats[0].id);
      else setIsLoading(false);
    };

    socket.on("connect", onConnect);
    socket.on("receiveMessage", (data: { content: string; chatId: string }) => {
      if (data.chatId === currentChatId) {
        setCurrentMessages(prev => [...prev, { role: "model", content: data.content }]);
      }
    });

    return () => socket.disconnect();
  }, [fetchChatList, fetchUserProfile, loadChatMessages, currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages]);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading || isCreatingChat) return;

    const messageToSend = input.trim();
    setInput("");

    if (!currentChatId) {
      pendingMessageRef.current = messageToSend;
      handleCreateNewChat();
      return;
    }

    setCurrentMessages(prev => [...prev, { role: "user", content: messageToSend }]);
    socketRef.current?.emit("sendMessage", { message: messageToSend, chatId: currentChatId });
    setIsLoading(true);
  };

  const handleFileButtonClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) console.log("Selected file:", file.name);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <motion.div className="text-center mb-4 sm:mb-6 relative">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          Personal AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Your creative partner for ideas, questions, and more.
        </p>
      </motion.div>

      <div className="flex-1">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
            {currentMessages.map((message, idx) => (
              <div key={idx} className={cn("flex items-start gap-3", { "justify-end": message.role === "user" })}>
                {message.role === "model" && (
                  <Avatar className="h-8 w-8">
                    <div className="h-full w-full flex items-center justify-center bg-pink-500 rounded-full">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl whitespace-pre-wrap",
                  { "bg-primary text-primary-foreground": message.role === "user", "bg-muted": message.role === "model" }
                )}>
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="p-2 border-t sm:p-4">
            <form
              onSubmit={e => { e.preventDefault(); handleSendMessage(); }}
              className="w-full flex items-center gap-2"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <Button type="button" variant="ghost" size="icon" onClick={handleFileButtonClick}>
                <Paperclip className="h-5 w-5" /><span className="sr-only">Attach file</span>
              </Button>
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask Felicity..."
                className="flex-1 resize-none"
                rows={1}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              />
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}