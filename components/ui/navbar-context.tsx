"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface NavbarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const NavbarContext = createContext<NavbarContextType>({
  open: false,
  setOpen: () => {},
  isDark: false,
  setIsDark: () => {},
});

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("darkMode");
    if (stored === "true") setIsDark(true);
  }, []);

  const handleSetIsDark = (val: boolean) => {
    setIsDark(val);
    localStorage.setItem("darkMode", String(val));
  };

  return (
    <NavbarContext.Provider value={{ open, setOpen, isDark, setIsDark: handleSetIsDark }}>
      {children}
    </NavbarContext.Provider>
  );
}

export const useNavbar = () => useContext(NavbarContext);