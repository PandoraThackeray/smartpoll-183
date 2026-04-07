"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

import { getFallbackOptionLabels } from "@/lib/poll-store";

type ResultsBarsProps = {
  options: string[];
  votes: number[];
  compact?: boolean;
  highlightIndex?: number | null;
};

export function ResultsBars({
  options,
  votes,
  compact = false,
  highlightIndex = null,
}: ResultsBarsProps) {
  const totalVotes = votes.reduce((sum, vote) => sum + vote, 0);
  const labels =
    options.length > 0
      ? options
      : getFallbackOptionLabels(Math.max(votes.length, 2));

  return (
    <div className="space-y-3">
      {labels.map((option, index) => {
        const voteCount = votes[index] ?? 0;
        const ratio = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isLeading =
          highlightIndex !== null
            ? highlightIndex === index
            : voteCount > 0 && voteCount === Math.max(...votes, 0);

        return (
          <div
            key={`${option}-${index}`}
            className={`rounded-3xl border border-border bg-slate-50/70 ${
              compact ? "p-3" : "p-4"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isLeading ? "text-primary" : "text-text"
                  }`}
                >
                  {option}
                </span>
                {isLeading ? (
                  <span className="chip border-primary/20 bg-primary/10 text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Leading
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-text">{voteCount}</p>
                <p className="font-[var(--font-plex-mono)] text-xs text-text-muted">
                  {ratio.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(ratio, totalVotes ? 6 : 0)}%` }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  isLeading ? "bg-primary" : "bg-secondary"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
