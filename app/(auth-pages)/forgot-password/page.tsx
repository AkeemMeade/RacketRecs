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
import { AlertCircle, CheckCircle2 } from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const supabase = createClient();

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
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200" />
      <div className="absolute inset-x-0 top-0 h-1 bg-amber-400/90" />

      {/* ===== NAV BAR ===== */}
      <nav
        className={`${outfit.className} relative z-10 mt-9 flex justify-center items-center gap-6 p-4`}
      >
        <Link
          href="/Home"
          className="text-center font-extrabold text-3xl uppercase mr-220 text-white"
        >
          RacketRecs
        </Link>

        <Link href="/about" className="text-white/90 hover:text-white">
          about
        </Link>

        <Link href="/contact" className="text-white/90 hover:text-white">
          contact
        </Link>

        <Link
          href="/sign-in"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-4xl hover:opacity-90"
        >
          Sign In
        </Link>

        <Link
          href="/sign-up"
          className="px-4 py-2 border-2 border-white text-white rounded-4xl hover:opacity-90"
        >
          Create Account
        </Link>
      </nav>

      {/* Gold divider */}
      <div className="relative z-10 w-full h-2 bg-[#FFC038]" />

      {/* ===== CONTENT ===== */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Brand header */}
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

          <Card className="border-white/5 bg-black/5 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Reset Password</CardTitle>
              <CardDescription className="text-white/90">
                Enter your email to receive a password reset link.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus-visible:ring-amber-200"
                  />
                </div>

                {message && (
                  isError ? (
                    <Alert className="border-red-300/40 bg-red-400/15 text-white">
                      <AlertCircle className="h-4 w-4 text-red-200" />
                      <AlertDescription className="text-white/90">
                        {message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-emerald-300/40 bg-emerald-400/15 text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-200" />
                      <AlertDescription className="text-white/90">
                        {message}
                      </AlertDescription>
                    </Alert>
                  )
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-400 text-white hover:bg-amber-300"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-white/90">
                <Link
                  href="/sign-in"
                  className="font-medium text-white underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/90">
            If you don’t see the email, check spam/junk or try again in a minute.
          </p>
        </div>
      </div>
    </main>
  );
}
