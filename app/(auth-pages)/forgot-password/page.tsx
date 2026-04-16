"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage("Check your email for the password reset link!");
      setEmail("");
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background*/}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Page heading*/}
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow">
              Forgot your password?
            </h1>
            <p className="mt-2 text-sm text-white/90 drop-shadow">
              Enter your email and we’ll send you a reset link.
            </p>
          </div>

          <Card className="rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">Reset Password</CardTitle>
              <CardDescription className="text-slate-700">
                We’ll email you a secure reset link.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-800">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-white/60 bg-white/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-300"
                  />
                </div>

                {message &&
                  (isError ? (
                    <Alert className="border-red-200 bg-red-50 text-slate-900">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-emerald-200 bg-emerald-50 text-slate-900">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  ))}

                <Button
                  type="submit"
                  className="w-full bg-amber-400 text-slate-900 hover:bg-amber-300"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-slate-700">
                <Link
                  href="/sign-in"
                  className="font-medium text-slate-900 underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/90 drop-shadow">
            If you don’t see the email, check spam/junk or try again in a minute.
          </p>
        </div>
      </div>
    </main>
  );
}