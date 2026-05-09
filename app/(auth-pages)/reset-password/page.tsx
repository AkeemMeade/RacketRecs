"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

const supabase = createClient();


export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("auth event:", event, session);
    });

    supabase.auth.getSession().then(({ data }) => {
      console.log("session:", data.session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    setIsError(false);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setIsError(true);
      setMessage(error.message);
    } else {
      setIsError(false);
      setMessage("Password updated successfully! Redirecting...");
      setTimeout(() => router.push("/account"), 2000);
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow">
              Set a new password
            </h1>
            <p className="mt-2 text-sm text-white/90 drop-shadow">
              Choose a strong password for your account.
            </p>
          </div>

          <Card className="rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">Reset Password</CardTitle>
              <CardDescription className="text-slate-700">
                Enter your new password below.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-800">
                    New Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-white/60 bg-white/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-slate-800">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
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
                  {loading ? "Updating..." : "Update Password"}
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
            If you didn't request this, you can safely ignore this page.
          </p>
        </div>
      </div>
    </main>
  );
}