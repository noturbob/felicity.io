"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { UserProvider } from '@/context/UserContext';

export function ClientAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    
    if (urlToken) {
      // Case 1: Handle Google OAuth redirect
      localStorage.setItem('token', urlToken);
      setIsAuthenticated(true);
      // Clean the URL for security
      router.replace(pathname);
    } else {
      // Case 2: Normal page load, check for existing token
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        // No token found, redirect to login
        router.push('/authenticate');
      } else {
        // Token exists, user is allowed to see the page
        setIsAuthenticated(true);
      }
    }
  }, [searchParams, pathname, router]);

  // Show a loading state while authentication is being verified
  if (isAuthenticated === null) {
    return <div className="flex h-screen w-full items-center justify-center text-muted-foreground">Loading...</div>;
  }

  // If authenticated, wrap the children with the UserProvider and render them
  return isAuthenticated ? (
    <UserProvider>
      {children}
    </UserProvider>
  ) : null; // Render nothing while the redirect is happening
}