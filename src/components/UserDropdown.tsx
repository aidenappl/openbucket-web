"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";

interface UserDropdownProps {
  user: User;
  onLogout: () => void;
}

const UserDropdown = ({ user, onLogout }: UserDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {user.profile_image_url ? (
          <img
            src={user.profile_image_url}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 max-w-[120px] truncate">
          {user.name ?? user.email}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-[10px] text-gray-400"
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 z-50">
          <div className="px-3 py-2 border-b border-gray-200 dark:border-zinc-700">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
              {user.name ?? "—"}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>
          </div>
          <div className="py-1">
            {user.role === "admin" && (
              <a
                href="/admin"
                className="block px-3 py-1.5 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                onClick={() => setOpen(false)}
              >
                Admin
              </a>
            )}
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
