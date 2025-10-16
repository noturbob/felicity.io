import React from 'react'; // 1. Import React for Suspense
import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { ClientAuthWrapper } from "@/components/main/ClientAuthWrapper";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. Wrap the client-side component in a Suspense boundary.
    // This tells Next.js to show a loading fallback during the server build,
    // which resolves the prerendering error.
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <ClientAuthWrapper>
        <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
          <WelcomeStepper />
          <Header />
          <main className="flex-1 p-4 md:p-8 pt-20">
            {children}
          </main>
        </div>
      </ClientAuthWrapper>
    </React.Suspense>
  );
}