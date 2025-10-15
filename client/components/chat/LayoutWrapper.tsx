"use client";

import React, { useRef, useEffect, useState, useContext } from 'react';
import io, { Socket } from 'socket.io-client';
import { usePathname } from 'next/navigation';

// --- Context and Hook (UNCHANGED) ---
interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = React.createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const SERVER_URL = "http://localhost:8080";

// --- Socket Connection Component (UPDATED LIFECYCLE) ---
const SocketConnectionProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const pathname = usePathname(); // Get current route inside the provider

    useEffect(() => {
        let newSocket: Socket | null = null;
        
        // Only initialize connection if we are on the AI Assistant page
        if (pathname === '/ai-assistant') {
            
            // 1. Initialize connection
            newSocket = io(SERVER_URL, {
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            // 2. Set up listeners
            newSocket.on('connect', () => {
                console.log('Socket CONNECTED (Stable Provider)');
                setIsConnected(true);
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket DISCONNECTED (Stable Provider):', reason);
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket Connection Error:', error);
            });
            
            // 3. Store in ref and state
            socketRef.current = newSocket;

        } else {
            // If navigating AWAY from the AI route, ensure the active socket is disconnected
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setIsConnected(false);
            }
        }


        // 4. Cleanup function
        return () => {
            if (newSocket) {
                newSocket.off('connect');
                newSocket.off('disconnect');
                newSocket.off('connect_error');
                newSocket.disconnect();
                console.log('Socket Provider Cleaned Up');
            }
            // Ensure socketRef is cleared on cleanup, regardless of path
            socketRef.current = null;
            setIsConnected(false);
        };
    }, [pathname]); // <-- Reruns ONLY when the route changes

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};


// --- Main Exported Component (LayoutWrapper) ---
// This component now ALWAYS renders the provider, stabilizing the tree.
export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
    // The provider is always mounted here, stabilizing the useEffect inside it.
    return <SocketConnectionProvider>{children}</SocketConnectionProvider>;
};