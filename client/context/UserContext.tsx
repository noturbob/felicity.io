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

// Create the context with a default value
const UserContext = createContext<UserContextType | undefined>(undefined);

const API_URL = "http://localhost:8080/api/users/profile";

// Create the provider component that will wrap our application
export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token, redirect to login.
                // A full redirect is better than a client-side one here.
                window.location.href = '/authenticate';
                return;
            }

            try {
                const res = await fetch(API_URL, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!res.ok) {
                    // If token is invalid, clear it and redirect
                    localStorage.removeItem('token');
                    window.location.href = '/authenticate';
                    throw new Error('Session expired. Please log in again.');
                }
                
                const data: UserProfile = await res.json();
                setUser(data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {children}
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