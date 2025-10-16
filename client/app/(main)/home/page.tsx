"use client";

import { useUser } from "@/context/UserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Send, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Smile, Frown, PartyPopper, BrainCircuit } from "lucide-react";

// Data for the mood selector dropdown
const moodOptions = [
    { value: "happy", icon: <Smile className="h-5 w-5 text-green-500" />, label: "Happy" },
    { value: "thinking", icon: <BrainCircuit className="h-5 w-5 text-blue-500" />, label: "Thinking" },
    { value: "sad", icon: <Frown className="h-5 w-5 text-red-500" />, label: "Sad" },
    { value: "excited", icon: <PartyPopper className="h-5 w-5 text-yellow-500" />, label: "Excited" },
];

// --- FIX: Create specific types for carousel items ---
interface LinkCarouselItem {
    type: 'link';
    href: string; // Guaranteed to be a string
    icon: React.ReactNode;
    title: string;
}

interface StandardCarouselItem {
    type: 'item';
    title: string;
    href?: undefined; // Explicitly not present or undefined
}

// A union type that represents either a link or a standard item
type CarouselItemData = LinkCarouselItem | StandardCarouselItem;


// Data for the carousel, now using the specific types
const carouselItems: CarouselItemData[] = [
    { type: 'link', href: '/support', icon: <HeartHandshake className="h-10 w-10 text-pink-500"/>, title: "Support" },
    { type: 'item', title: "Item 2" },
    { type: 'item', title: "Item 3" },
];

export default function HomePage() {
    const { user, isLoading } = useUser();
    const [selectedMood, setSelectedMood] = useState<string | undefined>(undefined);

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
        <div className="flex flex-col gap-8 sm:gap-12">
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
                  className="mt-4 text-sm text-muted-foreground sm:text-base italic"
                  initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.1 }} variants={FADE_IN_VARIANTS}
                >
                  "The secret of getting ahead is getting started."
                </motion.p>
            </motion.div>

            {/* Carousel Section */}
            <motion.div
                className="w-full flex justify-center mt-4"
                initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
            >
                <Carousel className="w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                    <CarouselContent>
                        {carouselItems.map((item, index) => (
                            <CarouselItem key={index} className="md:basis-1/3">
                                <div className="p-1">
                                    {/* This 'if' check now acts as a type guard */}
                                    {item.type === 'link' ? (
                                        // TypeScript now knows item.href is a string here, fixing the error.
                                        <Link href={item.href}>
                                            <Card className="hover:bg-pink-50 transition-colors">
                                                <CardContent className="flex flex-col gap-2 aspect-square items-center justify-center p-6 bg-pink-50/50 dark:bg-pink-950/20 rounded-lg">
                                                    {item.icon}
                                                    <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">{item.title}</span>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ) : (
                                        <Card>
                                            <CardContent className="flex aspect-square items-center justify-center p-6 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                                                <span className="text-3xl font-semibold text-pink-600 dark:text-pink-400">{index + 1}</span>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </motion.div>
            
            {/* Glassmorphism Textarea Section */}
             <motion.div
                className="mt-8"
                initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}
            >
                <div className="relative w-full max-w-4xl mx-auto">
                    <Select onValueChange={setSelectedMood} value={selectedMood}>
                        <SelectTrigger className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 h-9 w-9 rounded-full bg-transparent border-0 z-10 p-0 flex items-center justify-center text-pink-300 hover:text-pink-100">
                             <SelectValue>
                                {renderSelectedMoodIcon()}
                             </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="[&_[data-radix-select-item-indicator]]:hidden">
                             {moodOptions.map((mood) => (
                                <SelectItem key={mood.value} value={mood.value} className="justify-center">
                                    <div className="flex items-center gap-2">
                                        {mood.icon}
                                        <span>{mood.label}</span>
                                    </div>
                                </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        placeholder="Please let me hear your thoughts..."
                        className="flex min-h-[50px] w-full resize-none rounded-full border border-pink-500/20 bg-pink-500/10 px-14 py-2 text-center text-base backdrop-blur-sm placeholder:text-pink-500/70 placeholder:text-sm sm:placeholder:text-base focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-100 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 sm:px-16"
                        rows={1}
                    />
                    <Button size="icon" className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 h-9 w-9 rounded-full shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/30 transition-shadow z-10">
                        <Send className="h-4 w-4" />
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}