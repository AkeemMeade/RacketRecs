"use client";
import Link from "next/link";
import React from "react";
import { FaBars } from "react-icons/fa6";
import { Outfit } from "next/font/google";
import { useNavbar } from "./ui/navbar-context";
import { FaRegCircleUser } from "react-icons/fa6";
import { FaRegHeart } from "react-icons/fa6";
import { FaRegThumbsUp } from "react-icons/fa6";
import { FaRegCheckSquare } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";
import { FaSignOutAlt } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";
import { useUser } from "@/lib/UserContext";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FaCodeCompare } from "react-icons/fa6";
import { FaWrench } from "react-icons/fa";

const Menus = [
  {
    title: "Profile",
    spacing: true,
    href: "/profile",
    icon: <FaRegCircleUser size={24} />,
  },
  { title: "Favorites", href: "/favorites", icon: <FaRegHeart size={24} /> },
  {
    title: "Recommendations",
    href: "/rackets",
    icon: <FaRegThumbsUp size={24} />,
  },
  {
    title: "Assessments",
    href: "/assessment",
    icon: <FaRegCheckSquare size={24} />,
  },
  // search
  { title: "Search", href: "/rackets", icon: <FaSearch size={22} /> },

  // comparison tool
  { title: "Comparison Tool", href: "/comparison", icon: <FaCodeCompare size={22} /> },

  // maintenence tracker
  { title: "Maintenence Tracker", href: "/maintenance tracker", icon: <FaWrench size={22} /> },
];

const BottomMenus = [
  { title: "Preferences", href: "/settings", icon: <FaGear size={24} /> },
  { title: "Sign Out", href: "/sign-out", icon: <FaSignOutAlt size={24} /> },
];

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const supabase = createClient();

export function SideNavbar() {
  const { open, setOpen } = useNavbar();
  const { user, loading } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
  };

  if (loading || !user) {
    return null;
  }

  const renderMenus = (menu: any, index: number) => (
    <li
      key={index}
      className={` ${outfit.className} text-black font-semibold p-2 flex hover:bg-[#FFC038] rounded-lg
         cursor-pointer gap-x-4 items-center transition-all duration-50 mb-4 ${menu.spacing ? "mt-10" : ""} ${open ? "justify-start" : "justify-center"}`}
      onClick={menu.title === "Sign Out" ? handleSignOut : undefined}
    >
      <Link href={menu.href} className="flex w-full">
        {/* menu.icon */}
        <span className="">{menu.icon}</span>

        <span
          className={`ml-2 overflow-hidden whitespace-nowrap transition-all duration-300 ${open ? "opacity-100 max-w-xs delay-150" : "opacity-0 max-w-0"} 
        text-black`}
        >
          {menu.title}
        </span>
      </Link>
    </li>
  );

  return (
    <div className="flex">
      <div
        // bg-gradient-to-b from-amber-400 to-amber-300
        className={`fixed top-0 left-0 bg-white h-screen p-5 pt-8 transition-all duration-300 ${open ? "w-72" : "w-20"} z-50 shadow-2xl`}
      >
        <div className="flex items-center h-10">
          {/* logo */}
          <div
            className={`${outfit.className} text-2xl font-bold mb-10 text-black ml-15 mt-2 overflow-hidden whitespace-nowrap transition-all duration-300 ${
              open ? "opacity-100 max-w-xs delay-100" : "opacity-0 max-w-0"
            }`}
          >
            RACKETRECS
          </div>

          {/* hamburger menu */}
          <FaBars
            // bg-amber-400 border border-amber-400
            className={`bg-white text-black text-3xl absolute top-5 cursor-pointer ml-1`}
            onClick={() => setOpen(!open)}
          />
        </div>

          {/* Separator Top */}
        <div className="w-full h-[1px] bg-gray-300 mt-1" />

        {/* Top section */}
        <ul className="-mt-4">
          {Menus.map((menu, index) => renderMenus(menu, index))}
        </ul>

        {/* Separator Bottom */}
        <div className="w-full h-[1px] bg-gray-300 mt-10" />

        {/* Bottom section */}
        <ul className="mb-4">
          {BottomMenus.map((menu, index) => renderMenus(menu, index))}
        </ul>
      </div>

      { /*> Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
