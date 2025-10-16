"use client";

import { useState, useEffect } from "react";
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
  EmptyContent,
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
  response?: string;
  createdAt: string;
}

const moodOptions = [
    { value: "happy", icon: <Smile className="h-5 w-5 text-green-500" />, label: "Happy" },
    { value: "thinking", icon: <BrainCircuit className="h-5 w-5 text-blue-500" />, label: "Thinking" },
    { value: "sad", icon: <Frown className="h-5 w-5 text-red-500" />, label: "Sad" },
    { value: "excited", icon: <PartyPopper className="h-5 w-5 text-yellow-500" />, label: "Excited" },
];

const API_URL = "http://localhost:8080/api/grievances";

export default function SupportPage() {
    const [isCreating, setIsCreating] = useState(false);
    const [pastGrievances, setPastGrievances] = useState<Grievance[]>([]);
    
    // Form state
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
    
    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(""); // State for displaying errors

    const fetchGrievances = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setPastGrievances(data);
      } catch (error) {
        console.error("Failed to fetch grievances", error);
      } finally {
        setIsLoading(false);
      }
    };

    useEffect(() => {
        fetchGrievances();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError(""); // Reset error on new submission

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, message, mood: selectedMood }),
        });
        
        const data = await res.json();
        if (!res.ok) {
          // If server returns an error, display it
          throw new Error(data.message || 'An error occurred.');
        }

        // Reset form and state on success
        setSubject("");
        setMessage("");
        setSelectedMood(undefined);
        setIsCreating(false);
        fetchGrievances(); // Refetch grievances to show the new one

      } catch (err: any) {
        setError(err.message); // Set the error message to be displayed
      } finally {
        setIsSubmitting(false);
      }
    };

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

  return (
    <div className="flex flex-col gap-8">
      <motion.div
        className="text-center"
        initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}
      >
        <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          Grievance Portal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Your space to share concerns, ask for help, or just vent.
        </p>
      </motion.div>

      {isCreating ? (
        <motion.div
            key="create-form"
            initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
            className="max-w-4xl w-full mx-auto"
        >
            <form onSubmit={handleSubmit}>
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
                          <Input type="text" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Feeling stressed about exams" required/>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="mood">Mood (Optional)</Label>
                          <Select onValueChange={setSelectedMood} value={selectedMood}>
                              <SelectTrigger id="mood">
                                  <SelectValue placeholder={ <div className="flex items-center gap-2 text-muted-foreground"> <PlusCircle className="h-4 w-4" /> <span>Select a mood</span> </div> }>
                                      {selectedMood ? ( <div className="flex items-center gap-2"> {moodOptions.find(m => m.value === selectedMood)?.icon} <span>{moodOptions.find(m => m.value === selectedMood)?.label}</span> </div> ) : ( "Select a mood" )}
                                  </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                  {moodOptions.map((mood) => ( <SelectItem key={mood.value} value={mood.value}> <div className="flex items-center gap-2"> {mood.icon} <span>{mood.label}</span> </div> </SelectItem> ))}
                              </SelectContent>
                          </Select>
                        </div>
                    </div>
                    <div className="grid w-full gap-1.5">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea placeholder="Type your message here." id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} required/>
                    </div>
                  </CardContent>
                  <CardFooter className="flex-col items-end gap-2">
                      {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
                      <div className="flex gap-2">
                        <Button variant="ghost" type="button" onClick={() => setIsCreating(false)} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Submitting..." : "Submit"}
                        </Button>
                      </div>
                  </CardFooter>
              </Card>
            </form>
        </motion.div>
      ) : (
        <motion.div
            key="grievance-list"
            initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
            className="max-w-4xl w-full mx-auto"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Past Grievances</CardTitle>
              {pastGrievances.length > 0 && (
                <Button size="sm" onClick={() => setIsCreating(true)}>
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Create New
                </Button>
              )}
            </CardHeader>
            <CardContent>
                {isLoading ? <p className="text-center text-muted-foreground">Loading grievances...</p> : pastGrievances.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {pastGrievances.map((item) => (
                            <div key={item._id} className="flex justify-between items-center rounded-lg border p-3">
                                <p className="text-sm font-medium truncate pr-4">{item.subject}</p>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${item.status === "Responded" ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Empty className="py-12">
                      <EmptyHeader>
                        <EmptyMedia>
                          <Inbox className="h-10 w-10 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No Grievances Yet</EmptyTitle>
                        <EmptyDescription>
                          You haven&apos;t submitted any grievances. Get started by creating your first one.
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button onClick={() => setIsCreating(true)}>Create Grievance</Button>
                      </EmptyContent>
                    </Empty>
                )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

