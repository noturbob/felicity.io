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

const SERVER_URL = "http://localhost:8080";
const API_URL = "http://localhost:8080/api/chats";

export default function PersonalAIPage(): React.ReactElement {
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatSessionInfo[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start with loading true

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // --- API/Data Fetching ---
  const loadChatMessages = useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/${chatId}`);
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

  const fetchChatList = useCallback(async (loadLatest = false) => {
    try {
      const res = await fetch(API_URL);
      const data: ChatSessionInfo[] = await res.json();
      setChatHistory(data);

      if (data.length > 0 && loadLatest) {
        await loadChatMessages(data[0].id);
      } else if (data.length === 0) {
        setCurrentChatId(null);
        setCurrentMessages([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch chat list:", error);
    }
  }, [loadChatMessages]);

  // --- FIX: This is the simplified, correct function ---
  const handleCreateNewChat = () => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error("Socket not connected. Cannot create new chat.");
      return;
    }
    setIsLoading(true);
    setCurrentMessages([]);
    setCurrentChatId(null);
    // Just emit the event. The 'chatCreated' listener will handle the rest.
    socketRef.current.emit("createNewChat");
  };

  // --- WebSocket Connection ---
  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected, fetching initial data.");
      fetchChatList(true); // Fetch list and load the latest chat on connect
    });

    socket.on("receiveMessage", (data: { content: string; chatId: string }) => {
      // Use function form of setState to access the most recent currentChatId
      setCurrentChatId((prevChatId) => {
        if (data.chatId === prevChatId) {
          setCurrentMessages((prev) => [...prev, { role: "model", content: data.content }]);
        }
        return prevChatId;
      });
      setIsLoading(false);
      fetchChatList();
    });

    // --- FIX: This listener correctly handles the response from the server ---
    socket.on("chatCreated", (newChatId: string) => {
      console.log("Server confirmed chat created:", newChatId);
      setCurrentChatId(newChatId);
      setCurrentMessages([]);
      setIsLoading(false);
      socket.emit("joinChat", newChatId);
      fetchChatList(); // Refresh the sidebar
    });

    socket.on("titleUpdated", (data: { chatId: string; newTitle: string }) => {
      setChatHistory((prev) =>
        prev.map((chat) => (chat.id === data.chatId ? { ...chat, title: data.newTitle } : chat))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchChatList]); // useEffect runs once to set up listeners

  // --- Message Sending ---
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentChatId) return;

    const userMessage: Message = { role: "user", content: input };
    setCurrentMessages((prev) => [...prev, userMessage]);

    socketRef.current?.emit("sendMessage", { message: input, chatId: currentChatId });
    setInput("");
    setIsLoading(true);
  };

  // --- Other UI Handlers ---
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        <Button variant="ghost" size="icon" onClick={handleCreateNewChat} disabled={isLoading}>
          <PlusCircle className="h-5 w-5" />
          <span className="sr-only">New Chat</span>
        </Button>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {chatHistory.length > 0 ? (
          chatHistory.map((chat) => (
            <Button
              key={chat.id}
              variant={currentChatId === chat.id ? "default" : "ghost"}
              className="justify-start truncate"
              onClick={() => loadChatMessages(chat.id)}
              disabled={isLoading}
            >
              {chat.title}
            </Button>
          ))
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            No chats yet. Start one!
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Header */}
      <motion.div
        className="text-center mb-8 relative"
        initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}
      >
        <div className="absolute top-0 left-0 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <History className="h-4 w-4" /><span className="sr-only">View Chat History</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="sr-only">Chat History</SheetTitle>
              </SheetHeader>
              <ChatHistoryContent />
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="text-5xl font-extrabold ...">Personal AI Assistant</h1>
        <p className="text-gray-500 ...">Your creative partner...</p>
      </motion.div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 flex-1">
        {/* Sidebar (Desktop) */}
        <motion.div
          className="hidden md:flex flex-col gap-4"
          initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
        >
          <Card className="h-full">
            <CardContent className="pt-6"><ChatHistoryContent /></CardContent>
          </Card>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          className="flex-1"
          initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}
        >
          <Card className="h-full flex flex-col overflow-hidden">
            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {isLoading && currentMessages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-pink-500 animate-pulse">Loading...</span>
                </div>
              ) : !currentChatId && chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 text-pink-400 mb-4" />
                  <h3 className="font-semibold">Start your first conversation</h3>
                  <p className="text-sm">Ask Felicity anything about your studies or just for fun.</p>
                  <Button className="mt-4" onClick={handleCreateNewChat} disabled={isLoading}>
                    Start Chat
                  </Button>
                </div>
              ) : currentMessages.length === 0 && currentChatId ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <h3 className="font-semibold">Chat Ready</h3>
                  <p className="text-sm">Type your first message to begin!</p>
                </div>
              ) : (
                currentMessages.map((message, index) => (
                  <div key={index} className={cn("flex items-start gap-3", { "justify-end": message.role === "user" })}>
                    {message.role === "model" && (
                      <Avatar className="h-8 w-8">
                        <div className="h-full w-full flex items-center justify-center bg-pink-500 rounded-full">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                      </Avatar>
                    )}
                    <div className={cn("max-w-xs ... p-3 ...", { "bg-primary ...": message.role === "user", "bg-muted": message.role === "model" })}>
                      {message.content}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://github.com/shadcn.png" alt="@bhumika" />
                        <AvatarFallback>B</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}

              {isLoading && currentMessages.length > 0 && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <div className="h-full w-full flex ... bg-pink-500 ...">
                      <Sparkles className="h-5 w-5 text-white animate-pulse" />
                    </div>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-xl">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input Footer */}
            <CardFooter className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="w-full flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button type="button" variant="ghost" size="icon" onClick={handleFileButtonClick} disabled={!currentChatId}>
                  <Paperclip className="h-5 w-5" /><span className="sr-only">Attach file</span>
                </Button>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={currentChatId ? "Ask Felicity..." : "Click '+' to begin."}
                  className="flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  disabled={isLoading || !currentChatId}
                />
                <Button type="submit" size="icon" disabled={isLoading || !currentChatId}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}