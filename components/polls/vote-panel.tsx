"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, LoaderCircle, Vote } from "lucide-react";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";

import { ResultsBars } from "@/components/polls/results-bars";
import { contractAddress, readQuestionMaybe, readVotes, readVoted, smartPollAbi } from "@/lib/contracts";
import { formatDate } from "@/lib/format";
import { attachChainPollId, getFallbackOptionLabels, logActivity, syncVotesForPoll, upsertPoll, type StoredPoll } from "@/lib/poll-store";

type TxPhase =
  | "idle"
  | "preparing"
  | "waiting wallet"
  | "pending"
  | "confirmed"
  | "failed";

type VotePanelProps = {
  poll: StoredPoll;
};

export function VotePanel({ poll }: VotePanelProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [chainVotes, setChainVotes] = useState<number[]>(poll.lastVotes ?? []);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [loadingVotes, setLoadingVotes] = useState<boolean>(true);
  const [questionProbe, setQuestionProbe] = useState<string | null>(null);
  const [attachId, setAttachId] = useState(
    poll.chainPollId !== null ? String(poll.chainPollId) : "",
  );

  const wrongNetwork = isConnected && chainId !== base.id;

  const labels = useMemo(() => {
    const count = Math.max(
      poll.options.length,
      chainVotes.length,
      poll.lastVotes?.length ?? 0,
      2,
    );
    const fallback = getFallbackOptionLabels(count);
    return Array.from({ length: count }, (_, index) => poll.options[index] ?? fallback[index]);
  }, [chainVotes.length, poll.lastVotes?.length, poll.options]);

  const totalVotes = chainVotes.reduce((sum, vote) => sum + vote, 0);
  const leadingIndex =
    chainVotes.length > 0
      ? chainVotes.indexOf(Math.max(...chainVotes))
      : null;

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: Boolean(txHash) },
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (poll.chainPollId === null) {
        setLoadingVotes(false);
        return;
      }

      try {
        setLoadingVotes(true);
        const [votes, votedState, maybeQuestion] = await Promise.all([
          readVotes(poll.chainPollId),
          address ? readVoted(poll.chainPollId, address as `0x${string}`) : Promise.resolve(null),
          readQuestionMaybe(poll.chainPollId),
        ]);

        if (cancelled) return;
        setChainVotes(votes);
        setHasVoted(typeof votedState === "boolean" ? votedState : null);
        setQuestionProbe(maybeQuestion);
        syncVotesForPoll(poll.key, votes);
        if (maybeQuestion && !poll.question) {
          upsertPoll({
            key: poll.key,
            chainPollId: poll.chainPollId,
            question: maybeQuestion,
            options: poll.options,
            metadataSource: "onchain-question",
          });
        }
      } catch {
        if (cancelled) return;
        setHasVoted(null);
      } finally {
        if (!cancelled) {
          setLoadingVotes(false);
        }
      }
    }

    refresh();
    const timer = window.setInterval(refresh, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [address, poll.chainPollId, poll.key, poll.options, poll.question]);

  useEffect(() => {
    if (receipt.isPending) {
      setPhase("pending");
      setStatusMessage("Vote submitted. Waiting for Base confirmation.");
    }
  }, [receipt.isPending]);

  useEffect(() => {
    if (!receipt.isSuccess || receipt.data.status !== "success" || !txHash) return;
    setPhase("confirmed");
    setStatusMessage("Vote confirmed. Refreshing the result snapshot.");
    if (selectedOption !== null) {
      logActivity({
        id: `vote-${poll.key}-${txHash}`,
        pollKey: poll.key,
        chainPollId: poll.chainPollId,
        type: "voted",
        timestamp: new Date().toISOString(),
        actor: address,
        optionIndex: selectedOption,
        txHash,
      });
    }

    if (poll.chainPollId !== null) {
      readVotes(poll.chainPollId)
        .then((votes) => {
          setChainVotes(votes);
          setHasVoted(true);
          syncVotesForPoll(poll.key, votes);
        })
        .catch(() => undefined);
    }
  }, [address, poll.chainPollId, poll.key, receipt.data, receipt.isSuccess, selectedOption, txHash]);

  async function handleVote() {
    if (poll.chainPollId === null) {
      setPhase("failed");
      setStatusMessage("Attach the onchain poll ID before voting.");
      return;
    }

    if (selectedOption === null) {
      setPhase("failed");
      setStatusMessage("Choose one option before casting a vote.");
      return;
    }

    if (!isConnected) {
      setPhase("failed");
      setStatusMessage("Connect a wallet before voting.");
      return;
    }

    if (wrongNetwork) {
      setPhase("failed");
      setStatusMessage("Switch your wallet to Base first.");
      return;
    }

    if (hasVoted) {
      setPhase("failed");
      setStatusMessage("This wallet already voted on the selected poll.");
      return;
    }

    try {
      setPhase("preparing");
      setStatusMessage("Preparing vote transaction.");
      setPhase("waiting wallet");
      setStatusMessage("Confirm the vote request in your wallet.");
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: smartPollAbi,
        functionName: "vote",
        args: [BigInt(poll.chainPollId), BigInt(selectedOption)],
      });
      setTxHash(hash);
      setPhase("pending");
      setStatusMessage("Vote transaction sent. Waiting for confirmation.");
    } catch (error) {
      setPhase("failed");
      setStatusMessage(error instanceof Error ? error.message : "Vote failed.");
    }
  }

  function handleCopyLink() {
    navigator.clipboard
      .writeText(`${window.location.origin}/poll/${poll.key}`)
      .then(() => {
        setStatusMessage("Poll link copied.");
      })
      .catch(() => {
        setStatusMessage("Could not copy the poll link.");
      });
  }

  function handleAttachId() {
    const parsed = Number(attachId);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setStatusMessage("Enter a valid numeric poll ID.");
      setPhase("failed");
      return;
    }
    attachChainPollId(poll.key, parsed);
    setStatusMessage(`Attached chain poll ID #${parsed}.`);
    setPhase("confirmed");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="panel p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="section-title">Poll Focus</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-extrabold tracking-tight">
                {poll.question ||
                  questionProbe ||
                  `Poll #${poll.chainPollId ?? "Metadata pending"}`}
              </h1>
              <p className="mt-3 text-sm text-text-muted">
                Created {formatDate(poll.createdAt)}. Metadata source:{" "}
                <span className="font-semibold text-text">{poll.metadataSource}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-text"
            >
              <Copy className="h-4 w-4" />
              Copy link
            </button>
          </div>
        </div>

        <div className="panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-title">Cast Vote</p>
              <p className="mt-2 text-sm text-text-muted">
                Select one option. Each address can vote once per poll.
              </p>
            </div>
            {hasVoted ? (
              <span className="chip border-primary/20 bg-primary/10 text-primary">
                Already Voted
              </span>
            ) : (
              <span className="chip border-secondary/20 bg-secondary/10 text-secondary">
                Open
              </span>
            )}
          </div>

          <div className="space-y-3">
            {labels.map((label, index) => {
              const selected = selectedOption === index;
              return (
                <button
                  key={`${label}-${index}`}
                  type="button"
                  onClick={() => setSelectedOption(index)}
                  className={`flex w-full items-start justify-between rounded-[26px] border px-4 py-4 text-left transition ${
                    selected
                      ? "border-primary bg-primary/8 shadow-sm"
                      : "border-border bg-slate-50 hover:border-primary/40"
                  }`}
                >
                  <div>
                    <p className="text-base font-bold text-text">{label}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      Current votes: {chainVotes[index] ?? 0}
                    </p>
                  </div>
                  <div
                    className={`mt-1 h-5 w-5 rounded-full border-2 ${
                      selected ? "border-primary bg-primary" : "border-border"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleVote}
              disabled={poll.chainPollId === null || receipt.isPending || loadingVotes}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {phase === "pending" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Vote className="h-4 w-4" />
              )}
              Cast Vote
            </button>
            <div className="rounded-full border border-border px-4 py-3 font-[var(--font-plex-mono)] text-xs text-text-muted">
              {poll.chainPollId !== null ? `pollId=${poll.chainPollId}` : "pollId missing"}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {statusMessage ? (
              <motion.div
                key={statusMessage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`mt-5 rounded-[22px] border px-4 py-3 text-sm ${
                  phase === "failed"
                    ? "border-danger/20 bg-danger/10 text-danger"
                    : phase === "confirmed"
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                <p className="font-semibold uppercase tracking-[0.16em]">{phase}</p>
                <p className="mt-1 normal-case tracking-normal">{statusMessage}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="panel p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-title">Poll Results</p>
              <p className="mt-2 text-sm text-text-muted">
                Live snapshot from `getVotes`.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold">{totalVotes}</p>
              <p className="text-sm text-text-muted">Total Votes</p>
            </div>
          </div>
          <ResultsBars
            options={poll.options}
            votes={chainVotes.length > 0 ? chainVotes : poll.lastVotes ?? []}
            highlightIndex={leadingIndex}
          />
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="section-title">Metadata Recovery</p>
          <p className="mt-3 text-sm text-text-muted">
            This contract does not provide a dependable poll indexer. If the app
            cannot infer the chain poll ID after creation, attach it manually here.
          </p>
          <div className="mt-4 flex gap-3">
            <input
              value={attachId}
              onChange={(event) => setAttachId(event.target.value)}
              placeholder="Poll ID"
              className="min-w-0 flex-1 rounded-[20px] border border-border bg-slate-50 px-4 py-3 outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAttachId}
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Attach ID
            </button>
          </div>
          <p className="mt-3 text-sm text-text-muted">
            Optional question probe: {questionProbe ?? "No onchain question found"}
          </p>
        </section>
      </aside>
    </div>
  );
}
