"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Inbox, Frown, PartyPopper, BrainCircuit, Smile } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// Type definition for a grievance
interface Grievance {
  _id: string;
  subject: string;
  message: string;
  mood?: string;
  status: string;
  response?: string | null;
  createdAt: string;
}

// FIX 1: Changed type from { [key: string]: JSX.Element } to the correct Record<string, React.ReactNode>
const moodIcons: Record<string, React.ReactNode> = {
    happy: <Smile className="h-5 w-5 text-green-500" />,
    thinking: <BrainCircuit className="h-5 w-5 text-blue-500" />,
    sad: <Frown className="h-5 w-5 text-red-500" />,
    excited: <PartyPopper className="h-5 w-5 text-yellow-500" />,
};

// FIX 2: Use the environment variable to ensure proper routing on Vercel/Render
const API_URL = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/grievances`;


export default function ResponsesPage() {
    const [grievances, setGrievances] = useState<Grievance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGrievances = async () => {
          const token = localStorage.getItem('token');
          if (!token) return;
          try {
            // FIX 3: Use the dynamic API URL constant
            const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setGrievances(data);
          } catch (error) {
            console.error("Failed to fetch grievances", error);
          } finally {
            setIsLoading(false);
          }
        };
        fetchGrievances();
    }, []);

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

  return (
    <div className="flex flex-col gap-8 h-full">
      <motion.div
        className="text-center"
        initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}
      >
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          My Grievance History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Here you can view your past grievances and my responses.
        </p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-6"
        initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
      >
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading history...</div>
        ) : grievances.length > 0 ? (
          grievances.map((item) => (
            <Card key={item._id}>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{item.subject}</CardTitle>
                            {item.mood && moodIcons[item.mood] && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                    {moodIcons[item.mood]}
                                    <span>{item.mood.charAt(0).toUpperCase() + item.mood.slice(1)}</span>
                                </div>
                            )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${item.status === "Responded" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {item.status}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap border-l-2 pl-4">
                        {item.message}
                    </p>

                    {item.response && (
                        <>
                            <Separator className="my-4" />
                            <div>
                                <h4 className="text-sm font-semibold mb-2">My Response:</h4>
                                <p className="text-sm text-foreground bg-accent/50 p-4 rounded-md whitespace-pre-wrap">
                                    {item.response}
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
          ))
        ) : (
            <Empty className="py-24 border-2 border-dashed rounded-lg">
                <EmptyHeader>
                    <EmptyMedia><Inbox className="h-10 w-10 text-muted-foreground"/></EmptyMedia>
                    <EmptyTitle>No Grievances Found</EmptyTitle>
                    <EmptyDescription>Your submission history will appear here.</EmptyDescription>
                </EmptyHeader>
            </Empty>
        )}
      </motion.div>
    </div>
  );
}
