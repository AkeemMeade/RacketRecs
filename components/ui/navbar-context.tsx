"use client";
import React, { createContext, useContext, useState } from "react";

const NavbarContext = createContext({ open: true, setOpen: (_: boolean) => {} });

export function NavbarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <NavbarContext.Provider value={{ open, setOpen }}>
      {children}
    </NavbarContext.Provider>
  );
}

export const useNavbar = () => useContext(NavbarContext);