"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BarChart3, ChevronRight } from "lucide-react";
import { useAccount } from "wagmi";

import { ResultsBars } from "@/components/polls/results-bars";
import { formatDate } from "@/lib/format";
import { useSmartPollBoard } from "@/lib/use-smartpoll-board";

type SortMode = "votes" | "recent" | "mine";

export function ResultsPage() {
  const { state } = useSmartPollBoard();
  const { address } = useAccount();
  const [sortMode, setSortMode] = useState<SortMode>("votes");

  const sortedPolls = useMemo(() => {
    const polls = [...state.polls];
    if (sortMode === "votes") {
      return polls.sort(
        (a, b) =>
          (b.lastVotes?.reduce((sum, item) => sum + item, 0) ?? 0) -
          (a.lastVotes?.reduce((sum, item) => sum + item, 0) ?? 0),
      );
    }
    if (sortMode === "mine") {
      return polls.sort((a, b) => {
        const aMine =
          a.creatorAddress &&
          address &&
          a.creatorAddress.toLowerCase() === address.toLowerCase();
        const bMine =
          b.creatorAddress &&
          address &&
          b.creatorAddress.toLowerCase() === address.toLowerCase();
        return Number(Boolean(bMine)) - Number(Boolean(aMine));
      });
    }
    return polls.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [address, sortMode, state.polls]);

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-title">Results</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-text">
              Vote distribution and momentum
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-text-muted">
              Compare proposals by participation, inspect live percentages, and
              jump into the discussion that needs attention.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: "votes", label: "Most Votes" },
              { key: "recent", label: "Recent" },
              { key: "mine", label: "Created By Me" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setSortMode(item.key as SortMode)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  sortMode === item.key
                    ? "bg-slate-900 text-white"
                    : "border border-border bg-white text-text-muted"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4">
        {sortedPolls.length > 0 ? (
          sortedPolls.map((poll) => (
            <div
              key={poll.key}
              className="panel grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.7fr_1.3fr]"
            >
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Poll Results
                </div>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text">
                  {poll.question || `Poll #${poll.chainPollId ?? poll.key}`}
                </h2>
                <p className="mt-3 text-sm text-text-muted">
                  Updated from cached `getVotes` snapshots. Created {formatDate(poll.createdAt)}.
                </p>
                <Link
                  href={`/poll/${poll.key}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text"
                >
                  Open detail
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <ResultsBars options={poll.options} votes={poll.lastVotes ?? []} compact />
            </div>
          ))
        ) : (
          <div className="panel p-8 text-center">
            <p className="text-2xl font-extrabold tracking-tight text-text">
              No tracked results yet
            </p>
            <p className="mt-3 text-sm text-text-muted">
              Result bars appear once a tracked poll has a known chain poll ID and a
              refreshed `getVotes` snapshot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
