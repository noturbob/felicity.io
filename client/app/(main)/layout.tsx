"use client";

import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { UserProvider } from '@/context/UserContext'; // Import the UserProvider to make user data available

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // This effect handles the redirect back from Google OAuth.
    // It checks the URL for a 'token' query parameter.
    const token = searchParams.get('token');
    if (token) {
      // 1. If a token is found, it's saved to the browser's localStorage.
      // This token will be used for all future secure API requests.
      console.log("Found token in URL, saving to localStorage...");
      localStorage.setItem('token', token);

      // 2. The URL is then cleaned by removing the token parameter.
      // This is important for security and provides a cleaner user experience.
      const newUrl = pathname; 
      router.replace(newUrl);
    }
  }, [searchParams, pathname, router]); // This effect runs whenever the URL changes.

  return (
    // The UserProvider wraps the entire logged-in section of the app.
    // This makes the user's name, email, and avatar available to all child components.
    <UserProvider>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <WelcomeStepper />
        <Header />
        <main className="flex-1 p-4 md:p-8 pt-20">
          {children}
        </main>
      </div>
    </UserProvider>
  );
}

