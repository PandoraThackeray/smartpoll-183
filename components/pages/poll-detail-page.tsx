"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VotePanel } from "@/components/polls/vote-panel";
import { useSmartPollBoard } from "@/lib/use-smartpoll-board";

export function PollDetailPage({ pollKey }: { pollKey: string }) {
  const { getByKey } = useSmartPollBoard();
  const poll = getByKey(pollKey);

  if (!poll) {
    return (
      <div className="panel p-8 text-center">
        <p className="section-title">Poll Not Found</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text">
          This poll is not cached in the current browser.
        </h1>
        <p className="mt-3 text-sm text-text-muted">
          Attach the poll from the hub using a known chain poll ID, then reopen the
          detail view.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to hub
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Hub
      </Link>
      <VotePanel poll={poll} />
    </div>
  );
}
