"use client";

import { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { UserProvider } from "@/context/UserContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (urlToken) {
      // Save token from URL
      localStorage.setItem("token", urlToken);
      setIsAuthenticated(true);

      // Clean URL
      router.replace(pathname);
    } else {
      const storedToken = localStorage.getItem("token");
      if (!storedToken) {
        router.push("/authenticate");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [searchParams, pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? (
    <UserProvider>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <WelcomeStepper />
        <Header />
        <main className="flex-1 p-4 md:p-8 pt-20">{children}</main>
      </div>
    </UserProvider>
  ) : null;
}
