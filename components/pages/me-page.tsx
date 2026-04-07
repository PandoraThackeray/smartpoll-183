"use client";

import Link from "next/link";
import { Clock3, FileCheck2, Wallet2 } from "lucide-react";
import { useAccount } from "wagmi";

import { formatDate, shortAddress } from "@/lib/format";
import { useSmartPollBoard } from "@/lib/use-smartpoll-board";

export function MePage() {
  const { state } = useSmartPollBoard();
  const { address, isConnected } = useAccount();

  const createdPolls = state.polls.filter(
    (poll) =>
      poll.creatorAddress &&
      address &&
      poll.creatorAddress.toLowerCase() === address.toLowerCase(),
  );

  const votedPollKeys = new Set(
    state.activities
      .filter(
        (entry) =>
          entry.type === "voted" &&
          entry.actor &&
          address &&
          entry.actor.toLowerCase() === address.toLowerCase(),
      )
      .map((entry) => entry.pollKey),
  );

  const votedPolls = state.polls.filter((poll) => votedPollKeys.has(poll.key));

  return (
    <div className="space-y-6">
      <section className="panel grid gap-5 p-5 sm:p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="section-title">Your Activity</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-text">
            Personal governance dashboard
          </h1>
          <p className="mt-3 max-w-xl text-sm text-text-muted">
            Track what you created, where you voted, and which drafts still need a
            chain poll ID attached.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[24px] border border-border bg-slate-50 p-4">
            <p className="section-title">Wallet</p>
            <p className="mt-2 text-sm font-semibold text-text">
              {isConnected ? shortAddress(address) : "Not connected"}
            </p>
          </div>
          <div className="rounded-[24px] border border-border bg-slate-50 p-4">
            <p className="section-title">Polls Created</p>
            <p className="mt-2 text-2xl font-extrabold">{createdPolls.length}</p>
          </div>
          <div className="rounded-[24px] border border-border bg-slate-50 p-4">
            <p className="section-title">Polls Voted</p>
            <p className="mt-2 text-2xl font-extrabold">{votedPolls.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="section-title">Polls Created</p>
              <p className="mt-1 text-sm text-text-muted">
                Quick access to the proposals you authored.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {createdPolls.length > 0 ? (
              createdPolls.map((poll) => (
                <Link
                  key={poll.key}
                  href={`/poll/${poll.key}`}
                  className="block rounded-[24px] border border-border bg-slate-50 px-4 py-4 transition hover:border-primary/40"
                >
                  <p className="font-semibold text-text">
                    {poll.question || `Poll #${poll.chainPollId ?? poll.key}`}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Created {formatDate(poll.createdAt)}
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                No authored polls stored in this browser yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary/10 p-3 text-secondary">
              <Wallet2 className="h-5 w-5" />
            </div>
            <div>
              <p className="section-title">Polls Voted</p>
              <p className="mt-1 text-sm text-text-muted">
                Recent participation recorded after vote confirmation.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {votedPolls.length > 0 ? (
              votedPolls.map((poll) => (
                <Link
                  key={poll.key}
                  href={`/poll/${poll.key}`}
                  className="block rounded-[24px] border border-border bg-slate-50 px-4 py-4 transition hover:border-primary/40"
                >
                  <p className="font-semibold text-text">
                    {poll.question || `Poll #${poll.chainPollId ?? poll.key}`}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Latest snapshot: {poll.lastVotes?.reduce((sum, item) => sum + item, 0) ?? 0} votes
                  </p>
                </Link>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                No vote activity has been recorded from this wallet in local storage yet.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="panel p-5 sm:p-6">
          <p className="section-title">Draft Recovery</p>
          {state.draft ? (
            <div className="mt-4 rounded-[24px] border border-border bg-slate-50 px-4 py-4">
              <p className="font-semibold text-text">
                {state.draft.question || "Untitled draft"}
              </p>
              <p className="mt-2 text-sm text-text-muted">
                Updated {formatDate(state.draft.updatedAt)}
              </p>
              <Link
                href="/create"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Continue draft
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-text-muted">
              No saved draft in this browser.
            </div>
          )}
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-accent/10 p-3 text-accent">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="section-title">Recent Activity</p>
              <p className="mt-1 text-sm text-text-muted">
                Browser-side timeline for created, attached, and voted polls.
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {state.activities.length > 0 ? (
              state.activities.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-[24px] border border-border bg-slate-50 px-4 py-4"
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-muted">
                    {activity.type}
                  </p>
                  <p className="mt-1 font-semibold text-text">
                    Poll {activity.chainPollId !== null ? `#${activity.chainPollId}` : activity.pollKey}
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                No activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
