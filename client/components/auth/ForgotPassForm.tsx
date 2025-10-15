"use client";

import { useState } from "react";
import type { AuthView } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ForgotPasswordFormProps extends React.ComponentProps<typeof Card> {
    setAuthView: (view: AuthView) => void;
}

export function ForgotPasswordForm({ setAuthView, ...props }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("Sending code...");
    console.log("Submitting password reset for:", email);

    // TODO: Add API call to backend to send OTP email
    // This is a placeholder for the future API call.
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsLoading(false);
    setMessage("Code sent! Please check your email.");
    
    // After a delay, navigate to OTP view
    setTimeout(() => {
        setAuthView('otp');
    }, 1000);
  };

  return (
    <Card className="w-full max-w-md shadow-lg" {...props}>
      <CardHeader className="text-center">
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a code to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="bhumika@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            {message && <p className="text-sm text-center text-muted-foreground">{message}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Code"}
            </Button>
            <Button variant="link" type="button" onClick={() => setAuthView('login')}>
              Back to Login
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}