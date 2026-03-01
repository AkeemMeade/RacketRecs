"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Outfit, Roboto } from "next/font/google";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Settings2, Bell, Shield, SlidersHorizontal, RefreshCcw } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"] });

type SectionKey = "recommendations" | "comparison" | "notifications" | "privacy" | "data";

type PreferencesState = {
  // Recommendations
  playStyle: "balanced" | "power" | "control" | "speed";
  budgetCap: number; // dollars
  brandPreference: string;
  weightImportance: number; // 0-100
  stiffnessImportance: number; // 0-100
  showOnlyInStock: boolean;

  // Comparison tool defaults
  defaultCompareSlots: 2 | 3;
  autoHighlightDifferences: boolean;
  showSpecExplanations: boolean;

  // Notifications
  emailUpdates: boolean;
  notifyOnNewMatches: boolean;

  // Privacy
  storeSearchHistory: boolean;
  analyticsOptIn: boolean;

  // Data / system controls (placeholder)
  allowBackgroundRefresh: boolean;
};

const DEFAULTS: PreferencesState = {
  playStyle: "balanced",
  budgetCap: 150,
  brandPreference: "",
  weightImportance: 60,
  stiffnessImportance: 60,
  showOnlyInStock: true,

  defaultCompareSlots: 3,
  autoHighlightDifferences: true,
  showSpecExplanations: true,

  emailUpdates: false,
  notifyOnNewMatches: true,

  storeSearchHistory: true,
  analyticsOptIn: false,

  allowBackgroundRefresh: false,
};

export default function PreferencesPage() {
  const [active, setActive] = useState<SectionKey>("recommendations");
  const [prefs, setPrefs] = useState<PreferencesState>(DEFAULTS);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const navItems = useMemo(
    () => [
      { key: "recommendations" as const, label: "Recommendations", icon: SlidersHorizontal },
      { key: "comparison" as const, label: "Comparison Tool", icon: Settings2 },
      { key: "notifications" as const, label: "Notifications", icon: Bell },
      { key: "privacy" as const, label: "Privacy", icon: Shield },
      { key: "data" as const, label: "Data & Refresh", icon: RefreshCcw },
    ],
    []
  );

  // Skeleton persistence (localStorage). Later: replace with Supabase table keyed by user_id.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("racketrecs_prefs");
      if (raw) setPrefs(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSaved(false);

    try {
      // TODO: Supabase upsert into user_preferences table
      localStorage.setItem("racketrecs_prefs", JSON.stringify(prefs));

      // Small fake delay to feel real
      await new Promise((r) => setTimeout(r, 400));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save preferences. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background (same theme as auth) */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      <div className="relative z-10 mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className={`text-2xl font-extrabold tracking-wide text-white drop-shadow ${outfit.className}`}>
              RACKETRECS
            </div>
            <p className={`text-sm text-white/90 drop-shadow ${roboto.className}`}>
              Preferences & control panel — tune how recommendations and comparisons behave.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="bg-amber-400 text-slate-900 hover:bg-amber-300"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/profile">Back to Profile</Link>
            </Button>
          </div>
        </div>

        {/* Feedback */}
        {saved && (
          <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-slate-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>
              <strong>Saved!</strong> (Local placeholder storage for now.)
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 text-slate-900">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <Card className="rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">Settings</CardTitle>
              <CardDescription className="text-slate-700">
                Choose a section to edit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActive(item.key)}
                    className={[
                      "w-full rounded-xl px-3 py-2 text-left text-sm transition flex items-center gap-2",
                      isActive
                        ? "bg-white/80 border border-white/70 text-slate-900"
                        : "hover:bg-white/60 text-slate-800",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}

              <Separator className="my-3 bg-slate-300/60" />

              <div className="text-xs text-slate-700">
                Tip: These are still skeleton controls. Next we’ll connect them to Supabase.
              </div>
            </CardContent>
          </Card>

          {/* Main panel */}
          <Card className="rounded-2xl border border-white/60 bg-white/70 shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-slate-900">
                {navItems.find((n) => n.key === active)?.label}
              </CardTitle>
              <CardDescription className="text-slate-700">
                {active === "recommendations" && "Control how we rank and filter rackets for you."}
                {active === "comparison" && "Choose how the comparison tool behaves by default."}
                {active === "notifications" && "Opt into updates and alerts."}
                {active === "privacy" && "Control what we store and what we track."}
                {active === "data" && "System knobs for data refresh (placeholder for now)."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* RECOMMENDATIONS */}
              {active === "recommendations" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-slate-800">Playstyle Focus</Label>
                      <Select
                        value={prefs.playStyle}
                        onValueChange={(v: string) => setPrefs((p) => ({ ...p, playStyle: v as PreferencesState["playStyle"] }))}
                      >
                        <SelectTrigger className="border-white/60 bg-white/80">
                          <SelectValue placeholder="Choose one" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balanced">Balanced</SelectItem>
                          <SelectItem value="power">Power</SelectItem>
                          <SelectItem value="control">Control</SelectItem>
                          <SelectItem value="speed">Speed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Budget Cap ($)</Label>
                      <Input
                        type="number"
                        value={prefs.budgetCap}
                        onChange={(e) => setPrefs((p) => ({ ...p, budgetCap: Number(e.target.value || 0) }))}
                        className="border-white/60 bg-white/80 text-slate-900 focus-visible:ring-amber-300"
                      />
                      <p className="text-xs text-slate-600">We’ll filter recommendations above this cap.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-800">Preferred Brand (optional)</Label>
                    <Input
                      value={prefs.brandPreference}
                      onChange={(e) => setPrefs((p) => ({ ...p, brandPreference: e.target.value }))}
                      placeholder="Yonex, Victor, Li-Ning..."
                      className="border-white/60 bg-white/80 text-slate-900 placeholder:text-slate-400 focus-visible:ring-amber-300"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-800">Weight Importance</Label>
                        <span className="text-xs text-slate-600">{prefs.weightImportance}/100</span>
                      </div>
                      <Slider
                        value={[prefs.weightImportance]}
                        onValueChange={(value: number[]) =>
                          setPrefs((p) => ({ ...p, weightImportance: value[0] ?? 0 }))
                        }
                        max={100}
                        step={5}
                      />
                      <p className="text-xs text-slate-600">Higher means weight affects ranking more.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-slate-800">Stiffness Importance</Label>
                        <span className="text-xs text-slate-600">{prefs.stiffnessImportance}/100</span>
                      </div>
                      <Slider
                        value={[prefs.stiffnessImportance]}
                        onValueChange={(value: number[]) =>
                          setPrefs((p) => ({ ...p, stiffnessImportance: value[0] ?? 0 }))
                        }
                        max={100}
                        step={5}
                      />
                      <p className="text-xs text-slate-600">Higher means shaft stiffness affects ranking more.</p>
                    </div>
                  </div>

                  <Separator className="bg-slate-300/60" />

                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Only show in-stock rackets</p>
                      <p className="text-xs text-slate-600">Filters out unavailable items when possible.</p>
                    </div>
                    <Switch
                      checked={prefs.showOnlyInStock}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, showOnlyInStock: v }))}
                    />
                  </div>
                </div>
              )}

              {/* COMPARISON TOOL */}
              {active === "comparison" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-800">Default compare slots</Label>
                    <Select
                      value={String(prefs.defaultCompareSlots)}
                      onValueChange={(v) =>
                        setPrefs((p) => ({ ...p, defaultCompareSlots: (Number(v) as 2 | 3) }))
                      }
                    >
                      <SelectTrigger className="border-white/60 bg-white/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 rackets</SelectItem>
                        <SelectItem value="3">3 rackets</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-600">Controls how many slots the comparison page starts with.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Auto-highlight differences</p>
                      <p className="text-xs text-slate-600">Visually emphasize spec differences.</p>
                    </div>
                    <Switch
                      checked={prefs.autoHighlightDifferences}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, autoHighlightDifferences: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Show spec explanations</p>
                      <p className="text-xs text-slate-600">Adds quick tooltips / helper text.</p>
                    </div>
                    <Switch
                      checked={prefs.showSpecExplanations}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, showSpecExplanations: v }))}
                    />
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS */}
              {active === "notifications" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Email updates</p>
                      <p className="text-xs text-slate-600">Feature updates & important announcements.</p>
                    </div>
                    <Switch
                      checked={prefs.emailUpdates}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailUpdates: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Notify on new matches</p>
                      <p className="text-xs text-slate-600">Alerts when new rackets match your preferences.</p>
                    </div>
                    <Switch
                      checked={prefs.notifyOnNewMatches}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, notifyOnNewMatches: v }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-800">Notification notes (optional)</Label>
                    <Textarea
                      value={""}
                      onChange={() => {}}
                      placeholder="Later: we can add notification preferences per category."
                      className="min-h-[90px] border-white/60 bg-white/80 text-slate-900 placeholder:text-slate-400"
                      disabled
                    />
                    <p className="text-xs text-slate-600">Disabled for now — just to show where this will expand.</p>
                  </div>
                </div>
              )}

              {/* PRIVACY */}
              {active === "privacy" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Store search history</p>
                      <p className="text-xs text-slate-600">Remembers searches to improve suggestions.</p>
                    </div>
                    <Switch
                      checked={prefs.storeSearchHistory}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, storeSearchHistory: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Analytics opt-in</p>
                      <p className="text-xs text-slate-600">Helps us measure usage (placeholder).</p>
                    </div>
                    <Switch
                      checked={prefs.analyticsOptIn}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, analyticsOptIn: v }))}
                    />
                  </div>

                  <Separator className="bg-slate-300/60" />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Clear local preferences</p>
                      <p className="text-xs text-slate-600">This resets the placeholder settings (localStorage).</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        localStorage.removeItem("racketrecs_prefs");
                        setPrefs(DEFAULTS);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}

              {/* DATA & REFRESH */}
              {active === "data" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Allow background refresh</p>
                      <p className="text-xs text-slate-600">Placeholder for a “refresh racket data” system.</p>
                    </div>
                    <Switch
                      checked={prefs.allowBackgroundRefresh}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, allowBackgroundRefresh: v }))}
                    />
                  </div>

                  <div className="rounded-xl border border-white/60 bg-white/60 p-4">
                    <p className="text-sm font-medium text-slate-900">Manual refresh (placeholder)</p>
                    <p className="mt-1 text-xs text-slate-600">
                      Later this can trigger a server action / admin-only endpoint to refresh your racket dataset.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        className="bg-amber-400 text-slate-900 hover:bg-amber-300"
                        onClick={() => alert("Placeholder: Refresh triggered (not implemented).")}
                      >
                        Refresh Dataset
                      </Button>
                      <Button asChild variant="secondary">
                        <Link href="/rackets">View Rackets</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}