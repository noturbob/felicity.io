"use client";

import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Send, Smile, Frown, PartyPopper, BrainCircuit, Cake, Video, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Data for the mood selector dropdown
const moodOptions = [
    { value: "happy", icon: <Smile className="h-5 w-5 text-green-500" />, label: "Happy" },
    { value: "thinking", icon: <BrainCircuit className="h-5 w-5 text-blue-500" />, label: "Thinking" },
    { value: "sad", icon: <Frown className="h-5 w-5 text-red-500" />, label: "Sad" },
    { value: "excited", icon: <PartyPopper className="h-5 w-5 text-yellow-500" />, label: "Excited" },
];

// Define the type for the dialog keys to ensure type safety
type DialogKey = 'birthday' | 'video' | 'love';

// Data for the carousel items
const carouselItems: { key: DialogKey; icon: React.ReactNode; title: string }[] = [
    { key: 'birthday', icon: <Cake className="h-10 w-10 text-pink-500"/>, title: "A Message" },
    { key: 'video', icon: <Video className="h-10 w-10 text-pink-500"/>, title: "A Moment" },
    { key: 'love', icon: <Heart className="h-10 w-10 text-pink-500"/>, title: "A Reminder" },
];

export default function HomePage() {
    const { user, isLoading } = useUser();
    const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);
    const [dialogKey, setDialogKey] = useState<DialogKey | null>(null);
    
    const autoplayPlugin = useRef(Autoplay({ delay: 4000, stopOnInteraction: true }));

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Hello";
        if (hour < 18) return "Good Afternoon";
        return "Good Evening";
    };

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };
    
    const renderSelectedMoodIcon = () => {
        const mood = moodOptions.find(option => option.value === selectedMood);
        return <span>{mood ? mood.icon : <Plus className="h-5 w-5" />}</span>;
    };

    return (
        <>
            <div className="flex flex-col gap-10 sm:gap-16">
                {/* Centered Gradient Greeting */}
                <motion.div
                    className="text-center"
                    initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}
                >
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-800 dark:text-gray-200">
                        {getGreeting()},
                    </h1>
                    <span className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                        {isLoading ? "..." : `${user?.name.split(" ")[0]}!`}
                    </span>
                    <motion.p
                        className="mt-4 text-sm sm:text-base text-muted-foreground italic max-w-md mx-auto"
                        initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={FADE_IN_VARIANTS}
                    >
                        "The secret of getting ahead is getting started."
                    </motion.p>
                </motion.div>

                {/* Carousel Section with Triggers */}
                <motion.div
                    className="w-full flex justify-center"
                    initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
                >
                    <Carousel 
                        className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg"
                        plugins={[autoplayPlugin.current]}
                        onMouseEnter={autoplayPlugin.current.stop}
                        onMouseLeave={autoplayPlugin.current.reset}
                        opts={{ loop: true }}
                    >
                        <CarouselContent>
                            {carouselItems.map((item) => (
                                <CarouselItem key={item.key} className="basis-1/2 sm:basis-1/3">
                                    <div className="p-1">
                                        <Card 
                                            className="bg-pink-50/50 dark:bg-pink-950/20 transition-all hover:brightness-95 cursor-pointer rounded-lg"
                                            onClick={() => setDialogKey(item.key)}
                                        >
                                            <CardContent className="flex flex-col gap-2 aspect-square items-center justify-center p-4">
                                                {item.icon}
                                                <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">{item.title}</span>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </motion.div>
                
                {/* Glassmorphism Textarea Section */}
                <motion.div
                    className="mt-4"
                    initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}
                >
                    <div className="relative w-full max-w-3xl mx-auto">
                        <Select onValueChange={setSelectedMood} value={selectedMood}>
                            <SelectTrigger className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 h-9 w-9 rounded-full bg-transparent border-0 z-10 p-0 flex items-center justify-center text-pink-300 hover:text-pink-100">
                                <SelectValue>{renderSelectedMoodIcon()}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="[&_[data-radix-select-item-indicator]]:hidden">
                                {moodOptions.map((mood) => (
                                    <SelectItem key={mood.value} value={mood.value} className="justify-center">
                                        <div className="flex items-center gap-2">{mood.icon}<span>{mood.label}</span></div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Please let me hear your thoughts..."
                            className="flex items-center justify-center min-h-[43px] w-full resize-none rounded-full border border-pink-500/20 bg-pink-500/10 px-14 py-2 text-center text-base backdrop-blur-sm placeholder:text-pink-500/70 placeholder:text-sm sm:placeholder:text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-100 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 sm:px-16"
                            rows={1}
                        />
                        <Button size="icon" className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 h-9 w-9 rounded-full shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 transition-shadow z-10">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
                </motion.div>
            </div>

            {/* A SINGLE DIALOG TO RULE THEM ALL */}
            <AlertDialog open={dialogKey !== null} onOpenChange={(open) => !open && setDialogKey(null)}>
                <AlertDialogContent>
                    {dialogKey === 'birthday' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Happy Birthday, My Love!</AlertDialogTitle>
                                <AlertDialogDescription>A special message, just for you.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <p className="py-4 text-center text-lg">"Happy Birthday Bhumika! I hope you have a day as amazing as you are. I love you more than words can say."</p>
                        </>
                    )}
                    {dialogKey === 'video' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle>A Special Moment</AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="aspect-video overflow-hidden rounded-md mt-4">
                                <iframe
                                    className="w-full h-full"
                                    src="https://www.youtube.com/embed/k37QvhAyA2Y" // FIX: Corrected YouTube embed link
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </>
                    )}
                    {dialogKey === 'love' && (
                        <>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-center">Just a Quick Reminder...</AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className="flex items-center justify-center py-12">
                                <h2 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                                    I LOVE YOU!
                                </h2>
                            </div>
                        </>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}