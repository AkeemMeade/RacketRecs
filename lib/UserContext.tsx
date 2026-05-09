"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const supabase = createClient();

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchAdmin = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("is_admin")
      .eq("user_id", userId)
      .single();
    setIsAdmin(data?.is_admin === true);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setError(authError.message);
          setUser(null);
        } else {
          setUser(data.user);
          setError(null);
          if (data.user) await fetchAdmin(data.user.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        fetchAdmin(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, error, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
