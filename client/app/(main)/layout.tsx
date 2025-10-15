import { Header } from "@/components/main/Header";
import { WelcomeStepper } from "@/components/main/WelcomeStepper";
// FIX: Change to a named import to resolve the TypeScript error, assuming LayoutWrapper is exported as a named component.
import { LayoutWrapper } from "@/components/chat/LayoutWrapper"; 

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <WelcomeStepper />
      <Header />
      <main className="flex-1 p-4 md:p-8 pt-20">
        <LayoutWrapper>
          {children} {/* 2. Wrap the children with the LayoutWrapper */}
        </LayoutWrapper>
      </main>
    </div>
  );
}
