"use client";

import { useEffect, useState, ReactNode } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { UserProvider } from '@/context/UserContext';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <UserProvider>
      <AuthGuard>
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
          <WelcomeStepper />
          <Header />
          <main className="flex-1 p-4 md:p-8 pt-20">
            {children}
          </main>
        </div>
      </AuthGuard>
    </UserProvider>
  );
}

// --- Client-side authentication wrapper ---
function AuthGuard({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    // Check URL for token after OAuth login
    const urlToken = searchParams.get('token');

    if (urlToken) {
      console.log("Found token in URL, saving to localStorage...");
      localStorage.setItem('token', urlToken);

      setIsAuthenticated(true);

      // Clean URL by removing token param
      const cleanUrl = pathname;
      router.replace(cleanUrl);
    } else {
      // Normal page load, check localStorage
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        console.log("No token found, redirecting to login.");
        router.push('/authenticate');
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [searchParams, pathname, router]);

  // While verifying auth, show a loading state
  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? <>{children}</> : null;
}
