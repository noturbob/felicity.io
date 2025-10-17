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

const UserContext = createContext<UserContextType | undefined>(undefined);

// FIX: Added a fallback to 'http://localhost:8080' for local development.
// This ensures the URL works even without a .env.local file.
const API_URL = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:8080'}/api/users/profile`;

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                // If there's no token, the user is not logged in.
                setIsLoading(false);
                // The protected route in ClientAuthWrapper will handle the redirect.
                return;
            }

            try {
                // This fetch request now correctly sends the token to the server.
                const res = await fetch(API_URL, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    // If the token is invalid, the server will respond with 401 Unauthorized.
                    localStorage.removeItem('token'); // Clear the bad token
                    window.location.href = '/authenticate'; // Force redirect
                    throw new Error('Session expired or invalid. Please log in again.');
                }
                
                const data: UserProfile = await res.json();
                setUser(data);
            } catch (error) {
                console.error("UserContext Error:", error);
                // If any error occurs, ensure the user is logged out.
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    window.location.href = '/authenticate';
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {/* Show a loading state until the user is fetched or confirmed not logged in */}
            {isLoading ? <div className="flex h-screen w-full items-center justify-center">Loading User...</div> : children}
        </UserContext.Provider>
    );
};

// Custom hook for easy access to the user context
export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

