"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, PlusCircle, RadioTower } from "lucide-react";
import { useAccount } from "wagmi";

import { PollCard } from "@/components/polls/poll-card";
import { PollFilters, type PollFilter } from "@/components/polls/poll-filters";
import { shortAddress } from "@/lib/format";
import { useSmartPollBoard } from "@/lib/use-smartpoll-board";

export function HubPage() {
  const { state, createImportedPoll } = useSmartPollBoard();
  const { address } = useAccount();
  const [filter, setFilter] = useState<PollFilter>("all");
  const [importId, setImportId] = useState("");
  const [importQuestion, setImportQuestion] = useState("");
  const [importOptions, setImportOptions] = useState("");

  const createdByUser = useMemo(
    () =>
      state.polls.filter(
        (poll) =>
          poll.creatorAddress &&
          address &&
          poll.creatorAddress.toLowerCase() === address.toLowerCase(),
      ),
    [address, state.polls],
  );

  const votedKeys = new Set(
    state.activities.filter((item) => item.type === "voted").map((item) => item.pollKey),
  );

  const filteredPolls = useMemo(() => {
    return state.polls.filter((poll) => {
      if (filter === "all") return true;
      if (filter === "active") return true;
      if (filter === "voted") return votedKeys.has(poll.key);
      if (filter === "created") {
        return (
          poll.creatorAddress &&
          address &&
          poll.creatorAddress.toLowerCase() === address.toLowerCase()
        );
      }
      return true;
    });
  }, [address, filter, state.polls, votedKeys]);

  const totalVotes = state.polls.reduce(
    (sum, poll) => sum + (poll.lastVotes?.reduce((acc, value) => acc + value, 0) ?? 0),
    0,
  );

  const summaryCards = [
    {
      label: "Active Polls",
      value: state.polls.length,
      tone: "bg-white",
    },
    {
      label: "Total Votes",
      value: totalVotes,
      tone: "bg-primary text-white",
    },
    {
      label: "Created By You",
      value: createdByUser.length,
      tone: "bg-white",
    },
  ];

  function handleImport() {
    const chainPollId = Number(importId);
    if (!Number.isInteger(chainPollId) || chainPollId < 0) return;
    createImportedPoll({
      chainPollId,
      question: importQuestion.trim(),
      options: importOptions
        .split("\n")
        .map((entry) => entry.trim())
        .filter(Boolean),
    });
    setImportId("");
    setImportQuestion("");
    setImportOptions("");
  }

  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="section-title">Poll Hub</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight text-text">
              Community decisions on Base
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-text-muted">
              Browse proposals, track vote momentum, and launch structured polls for
              your DAO or contributor circle.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                <PlusCircle className="h-4 w-4" />
                Create Poll
              </Link>
              <div className="chip border-primary/20 bg-primary/10 text-primary">
                <Compass className="h-3.5 w-3.5" />
                {address ? shortAddress(address) : "Wallet optional for browsing"}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {summaryCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`rounded-[26px] border border-border p-5 ${card.tone}`}
              >
                <p className="section-title">{card.label}</p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">{card.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 rounded-[26px] border border-border bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="section-title">Proposal Stream</p>
              <p className="mt-2 text-sm text-text-muted">
                Filter by activity to focus on the proposals that matter now.
              </p>
            </div>
            <PollFilters value={filter} onChange={setFilter} />
          </div>

          <div className="space-y-4">
            {filteredPolls.length > 0 ? (
              filteredPolls.map((poll) => {
                const votes = poll.lastVotes ?? [];
                const leadingIndex = votes.length > 0 ? votes.indexOf(Math.max(...votes)) : -1;
                const leadingLabel =
                  leadingIndex >= 0
                    ? poll.options[leadingIndex] ?? `Option ${leadingIndex + 1}`
                    : "No votes yet";
                return (
                  <PollCard
                    key={poll.key}
                    poll={poll}
                    totalVotes={votes.reduce((sum, vote) => sum + vote, 0)}
                    leadingLabel={leadingLabel}
                    hasVoted={votedKeys.has(poll.key)}
                  />
                );
              })
            ) : (
              <div className="panel p-8 text-center">
                <p className="text-2xl font-extrabold tracking-tight text-text">
                  No polls tracked yet
                </p>
                <p className="mt-3 text-sm text-text-muted">
                  Create your first poll or attach an existing chain poll by ID to
                  start building the governance hub.
                </p>
                <Link
                  href="/create"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                >
                  Create the first poll
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <section className="panel p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <RadioTower className="h-5 w-5" />
              </div>
              <div>
                <p className="section-title">Track Existing Poll</p>
                <p className="mt-1 text-sm text-text-muted">
                  Attach a known poll ID when onchain list enumeration is unavailable.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={importId}
                onChange={(event) => setImportId(event.target.value)}
                placeholder="Chain poll ID"
                className="w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 outline-none focus:border-primary"
              />
              <textarea
                value={importQuestion}
                onChange={(event) => setImportQuestion(event.target.value)}
                rows={3}
                placeholder="Optional question label"
                className="w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 outline-none focus:border-primary"
              />
              <textarea
                value={importOptions}
                onChange={(event) => setImportOptions(event.target.value)}
                rows={4}
                placeholder={"Optional options, one per line"}
                className="w-full rounded-[20px] border border-border bg-slate-50 px-4 py-3 outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleImport}
                className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Attach Poll
              </button>
            </div>
          </section>

          <section className="panel p-5 sm:p-6">
            <p className="section-title">Read Model</p>
            <ul className="mt-4 space-y-3 text-sm text-text-muted">
              <li>`getVotes(pollId)` drives live totals and result bars.</li>
              <li>`voted(pollId, wallet)` drives the voted state when a poll ID is known.</li>
              <li>Question and options are restored from local cache or manual attach.</li>
            </ul>
          </section>
        </aside>
      </section>
    </div>
  );
}
