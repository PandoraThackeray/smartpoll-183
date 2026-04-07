"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  attachChainPollId,
  clearDraft,
  createImportedPoll,
  getPollByKey,
  loadPollStore,
  logActivity,
  saveDraft,
  sortPolls,
  syncVotesForPoll,
  upsertPoll,
} from "@/lib/poll-store";

export function useSmartPollBoard() {
  const [state, setState] = useState(loadPollStore);

  useEffect(() => {
    const refresh = () => setState(loadPollStore());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("smartpoll:store", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("smartpoll:store", refresh);
    };
  }, []);

  const actions = useMemo(
    () => ({
      saveDraft,
      clearDraft,
      upsertPoll,
      logActivity,
      attachChainPollId,
      syncVotesForPoll,
      createImportedPoll,
    }),
    [],
  );

  const getByKey = useCallback((key: string) => getPollByKey(state, key), [state]);

  return {
    state: {
      ...state,
      polls: sortPolls(state.polls),
    },
    getByKey,
    ...actions,
  };
}
