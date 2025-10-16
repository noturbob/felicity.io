"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// Define the shape of the user data
interface UserProfile {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
}

// Define the context structure
interface UserContextType {
    user: UserProfile | null;
    isLoading: boolean;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/profile`;

// Create the provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            // 1. Get the token from localStorage.
            const token = localStorage.getItem('token');
            if (!token) {
                // If there's no token, we can't fetch the user.
                // The protected route in layout.tsx will handle the redirect.
                setIsLoading(false);
                return;
            }

            try {
                // 2. Include the token in the Authorization header.
                const res = await fetch(API_URL, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    // If the token is invalid, the server will respond with 401.
                    // Clear the bad token and let the protected route handle the redirect.
                    localStorage.removeItem('token');
                    throw new Error('Session expired or invalid. Please log in again.');
                }
                
                const data: UserProfile = await res.json();
                setUser(data);
            } catch (error) {
                console.error(error);
                // In case of error, ensure we redirect by clearing the token if it exists
                localStorage.removeItem('token');
                window.location.href = '/authenticate';
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {isLoading ? <div className="flex h-screen w-full items-center justify-center">Loading User...</div> : children}
        </UserContext.Provider>
    );
};

// Create a custom hook for easy access to the context
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

