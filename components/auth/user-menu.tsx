"use client";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = (user.email ?? "U")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
          {initials}
        </span>
        <ChevronDown className="size-3.5 text-slate-500" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
          <div className="border-b border-slate-100 px-3 py-2">
            <p className="truncate text-xs text-slate-600">{user.email}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <UserCircle className="size-4 text-slate-500" />
            Profile
          </Link>

          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="size-4 text-slate-500" />
              Sign Out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
