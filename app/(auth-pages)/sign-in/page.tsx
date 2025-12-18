"use client";

import Link from "next/link";
import { Outfit, Roboto } from "next/font/google";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
import { AlertCircle } from "lucide-react";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />
      <div className="absolute inset-x-0 top-0 h-1 bg-amber-400/90" />

      {/* ===== NAV BAR ===== */}
      <nav className={`${outfit.className} relative z-10 mt-9 flex justify-center items-center gap-6 p-4`}>
        <Link className="text-center font-extrabold text-3xl uppercase mr-220 text-white" href="/Home">
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

      <div className="relative z-10 w-full h-2 bg-[#FFC038]" />

      {/* ===== AUTH CONTENT ===== */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-140px)] max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className={`text-2xl font-extrabold tracking-wide text-white drop-shadow ${outfit.className}`}>
              RACKETRECS
            </div>
            <p className={`mt-1 text-sm text-white/90 drop-shadow ${roboto.className}`}>
              Personalized racket recommendations, made simple.
            </p>
          </div>

          <Card className="border-white/5 bg-black/5 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-white/90">
                Enter your credentials to access your account.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-white/90">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-white/90 underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-white/30 bg-white/20 text-white placeholder:text-white/60 focus-visible:ring-amber-200"
                  />
                </div>

                {error && (
                  <Alert className="border-red-300/40 bg-red-400/15 text-white">
                    <AlertCircle className="h-4 w-4 text-red-200" />
                    <AlertDescription className="text-white/90">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-amber-400 text-white hover:bg-amber-300"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-white/90">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="font-medium text-white underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/90">
            Tip: You can create an account first if you haven&apos;t taken the assessment yet.
          </p>
        </div>
      </div>
    </main>
  );
}
