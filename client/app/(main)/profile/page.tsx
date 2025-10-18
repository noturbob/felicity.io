"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { Pen, Camera, Trash2, Check, X } from "lucide-react";

// FIX: Use the environment variable for the base API URL, with a fallback for local development.
const API_BASE_URL = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080'}/api/users/profile`;

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const fetchUserProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/authenticate';
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(API_BASE_URL, { // Use the dynamic URL
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                localStorage.removeItem('token');
                window.location.href = '/authenticate';
                throw new Error('Session expired. Please log in again.');
            }
            const data: UserProfile = await res.json();
            setUser(data);
            setName(data.name);
            setEmail(data.email);
        } catch (err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleSaveChanges = async () => {
        if(password && password !== confirmPassword){
            setError("Passwords do not match.");
            return;
        }
        
        setError("");
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        const updateData: { name: string; email: string; password?: string } = { name, email };
        if(password) {
            updateData.password = password;
        }

        try {
            const res = await fetch(API_BASE_URL, { // Use the dynamic URL
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(updateData)
            });

            if(!res.ok){
                const data = await res.json();
                throw new Error(data.message || 'Failed to update profile.');
            }
            
            await fetchUserProfile();
            setIsEditing(false);
            setPassword("");
            setConfirmPassword("");

        } catch(err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('avatar', file);

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE_URL}/avatar`, { // Use the dynamic URL
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Server returned an error.');
            }
            
            await fetchUserProfile(); // Refresh profile

        } catch (err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsLoading(true);
        setError("");
        const token = localStorage.getItem('token');
        try {
             const res = await fetch(API_BASE_URL, { // Use the dynamic URL
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if(!res.ok){
                 const data = await res.json();
                throw new Error(data.message || 'Failed to delete account.');
            }
            localStorage.removeItem('token');
            window.location.href = '/authenticate';
        } catch(err) {
            if (err instanceof Error) setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const FADE_IN_VARIANTS = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    if (isLoading && !user) {
        return <div className="text-center text-muted-foreground animate-pulse">Loading profile...</div>;
    }

    if (!user) {
        return <div className="text-center text-red-500">{error || "Could not load profile."}</div>
    }

    return (
        <div className="flex flex-col gap-8">
            <motion.div
                className="text-center"
                initial="hidden" animate="visible" transition={{ duration: 0.5 }} variants={FADE_IN_VARIANTS}
            >
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                  Your Profile
                </h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Manage your account details and preferences.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <motion.div
                    className="lg:col-span-1"
                    initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.2 }} variants={FADE_IN_VARIANTS}
                >
                    <Card className="flex flex-col items-center p-8 text-center">
                        <div className="relative mb-4">
                            <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/jpg"
                            />
                            <Avatar className="w-24 h-24">
                                <AvatarImage src={user.avatar || `https://ui-avatars.com/api/?name=${user.name.replace(" ", "+")}&background=ec4899&color=fff`} alt={user.name} />
                                <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {isEditing && (
                                <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => avatarInputRef.current?.click()}>
                                    <Camera className="h-4 w-4" />
                                    <span className="sr-only">Upload Picture</span>
                                </Button>
                            )}
                        </div>
                        <h2 className="text-2xl font-bold">{user.name}</h2>
                        <p className="text-muted-foreground">{user.email}</p>
                         {!isEditing && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsEditing(true)}>
                                <Pen className="mr-2 h-4 w-4" />
                                Edit Profile
                            </Button>
                        )}
                    </Card>
                </motion.div>

                <motion.div
                    className="lg:col-span-2"
                    initial="hidden" animate="visible" transition={{ duration: 0.5, delay: 0.4 }} variants={FADE_IN_VARIANTS}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                            <CardDescription>
                                {isEditing ? "Update your account information below." : "Review and manage your account information."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="fullname">Full Name</Label>
                                {isEditing ? ( <Input id="fullname" value={name} onChange={(e) => setName(e.target.value)} /> ) : ( <p className="text-muted-foreground">{user.name}</p> )}
                            </div>
                            <Separator />
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                {isEditing ? ( <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /> ) : ( <p className="text-muted-foreground">{user.email}</p> )}
                            </div>
                            <Separator />
                             <div className="grid gap-2">
                                <Label htmlFor="password">{isEditing ? "New Password" : "Password"}</Label>
                                {isEditing ? (
                                    <div className="grid gap-4">
                                        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password (optional)" />
                                        <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                                    </div>
                                ) : ( <p className="text-muted-foreground">••••••••••••</p> )}
                            </div>
                             {error && <p className="text-sm text-red-500 text-center pt-2">{error}</p>}
                        </CardContent>
                        {isEditing && (
                            <CardFooter className="justify-end gap-2">
                                <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isLoading}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                                <Button onClick={handleSaveChanges} disabled={isLoading}><Check className="mr-2 h-4 w-4" /> {isLoading ? "Saving..." : "Save Changes"}</Button>
                            </CardFooter>
                        )}
                    </Card>
                    <Card className="mt-8 border-destructive">
                         <CardHeader>
                            <CardTitle>Danger Zone</CardTitle>
                            <CardDescription>This action is permanent and cannot be undone.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="destructive" disabled={isLoading}><Trash2 className="mr-2 h-4 w-4" />Delete Account</Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete your account and all associated data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">Yes, delete my account</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
