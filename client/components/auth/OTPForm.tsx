"use client";

import { useState } from "react";
import type { AuthView } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OTPFormProps extends React.ComponentProps<typeof Card> {
    setAuthView: (view: AuthView) => void;
}

export function OTPForm({ setAuthView, ...props }: OTPFormProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // TODO: Add API call to backend to verify OTP
    console.log("Verifying OTP:", otp);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (otp === "123456") { // Simulate a correct OTP
        console.log("OTP Verified! Redirecting...");
        setAuthView('new-password'); // Navigate to the new password form
    } else {
        setError("Invalid OTP code. Please try again.");
        setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md shadow-lg" {...props}>
      <CardHeader className="text-center">
        <CardTitle>Enter Verification Code</CardTitle>
        <CardDescription>We sent a 6-digit code to your email (Hint: try 123456).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field className="items-center">
              <FieldLabel htmlFor="otp" className="sr-only">Verification code</FieldLabel>
              <InputOTP maxLength={6} id="otp" value={otp} onChange={(value) => setOtp(value)} required>
                <InputOTPGroup className="gap-2.5">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </Field>
             {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <FieldGroup>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
              <FieldDescription className="text-center">
                Didn&apos;t receive the code? <a href="#" className="underline cursor-pointer">Resend</a>
              </FieldDescription>
              <Button variant="link" type="button" onClick={() => setAuthView('login')}>
                Back to Login
              </Button>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}