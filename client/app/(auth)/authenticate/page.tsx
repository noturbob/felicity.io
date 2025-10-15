"use client";

import { useState, useEffect } from "react";
import type { AuthView } from '@/lib/types'; // FIX: Import the shared type
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { OTPForm } from '@/components/auth/OTPForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPassForm';
import { NewPassForm } from "@/components/auth/NewPassForm"; // Import the new component

export default function AuthenticatePage() {
  const [authView, setAuthView] = useState<AuthView>('login');

  // This effect handles the token from the Google OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, document.title, "/home"); // Clean the URL
      window.location.href = "/home"; // Redirect to the main application
    }
  }, []);

  const renderForm = () => {
    switch (authView) {
      case 'signup':
        return <SignupForm setAuthView={setAuthView} />;
      case 'otp':
        return <OTPForm setAuthView={setAuthView} />;
      case 'forgot-password':
        return <ForgotPasswordForm setAuthView={setAuthView} />;
      case 'new-password': // FIX: Add the missing case for the new password form
        return <NewPassForm setAuthView={setAuthView} />;
      case 'login':
      default:
        return <LoginForm setAuthView={setAuthView} />;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 transition-all">
      {renderForm()}
    </main>
  );
}

