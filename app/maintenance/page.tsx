"use client";

import { useEffect, useMemo, useState } from "react";
import { Outfit } from "next/font/google";
import { createClient } from "@/lib/supabase/client";

const outfit = Outfit({
  subsets: ["latin"],
});

const supabase = createClient();

type RetailerPrice = {
  price: number | string | null;
};

type ApiRacket = {
  racket_id: number;
  name: string | null;
  stiffness: string | null;
  balance: string | null;
  weight: string | null;
  img_url: string | null;
  manufacturer_id: number | null;
  manufacturer?:
    | {
        manufacturer_id?: number | null;
        name?: string | null;
      }
    | {
        manufacturer_id?: number | null;
        name?: string | null;
      }[]
    | null;
  racket_retailer?: RetailerPrice[] | null;
};

type DbTask = {
  id: string;
  tracked_racket_id: string;
  label: string;
  completed: boolean;
  is_custom: boolean;
  created_at: string;
};

type DbTrackedRacket = {
  id: string;
  user_id: string;
  racket_id: number;
  condition: "Excellent" | "Good" | "Fair" | "Needs Attention" | null;
  last_restrung: string | null;
  last_grip_change: string | null;
  notes: string | null;
  created_at: string | null;
};

type MaintenanceTask = {
  id: string;
  label: string;
  completed: boolean;
  isCustom: boolean;
};

type TrackedRacket = {
  trackedId: string;
  racketId: number;
  name: string;
  brand: string;
  weight: string;
  balance: string;
  stiffness: string;
  imageUrl: string | null;
  condition: "Excellent" | "Good" | "Fair" | "Needs Attention";
  lastRestrung: string | null;
  lastGripChange: string | null;
  notes: string;
  tasks: MaintenanceTask[];
};

function formatRacketName(name: string | null): string {
  if (!name) return "Unnamed Racket";

  const ignoreWords = ["badminton", "racket", "unstrung"];

  const words = name
    .replace(/[-_/]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !ignoreWords.includes(word.toLowerCase()))
    .slice(0, 4);

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getBrandName(
  manufacturer:
    | { manufacturer_id?: number | null; name?: string | null }
    | { manufacturer_id?: number | null; name?: string | null }[]
    | null
    | undefined
): string {
  const manufacturerData = Array.isArray(manufacturer)
    ? manufacturer[0]
    : manufacturer;

  return manufacturerData?.name ?? "Unknown";
}

function formatDisplayDate(date: string | null): string {
  if (!date) return "Not logged";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Not logged";

  return parsed.toLocaleDateString();
}

function getConditionClasses(condition: TrackedRacket["condition"]): string {
  switch (condition) {
    case "Excellent":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Good":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Fair":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Needs Attention":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getDefaultTaskLabels(): string[] {
  return [
    "Inspect frame for cracks",
    "Check string tension / restring if needed",
    "Replace overgrip",
    "Clean racket and strings",
  ];
}

function buildTrackedRackets(
  trackedRows: DbTrackedRacket[],
  taskRows: DbTask[],
  allRackets: ApiRacket[]
): TrackedRacket[] {
  return trackedRows.map((trackedRow) => {
    const racketDetails = allRackets.find(
      (racket) => racket.racket_id === trackedRow.racket_id
    );

    const tasks = taskRows
      .filter((task) => task.tracked_racket_id === trackedRow.id)
      .map((task) => ({
        id: task.id,
        label: task.label,
        completed: task.completed,
        isCustom: task.is_custom,
      }));

    return {
      trackedId: trackedRow.id,
      racketId: trackedRow.racket_id,
      name: racketDetails?.name ?? "Unnamed Racket",
      brand: getBrandName(racketDetails?.manufacturer),
      weight: racketDetails?.weight ?? "N/A",
      balance: racketDetails?.balance ?? "N/A",
      stiffness: racketDetails?.stiffness ?? "N/A",
      imageUrl: racketDetails?.img_url ?? null,
      condition: trackedRow.condition ?? "Good",
      lastRestrung: trackedRow.last_restrung,
      lastGripChange: trackedRow.last_grip_change,
      notes: trackedRow.notes ?? "",
      tasks,
    };
  });
}

export default function MaintenanceTrackerPage() {
  const [query, setQuery] = useState("");
  const [allRackets, setAllRackets] = useState<ApiRacket[]>([]);
  const [trackedRackets, setTrackedRackets] = useState<TrackedRacket[]>([]);
  const [selectedTrackedId, setSelectedTrackedId] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const [loadingRackets, setLoadingRackets] = useState(true);
  const [loadingTracked, setLoadingTracked] = useState(true);
  const [submittingTrackId, setSubmittingTrackId] = useState<number | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [pageError, setPageError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const fetchUserAndRackets = async () => {
      try {
        setLoadingRackets(true);
        setPageError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          setUserId(null);
          setPageError("You must be signed in to use the maintenance tracker.");
          return;
        }

        setUserId(user.id);

        const response = await fetch("/api/rackets");

        if (!response.ok) {
          throw new Error(`Failed to fetch rackets: ${response.status}`);
        }

        const data: ApiRacket[] = await response.json();
        setAllRackets(data ?? []);
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setLoadingRackets(false);
      }
    };

    fetchUserAndRackets();
  }, []);

  useEffect(() => {
    const fetchTrackedRackets = async () => {
      if (!userId || allRackets.length === 0) {
        setLoadingTracked(false);
        return;
      }

      try {
        setLoadingTracked(true);
        setPageError("");

        const { data: trackedRows, error: trackedError } = await supabase
          .from("tracked_rackets")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (trackedError) {
          throw trackedError;
        }

        const trackedIds = (trackedRows ?? []).map((row) => row.id);

        let taskRows: DbTask[] = [];

        if (trackedIds.length > 0) {
          const { data: tasksData, error: tasksError } = await supabase
            .from("maintenance_tasks")
            .select("*")
            .in("tracked_racket_id", trackedIds)
            .order("created_at", { ascending: true });

          if (tasksError) {
            throw tasksError;
          }

          taskRows = tasksData ?? [];
        }

        const mapped = buildTrackedRackets(trackedRows ?? [], taskRows, allRackets);
        setTrackedRackets(mapped);

        if (mapped.length > 0) {
          setSelectedTrackedId((current) =>
            current && mapped.some((racket) => racket.trackedId === current)
              ? current
              : mapped[0].trackedId
          );
        } else {
          setSelectedTrackedId(null);
        }
      } catch (err) {
        setPageError(err instanceof Error ? err.message : "Failed to load tracker.");
      } finally {
        setLoadingTracked(false);
      }
    };

    fetchTrackedRackets();
  }, [userId, allRackets]);

  const filteredRackets = useMemo(() => {
    const lower = query.toLowerCase().trim();

    if (!lower) return allRackets;

    return allRackets.filter((racket) => {
      const formattedName = formatRacketName(racket.name).toLowerCase();
      const brand = getBrandName(racket.manufacturer).toLowerCase();
      const balance = (racket.balance ?? "").toLowerCase();
      const stiffness = (racket.stiffness ?? "").toLowerCase();
      const weight = (racket.weight ?? "").toLowerCase();

      return (
        formattedName.includes(lower) ||
        brand.includes(lower) ||
        balance.includes(lower) ||
        stiffness.includes(lower) ||
        weight.includes(lower)
      );
    });
  }, [query, allRackets]);

  const selectedTrackedRacket = useMemo(() => {
    return (
      trackedRackets.find((racket) => racket.trackedId === selectedTrackedId) ?? null
    );
  }, [trackedRackets, selectedTrackedId]);

  const addRacketToTracker = async (racket: ApiRacket) => {
    if (!userId) {
      setPageError("You must be signed in to track a racket.");
      return;
    }

    const alreadyTracked = trackedRackets.some(
      (tracked) => tracked.racketId === racket.racket_id
    );

    if (alreadyTracked) {
      return;
    }

    try {
      setSubmittingTrackId(racket.racket_id);
      setPageError("");
      setSaveMessage("");
            const { data: insertedTracked, error: insertTrackedError } = await supabase
        .from("tracked_rackets")
        .insert({
          user_id: userId,
          racket_id: racket.racket_id,
          condition: "Good",
          last_restrung: null,
          last_grip_change: null,
          notes: "",
        })
        .select()
        .single();

      if (insertTrackedError) {
        throw insertTrackedError;
      }

      const defaultTasksPayload = getDefaultTaskLabels().map((label) => ({
        tracked_racket_id: insertedTracked.id,
        label,
        completed: false,
        is_custom: false,
      }));

      const { error: taskInsertError } = await supabase
        .from("maintenance_tasks")
        .insert(defaultTasksPayload);

      if (taskInsertError) {
        throw taskInsertError;
      }

      const newTrackedRacket: TrackedRacket = {
        trackedId: insertedTracked.id,
        racketId: racket.racket_id,
        name: racket.name ?? "Unnamed Racket",
        brand: getBrandName(racket.manufacturer),
        weight: racket.weight ?? "N/A",
        balance: racket.balance ?? "N/A",
        stiffness: racket.stiffness ?? "N/A",
        imageUrl: racket.img_url ?? null,
        condition: "Good",
        lastRestrung: null,
        lastGripChange: null,
        notes: "",
        tasks: defaultTasksPayload.map((task, index) => ({
          id: `${insertedTracked.id}-default-${index}`,
          label: task.label,
          completed: false,
          isCustom: false,
        })),
      };

      const { data: freshTasks, error: freshTasksError } = await supabase
        .from("maintenance_tasks")
        .select("*")
        .eq("tracked_racket_id", insertedTracked.id)
        .order("created_at", { ascending: true });

      if (freshTasksError) {
        throw freshTasksError;
      }

      newTrackedRacket.tasks =
        freshTasks?.map((task) => ({
          id: task.id,
          label: task.label,
          completed: task.completed,
          isCustom: task.is_custom,
        })) ?? newTrackedRacket.tasks;

      setTrackedRackets((prev) => [newTrackedRacket, ...prev]);
      setSelectedTrackedId(insertedTracked.id);
      setSaveMessage("Racket added to maintenance tracker.");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to add racket to tracker."
      );
    } finally {
      setSubmittingTrackId(null);
    }
  };

  const removeTrackedRacket = async (trackedId: string) => {
    try {
      setPageError("");
      setSaveMessage("");

      const { error } = await supabase
        .from("tracked_rackets")
        .delete()
        .eq("id", trackedId);

      if (error) {
        throw error;
      }

      const remainingAfterDelete = trackedRackets.filter(
        (racket) => racket.trackedId !== trackedId
      );

      setTrackedRackets(remainingAfterDelete);

      if (selectedTrackedId === trackedId) {
        setSelectedTrackedId(
          remainingAfterDelete.length > 0 ? remainingAfterDelete[0].trackedId : null
        );
      }

      setSaveMessage("Tracked racket removed.");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to remove tracked racket."
      );
    }
  };

  const updateLocalTrackedRacket = (
    trackedId: string,
    updater: (racket: TrackedRacket) => TrackedRacket
  ) => {
    setTrackedRackets((prev) =>
      prev.map((racket) =>
        racket.trackedId === trackedId ? updater(racket) : racket
      )
    );
  };

  const saveTrackedRacketDetails = async (
    trackedId: string,
    updates: Partial<{
      condition: TrackedRacket["condition"];
      lastRestrung: string | null;
      lastGripChange: string | null;
      notes: string;
    }>
  ) => {
    try {
      setSavingDetails(true);
      setPageError("");
      setSaveMessage("");

      const dbUpdates: Record<string, string | null> = {};

      if (updates.condition !== undefined) {
        dbUpdates.condition = updates.condition;
      }

      if (updates.lastRestrung !== undefined) {
        dbUpdates.last_restrung = updates.lastRestrung;
      }

      if (updates.lastGripChange !== undefined) {
        dbUpdates.last_grip_change = updates.lastGripChange;
      }

      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }

      const { error } = await supabase
        .from("tracked_rackets")
        .update(dbUpdates)
        .eq("id", trackedId);

      if (error) {
        throw error;
      }

      updateLocalTrackedRacket(trackedId, (racket) => ({
        ...racket,
        condition: updates.condition ?? racket.condition,
        lastRestrung:
          updates.lastRestrung !== undefined
            ? updates.lastRestrung
            : racket.lastRestrung,
        lastGripChange:
          updates.lastGripChange !== undefined
            ? updates.lastGripChange
            : racket.lastGripChange,
        notes: updates.notes !== undefined ? updates.notes : racket.notes,
      }));

      setSaveMessage("Maintenance details saved.");
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to save maintenance details."
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const toggleTask = async (trackedId: string, taskId: string, nextValue: boolean) => {
    const previousRackets = trackedRackets;

    updateLocalTrackedRacket(trackedId, (racket) => ({
      ...racket,
      tasks: racket.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: nextValue } : task
      ),
    }));

    try {
      setPageError("");
      setSaveMessage("");

      const { error } = await supabase
        .from("maintenance_tasks")
        .update({ completed: nextValue })
        .eq("id", taskId);

      if (error) {
        throw error;
      }

      setSaveMessage("Task updated.");
    } catch (err) {
      setTrackedRackets(previousRackets);
      setPageError(err instanceof Error ? err.message : "Failed to update task.");
    }
  };

  const addCustomTask = async () => {
    if (!selectedTrackedRacket) return;

    const trimmed = newTaskLabel.trim();
    if (!trimmed) return;

    try {
      setAddingTask(true);
      setPageError("");
      setSaveMessage("");

      const { data, error } = await supabase
        .from("maintenance_tasks")
        .insert({
          tracked_racket_id: selectedTrackedRacket.trackedId,
          label: trimmed,
          completed: false,
          is_custom: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      updateLocalTrackedRacket(selectedTrackedRacket.trackedId, (racket) => ({
        ...racket,
        tasks: [
          ...racket.tasks,
          {
            id: data.id,
            label: data.label,
            completed: data.completed,
            isCustom: data.is_custom,
          },
        ],
      }));

      setNewTaskLabel("");
      setSaveMessage("Custom task added.");
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Failed to add task.");
    } finally {
      setAddingTask(false);
    }
  };

  const deleteCustomTask = async (trackedId: string, taskId: string) => {
    const previousRackets = trackedRackets;

    updateLocalTrackedRacket(trackedId, (racket) => ({
      ...racket,
      tasks: racket.tasks.filter((task) => task.id !== taskId),
    }));

    try {
      setPageError("");
      setSaveMessage("");

      const { error } = await supabase
        .from("maintenance_tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        throw error;
      }

      setSaveMessage("Custom task deleted.");
    } catch (err) {
      setTrackedRackets(previousRackets);
      setPageError(err instanceof Error ? err.message : "Failed to delete task.");
    }
  };

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="fixed inset-0 -z-10 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200" />

        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Maintenance Tracker
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/90">
            Search for rackets you own, add them to your tracker, and keep up
            with restringing, grip changes, inspections, and custom maintenance
            tasks.
          </p>
        </div>

        {(pageError || saveMessage) && (
          <div className="mb-6 space-y-3">
            {pageError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
                {pageError}
              </div>
            )}

            {saveMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
                {saveMessage}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.25fr]">
          <div className="rounded-3xl bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-slate-800">Find Your Racket</h2>
            <p className="mt-2 text-sm text-slate-600">
              Search your database and add rackets you want to maintain.
            </p>

            <input
              type="text"
              placeholder="Search racket, brand, balance, weight..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />

            <div className="mt-6 max-h-[1100px] space-y-3 overflow-y-auto pr-2">
              {loadingRackets && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
                  Loading rackets...
                </div>
              )}
              {!loadingRackets && filteredRackets.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
                  No rackets found.
                </div>
              )}

              {!loadingRackets &&
                filteredRackets.map((racket) => {
                  const alreadyTracked = trackedRackets.some(
                    (tracked) => tracked.racketId === racket.racket_id
                  );

                  return (
                    <div
                      key={racket.racket_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {formatRacketName(racket.name)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {getBrandName(racket.manufacturer)} •{" "}
                            {racket.weight ?? "N/A"} • {racket.balance ?? "N/A"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Stiffness: {racket.stiffness ?? "N/A"}
                          </p>
                        </div>

                        <button
                          onClick={() => addRacketToTracker(racket)}
                          disabled={alreadyTracked || submittingTrackId === racket.racket_id}
                          className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {alreadyTracked
                            ? "Tracked"
                            : submittingTrackId === racket.racket_id
                            ? "Adding..."
                            : "Track"}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">
                  Your Tracked Rackets
                </h2>
                <span className="text-sm text-slate-600">
                  {trackedRackets.length} tracked
                </span>
              </div>

              {loadingTracked ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Loading your tracked rackets...
                </div>
              ) : trackedRackets.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  No rackets tracked yet.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {trackedRackets.map((racket) => (
                    <div
                      key={racket.trackedId}
                      onClick={() => setSelectedTrackedId(racket.trackedId)}
                      className={`cursor-pointer rounded-2xl border p-4 text-left shadow-sm transition ${
                        selectedTrackedId === racket.trackedId
                          ? "border-amber-300 bg-amber-50"
                          : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">
                            {formatRacketName(racket.name)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">{racket.brand}</p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackedRacket(racket.trackedId);
                          }}
                          className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${getConditionClasses(
                            racket.condition
                          )}`}
                        >
                          {racket.condition}
                        </span>
                      </div>

                      <div className="mt-4 space-y-1 text-sm text-slate-600">
                        <p>
                          <span className="font-medium text-slate-700">Last restrung:</span>{" "}
                          {formatDisplayDate(racket.lastRestrung)}
                        </p>
                        <p>
                          <span className="font-medium text-slate-700">Last grip change:</span>{" "}
                          {formatDisplayDate(racket.lastGripChange)}
                        </p>
                      </div>
                    </div>
                    ))}
                </div>
              )}
            </div>
            <div className="rounded-3xl bg-white/85 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-slate-800">
                Maintenance Details
            </h2>

            {!selectedTrackedRacket ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                Select a tracked racket to manage maintenance.
                </div>
            ) : (
                <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-800">
                    {formatRacketName(selectedTrackedRacket.name)}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                    {selectedTrackedRacket.brand} • {selectedTrackedRacket.weight} •{" "}
                    {selectedTrackedRacket.balance} • {selectedTrackedRacket.stiffness}
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Condition
                        </label>
                        <select
                        value={selectedTrackedRacket.condition}
                        onChange={(e) =>
                            saveTrackedRacketDetails(selectedTrackedRacket.trackedId, {
                            condition: e.target.value as
                                | "Excellent"
                                | "Good"
                                | "Fair"
                                | "Needs Attention",
                            })
                        }
                        disabled={savingDetails}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                        >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Needs Attention">Needs Attention</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Last Restrung
                        </label>
                        <input
                        type="date"
                        value={selectedTrackedRacket.lastRestrung ?? ""}
                        onChange={(e) =>
                            saveTrackedRacketDetails(selectedTrackedRacket.trackedId, {
                            lastRestrung: e.target.value || null,
                            })
                        }
                        disabled={savingDetails}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Last Grip Change
                        </label>
                        <input
                        type="date"
                        value={selectedTrackedRacket.lastGripChange ?? ""}
                        onChange={(e) =>
                            saveTrackedRacketDetails(selectedTrackedRacket.trackedId, {
                            lastGripChange: e.target.value || null,
                            })
                        }
                        disabled={savingDetails}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                        />
                    </div>
                    </div>

                    <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Notes
                    </label>
                    <textarea
                        value={selectedTrackedRacket.notes}
                        onChange={(e) =>
                        saveTrackedRacketDetails(selectedTrackedRacket.trackedId, {
                            notes: e.target.value,
                        })
                        }
                        disabled={savingDetails}
                        rows={4}
                        placeholder="Add notes about tension, wear, damage, or feel..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold text-slate-800">Checklist</h3>
                    <span className="text-sm text-slate-500">
                        {
                        selectedTrackedRacket.tasks.filter((task) => task.completed).length
                        }
                        /{selectedTrackedRacket.tasks.length} completed
                    </span>
                    </div>

                    <div className="mt-4 space-y-3">
                    {selectedTrackedRacket.tasks.map((task) => (
                        <div
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                        >
                        <label className="flex items-center gap-3 text-sm text-slate-700">
                            <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) =>
                                toggleTask(
                                selectedTrackedRacket.trackedId,
                                task.id,
                                e.target.checked
                                )
                            }
                            className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span
                            className={
                                task.completed
                                ? "text-slate-400 line-through"
                                : "text-slate-700"
                            }
                            >
                            {task.label}
                            </span>
                        </label>

                        {task.isCustom && (
                            <button
                            onClick={() =>
                                deleteCustomTask(selectedTrackedRacket.trackedId, task.id)
                            }
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
                            >
                            Delete
                            </button>
                        )}
                        </div>
                    ))}
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                        value={newTaskLabel}
                        onChange={(e) => setNewTaskLabel(e.target.value)}
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                        placeholder="Add a custom maintenance task..."
                    />
                    <button
                        onClick={addCustomTask}
                        disabled={addingTask}
                        className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                        {addingTask ? "Adding..." : "Add Task"}
                    </button>
                    </div>
                </div>
                </div>
            )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}