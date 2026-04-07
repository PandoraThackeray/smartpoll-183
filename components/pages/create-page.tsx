"use client";

import { CreatePollForm } from "@/components/polls/create-poll-form";
import { useSmartPollBoard } from "@/lib/use-smartpoll-board";

export function CreatePage() {
  const { state } = useSmartPollBoard();

  return (
    <div className="space-y-6">
      <section className="panel p-5 sm:p-6">
        <p className="section-title">Create</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-text">
          Structured proposal drafting
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-text-muted">
          Build a clear question, keep the choices concise, and publish a vote that
          your contributors can understand quickly on mobile.
        </p>
      </section>

      <CreatePollForm
        initialQuestion={state.draft?.question ?? ""}
        initialOptions={state.draft?.options ?? ["", ""]}
      />
    </div>
  );
}
