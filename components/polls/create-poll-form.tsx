"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";

import { contractAddress, readQuestionMaybe, smartPollAbi } from "@/lib/contracts";
import { clearDraft, logActivity, saveDraft, upsertPoll } from "@/lib/poll-store";

type TxPhase =
  | "idle"
  | "preparing"
  | "waiting wallet"
  | "pending"
  | "confirmed"
  | "failed";

async function discoverPollIdByQuestion(question: string) {
  const maxProbe = 40;
  let match: number | null = null;

  for (let index = 0; index < maxProbe; index += 1) {
    const onchainQuestion = await readQuestionMaybe(index);
    if (!onchainQuestion) continue;
    if (onchainQuestion.trim().toLowerCase() === question.trim().toLowerCase()) {
      match = index;
    }
  }

  return match;
}

export function CreatePollForm({
  initialQuestion,
  initialOptions,
}: {
  initialQuestion: string;
  initialOptions: string[];
}) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();

  const [question, setQuestion] = useState(initialQuestion);
  const [options, setOptions] = useState(
    initialOptions.length >= 2 ? initialOptions : ["", ""],
  );
  const [phase, setPhase] = useState<TxPhase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const cleanOptions = useMemo(
    () => options.map((option) => option.trim()).filter(Boolean),
    [options],
  );
  const invalid = !question.trim() || cleanOptions.length < 2;
  const wrongNetwork = isConnected && chainId !== base.id;

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    saveDraft(question, options);
  }, [options, question]);

  useEffect(() => {
    async function handleConfirmed() {
      if (!txHash || !receipt.isSuccess || receipt.data.status !== "success") return;
      setPhase("confirmed");

      let chainPollId: number | null = null;
      try {
        chainPollId = await discoverPollIdByQuestion(question);
      } catch {
        chainPollId = null;
      }

      const pollKey = chainPollId !== null ? String(chainPollId) : `local-${Date.now()}`;
      upsertPoll({
        key: pollKey,
        chainPollId,
        question: question.trim(),
        options: cleanOptions,
        createdAt: new Date().toISOString(),
        creatorAddress: address,
        txHash,
        metadataSource: chainPollId !== null ? "mixed" : "local-cache",
        awaitingChainId: chainPollId === null,
      });
      logActivity({
        id: `created-${pollKey}-${txHash}`,
        pollKey,
        chainPollId,
        type: "created",
        timestamp: new Date().toISOString(),
        actor: address,
        txHash,
      });
      clearDraft();
      setMessage(
        chainPollId !== null
          ? `Poll confirmed on Base as #${chainPollId}.`
          : "Poll confirmed. Contract does not expose a reliable poll count, so this entry is saved locally until you attach its chain poll ID.",
      );
      router.push(`/poll/${pollKey}`);
    }

    handleConfirmed();
  }, [address, cleanOptions, question, receipt.data, receipt.isSuccess, router, txHash]);

  useEffect(() => {
    if (receipt.isPending) {
      setPhase("pending");
      setMessage("Transaction submitted. Waiting for Base confirmation.");
    }
  }, [receipt.isPending]);

  async function handleCreate() {
    if (invalid) {
      setPhase("failed");
      setMessage("Question and at least 2 options are required.");
      return;
    }

    if (!isConnected) {
      setPhase("failed");
      setMessage("Connect a wallet before creating a poll.");
      return;
    }

    if (wrongNetwork) {
      setPhase("failed");
      setMessage("Switch your wallet to Base first.");
      return;
    }

    try {
      setPhase("preparing");
      setMessage("Preparing poll transaction.");
      setPhase("waiting wallet");
      setMessage("Confirm the createPoll request in your wallet.");
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: smartPollAbi,
        functionName: "createPoll",
        args: [question.trim(), cleanOptions],
      });
      setTxHash(hash);
      setPhase("pending");
      setMessage("Poll transaction sent. Waiting for confirmation.");
    } catch (error) {
      setPhase("failed");
      setMessage(error instanceof Error ? error.message : "Create poll failed.");
    }
  }

  async function simulateMetadataProbe() {
    if (!question.trim()) return;
    try {
      const candidate = await discoverPollIdByQuestion(question);
      if (candidate !== null) {
        setMessage(`Question getter probe found a matching poll at #${candidate}.`);
      } else {
        setMessage("Question getter probe did not find a matching poll yet.");
      }
    } catch {
      setMessage("Question getter probe is not available on this contract.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel p-5 sm:p-6">
        <div className="mb-6">
          <p className="section-title">Build Proposal</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-text">
            Create a new governance poll
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Define the question, structure the options, and publish the decision
            flow on Base.
          </p>
        </div>

        <div className="space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-text">Question</span>
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={4}
              placeholder="What should the community prioritize next quarter?"
              className="w-full rounded-[24px] border border-border bg-slate-50 px-4 py-4 text-base outline-none transition focus:border-primary"
            />
          </label>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">Options</span>
              <button
                type="button"
                onClick={() => setOptions((current) => [...current, ""])}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Add Option
              </button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={`${index}-${option}`} className="flex gap-3">
                  <input
                    value={option}
                    onChange={(event) =>
                      setOptions((current) =>
                        current.map((entry, entryIndex) =>
                          entryIndex === index ? event.target.value : entry,
                        ),
                      )
                    }
                    placeholder={`Option ${index + 1}`}
                    className="min-w-0 flex-1 rounded-[20px] border border-border bg-slate-50 px-4 py-3 outline-none transition focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setOptions((current) =>
                        current.length <= 2
                          ? current
                          : current.filter((_, entryIndex) => entryIndex !== index),
                      )
                    }
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[20px] border border-border bg-white text-text-muted transition hover:text-danger"
                    aria-label={`Remove option ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={invalid || receipt.isPending}
            >
              {phase === "pending" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Create Poll
            </button>
            <button
              type="button"
              onClick={simulateMetadataProbe}
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-text"
            >
              Probe Question Getter
            </button>
          </div>

          <AnimatePresence mode="wait">
            {message ? (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`rounded-[22px] border px-4 py-3 text-sm ${
                  phase === "failed"
                    ? "border-danger/20 bg-danger/10 text-danger"
                    : phase === "confirmed"
                      ? "border-success/20 bg-success/10 text-success"
                      : "border-primary/20 bg-primary/10 text-primary"
                }`}
              >
                <p className="font-semibold uppercase tracking-[0.16em]">
                  {phase}
                </p>
                <p className="mt-1 normal-case tracking-normal">{message}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="text-sm text-text-muted">
            At least 2 options required. SmartPoll keeps the poll metadata in local
            storage after confirmation because the contract interface does not expose
            a reliable poll indexer.
          </p>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="panel p-5 sm:p-6">
          <p className="section-title">Preview</p>
          <h3 className="mt-3 text-2xl font-extrabold tracking-tight">
            {question.trim() || "Question preview"}
          </h3>
          <div className="mt-5 space-y-3">
            {cleanOptions.length > 0 ? (
              cleanOptions.map((option, index) => (
                <div
                  key={`${option}-${index}`}
                  className="rounded-[24px] border border-border bg-slate-50 px-4 py-3"
                >
                  <p className="text-sm font-semibold text-text">
                    {index + 1}. {option}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border px-4 py-6 text-sm text-text-muted">
                Add options to preview the final ballot.
              </div>
            )}
          </div>
        </section>

        <section className="panel p-5 sm:p-6">
          <p className="section-title">Compatibility Notes</p>
          <ul className="mt-4 space-y-3 text-sm text-text-muted">
            <li>The contract exposes `createPoll`, `vote`, `getVotes`, and `voted`.</li>
            <li>Question lookup is probed as an optional auto getter and may fail.</li>
            <li>Full poll enumeration is cached locally after creation or manual attach.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
