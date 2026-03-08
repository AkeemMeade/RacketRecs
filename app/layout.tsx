import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { NavbarProvider } from "@/components/ui/navbar-context";
import { SideNavbar } from "@/components/SideNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RacketRecs",
  description: "Find your personalized own racket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavbarProvider>
          <SideNavbar />
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </NavbarProvider>
      </body>
    </html>
  );
}
