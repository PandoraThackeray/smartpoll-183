"use client";

import Link from "next/link";
import { Vote, Wallet } from "lucide-react";

import { ConnectStrip } from "@/components/wallet/connect-strip";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-shell relative">
      <header className="mb-6 flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/75 p-4 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white">
            <Vote className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-text">
              SmartPoll
            </p>
            <p className="text-sm text-text-muted">
              Governance decisions for communities on Base
            </p>
          </div>
        </Link>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="chip">
            <Wallet className="h-3.5 w-3.5" />
            Base network
          </div>
          <ConnectStrip />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
