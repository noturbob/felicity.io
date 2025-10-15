"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Inbox, PlusCircle, Smile, Frown, PartyPopper, BrainCircuit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// Mood options for the select component
const moodOptions = [
    { value: "happy", icon: <Smile className="h-5 w-5 text-green-500" />, label: "Happy" },
    { value: "thinking", icon: <BrainCircuit className="h-5 w-5 text-blue-500" />, label: "Thinking" },
    { value: "sad", icon: <Frown className="h-5 w-5 text-red-500" />, label: "Sad" },
    { value: "excited", icon: <PartyPopper className="h-5 w-5 text-yellow-500" />, label: "Excited" },
];

// Placeholder for past grievances
const pastGrievances: { id: number, subject: string, status: string }[] = [];

export default function SupportPage() {
    const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

  return (
    <div className="flex flex-col gap-8">
      <motion.div
        className="text-center"
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.5 }}
        variants={FADE_IN_VARIANTS}
      >
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          Grievance Portal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Your space to share concerns, ask for help, or just vent.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* SUBMIT FORM (LEFT) */}
        <motion.div
            className="lg:col-span-2"
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.2 }}
            variants={FADE_IN_VARIANTS}
        >
            <Card>
                <CardHeader>
                  <CardTitle>Submit a New Grievance</CardTitle>
                  <CardDescription>
                    Please describe your issue in detail. I'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="grid w-full items-center gap-1.5 md:col-span-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input type="text" id="subject" placeholder="e.g., Feeling stressed about exams" />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="mood">Mood (Optional)</Label>
                         <Select onValueChange={setSelectedMood} value={selectedMood}>
                            <SelectTrigger id="mood">
                                <SelectValue placeholder={
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <PlusCircle className="h-4 w-4" />
                                        <span>Select a mood</span>
                                    </div>
                                }>
                                    {selectedMood ? (
                                        <div className="flex items-center gap-2">
                                            {moodOptions.find(m => m.value === selectedMood)?.icon}
                                            <span>{moodOptions.find(m => m.value === selectedMood)?.label}</span>
                                        </div>
                                    ) : ( "Select a mood" )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {moodOptions.map((mood) => (
                                    <SelectItem key={mood.value} value={mood.value}>
                                        <div className="flex items-center gap-2">
                                            {mood.icon}
                                            <span>{mood.label}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </div>
                  </div>
                  <div className="grid w-full gap-1.5">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea placeholder="Type your message here." id="message" rows={6}/>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                    <Button>Submit</Button>
                </CardFooter>
            </Card>
        </motion.div>
        
        {/* PAST GRIEVANCES (RIGHT) */}
        <motion.div
            key="grievance-list"
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.5, delay: 0.4 }}
            variants={FADE_IN_VARIANTS}
        >
          <Card>
            <CardHeader>
              <CardTitle>Past Grievances</CardTitle>
            </CardHeader>
            <CardContent>
                {pastGrievances.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {pastGrievances.map((item) => (
                            <div key={item.id} className="flex justify-between items-center rounded-lg border p-3">
                                <p className="text-sm font-medium">{item.subject}</p>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${item.status === "Resolved" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty className="py-12 border-2 border-dashed rounded-lg">
                      <EmptyHeader>
                        <EmptyMedia>
                          <Inbox className="h-10 w-10 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No Grievances Yet</EmptyTitle>
                        <EmptyDescription>
                          Your past submissions will appear here after you send one.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

