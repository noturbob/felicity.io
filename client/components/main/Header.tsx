"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext"; // Import the useUser hook
import {
  Home,
  HeartHandshake,
  Settings,
  LogOut,
  Menu,
  User,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/ai-assistant", icon: Sparkles, label: "Personal AI" },
  { href: "/responses", icon: MessagesSquare, label: "Grievance Responses" },
  { href: "/support", icon: HeartHandshake, label: "Help & Support" },
];

export function Header() {
  const pathname = usePathname();
  const { user, isLoading } = useUser(); // Get user data from our global context
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Function to handle logging out
  const handleLogout = () => {
      localStorage.removeItem('token'); // Clear the authentication token
      window.location.href = '/authenticate'; // Redirect to the login page
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu (Hamburger) */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Main Menu</SheetTitle>
              </SheetHeader>
              <Link href="/home" className="mb-4 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-pink-500" />
                <h1 className="text-xl font-bold text-pink-500">Felicity.io</h1>
              </Link>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-primary",
                      isMounted && pathname === item.href && "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo & Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-pink-500" />
            <h1 className="text-xl font-bold text-pink-500">Felicity.io</h1>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-primary",
                  isMounted && pathname === item.href && "text-primary"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side: DYNAMIC User Avatar & Dropdown */}
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  {/* Use the user's avatar URL, or a fallback if it doesn't exist */}
                  <AvatarImage src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name.replace(" ", "+")}&background=ec4899&color=fff`} alt={user?.name} />
                  {/* Show the user's initial as a fallback */}
                  <AvatarFallback>{user ? user.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {/* Display the user's name and email from the context */}
                  <p className="text-sm font-medium leading-none">{isLoading ? "Loading..." : user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {isLoading ? "..." : user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/profile">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

