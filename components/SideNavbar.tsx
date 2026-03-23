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

const Menus = [
  { title: "favorites", href: "/favorites", icon: <FaRegHeart size={24} /> },
  { title: "Recommendations", href: "/rackets", icon: <FaRegThumbsUp size={24} /> },
  { title: "Assessments", href: "/assessment", icon: <FaRegCheckSquare size={24} /> },

  { title: "Profile", spacing: true, href: "/profile", icon: <FaRegCircleUser size={24} /> },
  { title: "Preferences", href: "/settings", icon: <FaGear size={24} /> },
  { title: "Sign Out", href: "/sign-out", icon: <FaSignOutAlt size={24} /> },
];

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export function SideNavbar() {
  const { open, setOpen } = useNavbar();

  return (
    <div className="flex">
      <div
      // bg-gradient-to-b from-amber-400 to-amber-300
        className={`fixed top-0 left-0 bg-white h-screen p-5 pt-8 transition-all duration-300 ${open ? "w-72" : "w-20"} z-50 shadow-2xl`}
      >

        {/* hamburger menu */}
        <FaBars
        // bg-amber-400 border border-amber-400
          className={`bg-white text-black text-4xl rounded-full absolute top-5 cursor-pointer`}
          onClick={() => setOpen(!open)}
        />

        <ul className="pt-20 z-30">
          {Menus.map((menu, index) => (
              <li
                key={index}
                className={` ${outfit.className} text-black font-semibold p-2 flex hover:bg-amber-500 rounded-lg
                 cursor-pointer gap-x-4 items-center transition-all duration-50 mb-4 ${menu.spacing ? "mt-10" : ""} ${open ? "justify-start" : "justify-center"}`}
              >
                <Link href={menu.href} className="flex w-full">
                  {/* menu.icon */}
                  <span>
                    {menu.icon}
                  </span>

                  <span className={`ml-2 ${open ? "block" : "hidden"} ${outfit.className} text-black`}>{menu.title}</span>
                </Link>
              </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
