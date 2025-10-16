"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { UserProvider } from '@/context/UserContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // Use null for initial loading state

  useEffect(() => {
    // This effect handles both the redirect from Google OAuth and route protection.
    const urlToken = searchParams.get('token');
    
    if (urlToken) {
      // Case 1: A token is found in the URL after Google login.
      // We save it to localStorage for future use.
      console.log("Found token in URL, saving to localStorage...");
      localStorage.setItem('token', urlToken);

      // We also mark the user as authenticated immediately.
      setIsAuthenticated(true);

      // Clean the URL by removing the token parameter for security.
      const newUrl = pathname; 
      router.replace(newUrl);
    } else {
      // Case 2: This is a normal page load. Check for an existing token.
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        // No token found, user is not authenticated. Redirect to login page.
        console.log("No token found, redirecting to login.");
        router.push('/authenticate');
      } else {
        // A token exists, so the user is allowed to see the page.
        setIsAuthenticated(true);
      }
    }
  }, [searchParams, pathname, router]);

  // While checking for authentication, we can show a loading state
  // to prevent a "flash" of the page content for unauthenticated users.
  if (isAuthenticated === null) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  // Only render the main app content if the user is authenticated.
  return isAuthenticated ? (
    <UserProvider>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <WelcomeStepper />
        <Header />
        <main className="flex-1 p-4 md:p-8 pt-20">
          {children}
        </main>
      </div>
    </UserProvider>
  ) : null; // Render nothing while redirecting
}

