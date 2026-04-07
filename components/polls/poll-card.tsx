"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, Dot, Vote } from "lucide-react";

import { formatRelative } from "@/lib/format";
import type { StoredPoll } from "@/lib/poll-store";

type PollCardProps = {
  poll: StoredPoll;
  totalVotes: number;
  leadingLabel: string;
  hasVoted: boolean;
};

export function PollCard({
  poll,
  totalVotes,
  leadingLabel,
  hasVoted,
}: PollCardProps) {
  return (
    <Link
      href={`/poll/${poll.key}`}
      className="group block rounded-[30px] border border-border bg-white p-5 shadow-panel transition hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="chip border-secondary/25 bg-secondary/10 text-secondary">
              Active
            </span>
            <span
              className={`chip ${
                hasVoted
                  ? "border-primary/25 bg-primary/10 text-primary"
                  : "bg-white text-text-muted"
              }`}
            >
              {hasVoted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {hasVoted ? "Voted" : "Not voted"}
            </span>
            {poll.metadataSource !== "local-cache" ? (
              <span className="chip">
                <Dot className="h-3.5 w-3.5" />
                {poll.metadataSource === "unknown"
                  ? "Needs metadata"
                  : "Local metadata"}
              </span>
            ) : null}
          </div>
          <h3 className="max-w-2xl text-xl font-extrabold tracking-tight text-text">
            {poll.question || `Poll #${poll.chainPollId ?? poll.key}`}
          </h3>
        </div>
        <div className="rounded-2xl bg-slate-900 p-3 text-white">
          <Vote className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-3 rounded-[24px] bg-slate-50 p-4 sm:grid-cols-3">
        <div>
          <p className="section-title">Options</p>
          <p className="mt-1 text-xl font-bold text-text">{poll.options.length || "--"}</p>
        </div>
        <div>
          <p className="section-title">Leading Option</p>
          <p className="mt-1 text-sm font-semibold text-text">
            {leadingLabel || "Unavailable"}
          </p>
        </div>
        <div>
          <p className="section-title">Total Votes</p>
          <p className="mt-1 text-xl font-bold text-text">{totalVotes}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-text-muted">
        <span>{formatRelative(poll.createdAt)}</span>
        <span className="inline-flex items-center gap-2 font-semibold text-primary">
          Open poll
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
