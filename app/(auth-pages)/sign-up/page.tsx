"use client";

import Link from "next/link";
import { Outfit, Roboto } from "next/font/google";
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
import { CheckCircle2, AlertCircle } from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: insertError } = await supabase.from("users").insert({
        user_id: authData.user.id,
        email: authData.user.email,
        date_created: new Date().toISOString(),
      });

      if (insertError) {
        setError(
          `Account created but profile setup failed: ${insertError.message}`
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail("");
      setPassword("");
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background (match Profile page vibe) */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      {/* ===== AUTH CONTENT ===== */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand header (fonts unchanged) */}
          <div className="mb-6 text-center">
            <div
              className={`text-2xl font-extrabold tracking-wide text-white drop-shadow ${outfit.className}`}
            >
              RACKETRECS
            </div>
            <p
              className={`mt-1 text-sm text-white/90 drop-shadow ${roboto.className}`}
            >
              Personalized racket recommendations, made simple.
            </p>
          </div>

          {/* Light card like Profile page cards */}
          <Card className="rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">Create Account</CardTitle>
              <CardDescription className="text-slate-700">
                Sign up to get personalized racket recommendations.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {success ? (
                <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-slate-900">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertDescription>
                    <strong>Success!</strong> Your account has been created. You
                    can now sign in.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSignUp} className="space-y-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-800">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border-white/60 bg-white/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-300"
                    />
                    <p className="text-xs text-slate-600">
                      Must be at least 6 characters
                    </p>
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50 text-slate-900">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-amber-400 text-slate-900 hover:bg-amber-300"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Sign Up"}
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center text-sm text-slate-700">
                Already have an account?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-slate-900 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/90 drop-shadow">
            By creating an account, you’ll be able to save assessments and
            favorites.
          </p>
        </div>
      </div>
    </main>
  );
}