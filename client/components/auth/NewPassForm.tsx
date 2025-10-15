"use client";

import { useState } from "react";
import type { AuthView } from '@/lib/types';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface NewPassFormProps extends React.ComponentProps<typeof Card> {
  setAuthView: (view: AuthView) => void;
}

export function NewPassForm({ setAuthView, ...props }: NewPassFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }
    setError('');
    console.log("Password reset successfully!");
    // TODO: Add API call to update password in the database
    setAuthView('login'); // Redirect to login on success
  };

  return (
    <Card className="w-full max-w-md shadow-lg" {...props}>
      <CardHeader className="text-center">
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>
          Please enter and confirm your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-password">New Password</FieldLabel>
              <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </Field>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full">Reset Password</Button>
            <Button variant="link" type="button" onClick={() => setAuthView('login')}>
              Back to Login
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
