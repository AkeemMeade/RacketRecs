"use client";
import { useNavbar } from "./ui/navbar-context";

export function AppBackground() {
  const { isDark } = useNavbar();
  return (
    <div className={`fixed inset-0 -z-10 transition-colors duration-500 ${
      isDark
        ? "bg-gradient-to-b from-slate-900 via-slate-800 to-blue-950"
        : "bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200"
    }`} />
  );
}