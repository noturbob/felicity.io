"use client";

import { useState } from "react";
import type { AuthView } from '@/lib/types';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const API_URL = "http://localhost:8080/api/auth";

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
    setAuthView: (view: AuthView) => void;
}

export function LoginForm({ setAuthView, className, ...props }: LoginFormProps) {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong during login.");
      }
      
      // On successful login, store the token and redirect to the home page
      localStorage.setItem("token", data.token);
      window.location.href = "/home"; // Full page redirect to ensure app state is fresh

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-4xl", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="flex flex-col justify-center p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome to Felicity.io</h1>
                <p className="text-muted-foreground text-balance">
                  Login as a {role === "user" ? "User" : "Admin"} to continue
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant={role === "user" ? "default" : "outline"} onClick={() => setRole("user")} type="button">User</Button>
                <Button variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")} type="button">Admin</Button>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" placeholder="bhumika@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a onClick={() => setAuthView('forgot-password')} className="ml-auto text-sm underline-offset-2 hover:underline cursor-pointer">
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>

              <FieldSeparator>Or continue with</FieldSeparator>

              <Field>
                 <Button variant="outline" type="button" className="w-full" asChild>
                   <a href={`${API_URL}/google`}>
                      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor"/></svg>
                      Login with Google
                   </a>
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Don&apos;t have an account? <a onClick={() => setAuthView('signup')} className="underline cursor-pointer">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>

          <div className="bg-muted relative hidden md:block">
            <img src="https://placehold.co/1080x1920/ec4899/fbcfe8?text=Felicity.io" alt="A beautiful pink gradient placeholder for Felicity.io" className="absolute inset-0 h-full w-full object-cover"/>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

