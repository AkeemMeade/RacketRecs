"use client";

import { useState, useEffect } from "react";
import { Outfit } from "next/font/google";
import { useUser } from "@/lib/UserContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "700"] });

interface Favorite {
  racket_id: string;
  racket: { name: string; img_url: string };
}

interface Notification {
  id: number;
  racket_id: number;
  retailer_id: number;
  notified_at: string;
  read: boolean;
  racket: {
    name: string;
    img_url: string;
  };
  retailer: {
    name: string;
  };
}

const truncate = (name: string, wordCount = 3): string =>
  name
    .split("-")
    .slice(0, wordCount)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const getRetailerDisplayName = (name: string) => {
  const nameMap: { [key: string]: string } = {
    yumo: "Yumo",
    joybadminton: "Joy Badminton",
    therallyshop: "The Rally Shop",
  };
  return nameMap[name.toLowerCase()] || name;
};

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function FavoritesPage() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function fetchFavorites() {
      try {
        const favRes = await fetch(`/api/rackets/fav?userId=${user?.id}`);
        const favData = await favRes.json();
        setFavorites(favData);

        // Fetch notifications
        const notifRes = await fetch(`/api/notifications?userId=${user.id}`);
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.filter((n: Notification) => !n.read));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  const markAsRead = async (notificationId: number) => {
    if (!user) return;

    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, userId: user.id }),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const dismissAllNotifications = async () => {
    if (!user) return;

    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      setNotifications([]);
    } catch (err) {
      console.error("Failed to dismiss notifications:", err);
    }
  };

  const goToRacket = (racketId: number, notificationId?: number) => {
    if (notificationId) {
      markAsRead(notificationId);
    }
    router.push(`/rackets/${racketId}`);
  };

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-8">
          Your Favorites
        </h1>
        {/* Notification Banner */}
        {notifications.length > 0 && user && (
          <div className="mb-6 rounded-2xl bg-blue-50 shadow-xl ring-2 ring-blue-200 backdrop-blur-md">
            <div className="px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Back in Stock ({notifications.length})
                </h2>
              </div>
              <button
                onClick={dismissAllNotifications}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Dismiss all
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    goToRacket(notification.racket_id, notification.id)
                  }
                  className="w-full flex items-center gap-4 rounded-xl bg-white px-4 py-3 ring-1 ring-blue-100 hover:ring-blue-300 hover:bg-blue-50 transition text-left"
                >
                  {/* Racket Image */}
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={
                        notification.racket.img_url || "/placeholder-racket.png"
                      }
                      alt={notification.racket.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      {truncate(notification.racket.name, 3)} is back in stock!
                    </p>
                    <p className="text-xs text-slate-600">
                      Now available at{" "}
                      {getRetailerDisplayName(notification.retailer.name)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-blue-500 text-lg">→</div>
                </button>
              ))}
            </div>
          </div>
        )}
        <SectionCard
          title="Favorites"
          subtitle={`${favorites.length} saved racket${favorites.length !== 1 ? "s" : ""}`}
        >
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : !user ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">
                Sign in to see favorites.
              </p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-center ring-1 ring-slate-100">
              <p className="text-sm text-slate-500">No favorites yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((fav) => (
                <Link
                  key={fav.racket_id}
                  href={`/rackets/${fav.racket_id}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 hover:ring-blue-400 hover:bg-blue-50 transition"
                >
                  <img
                    src={fav.racket?.img_url || "/placeholder-racket.png"}
                    alt={fav.racket?.name}
                    className="h-12 w-12 object-contain shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-800">
                    {truncate(fav.racket?.name || "", 3)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </main>
  );
}
