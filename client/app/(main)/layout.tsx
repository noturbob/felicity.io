import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
import { ClientAuthWrapper } from "@/components/main/ClientAuthWrapper"; // 1. Import the new wrapper

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 2. The wrapper now handles all client-side auth logic,
    // making this layout component stable for server-side builds.
    <ClientAuthWrapper>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
        <WelcomeStepper />
        <Header />
        <main className="flex-1 p-4 md:p-8 pt-20">
          {children}
        </main>
      </div>
    </ClientAuthWrapper>
  );
}