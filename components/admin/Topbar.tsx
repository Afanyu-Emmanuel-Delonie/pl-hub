"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LogOut, User, Menu } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { useAuth } from "@/lib/auth";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Staff";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 md:gap-6 md:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <SearchBar />
      </div>

      <div className="relative shrink-0" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-slate-100 transition-colors sm:px-2"
        >
          <span className="hidden text-sm text-slate-500 sm:inline">{displayName}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xs font-semibold text-brand">
            {displayName.slice(0, 2).toUpperCase()}
          </span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
            <div className="border-b border-slate-100 px-4 pb-2.5 pt-1">
              <p className="text-sm font-medium text-slate-800">{displayName}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={() => logout()}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
