"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CircleUserRound, Home, SquarePen } from "lucide-react";

const items = [
  { href: "/", label: "Hub", icon: Home },
  { href: "/create", label: "Create", icon: SquarePen },
  { href: "/results", label: "Results", icon: BarChart3 },
  { href: "/me", label: "Me", icon: CircleUserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-[24px] border border-white/70 bg-white/92 p-2 shadow-panel backdrop-blur">
      <div className="grid grid-cols-4 gap-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-primary text-white"
                  : "text-text-muted hover:bg-slate-100 hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
