export type PollMetadataSource =
  | "local-cache"
  | "manual-import"
  | "onchain-question"
  | "mixed"
  | "unknown";

export type StoredPoll = {
  key: string;
  chainPollId: number | null;
  question: string;
  options: string[];
  createdAt: string;
  creatorAddress?: string;
  txHash?: string;
  metadataSource: PollMetadataSource;
  awaitingChainId?: boolean;
  lastVotes?: number[];
  lastSyncedAt?: string;
};

export type PollActivity = {
  id: string;
  pollKey: string;
  chainPollId: number | null;
  type: "created" | "voted" | "attached";
  timestamp: string;
  actor?: string;
  optionIndex?: number;
  txHash?: string;
};

export type PollDraft = {
  question: string;
  options: string[];
  updatedAt: string;
};

export type PollStoreState = {
  polls: StoredPoll[];
  activities: PollActivity[];
  draft: PollDraft | null;
};

const STORAGE_KEY = "smartpoll:store:v1";

const defaultState: PollStoreState = {
  polls: [],
  activities: [],
  draft: null,
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizePoll(raw: Partial<StoredPoll>): StoredPoll {
  return {
    key: raw.key ?? `local-${Date.now()}`,
    chainPollId:
      typeof raw.chainPollId === "number" && Number.isFinite(raw.chainPollId)
        ? raw.chainPollId
        : null,
    question: raw.question ?? "",
    options: Array.isArray(raw.options) ? raw.options.filter(Boolean) : [],
    createdAt: raw.createdAt ?? new Date().toISOString(),
    creatorAddress: raw.creatorAddress,
    txHash: raw.txHash,
    metadataSource: raw.metadataSource ?? "unknown",
    awaitingChainId: Boolean(raw.awaitingChainId),
    lastVotes: Array.isArray(raw.lastVotes)
      ? raw.lastVotes.map((vote) => Number(vote) || 0)
      : undefined,
    lastSyncedAt: raw.lastSyncedAt,
  };
}

function normalizeActivity(raw: Partial<PollActivity>): PollActivity {
  return {
    id: raw.id ?? `${raw.type ?? "created"}-${Date.now()}`,
    pollKey: raw.pollKey ?? "unknown",
    chainPollId:
      typeof raw.chainPollId === "number" && Number.isFinite(raw.chainPollId)
        ? raw.chainPollId
        : null,
    type: raw.type ?? "created",
    timestamp: raw.timestamp ?? new Date().toISOString(),
    actor: raw.actor,
    optionIndex:
      typeof raw.optionIndex === "number" ? raw.optionIndex : undefined,
    txHash: raw.txHash,
  };
}

export function loadPollStore(): PollStoreState {
  if (!isBrowser()) return defaultState;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as PollStoreState;
    return {
      polls: Array.isArray(parsed.polls)
        ? parsed.polls.map((poll) => normalizePoll(poll))
        : [],
      activities: Array.isArray(parsed.activities)
        ? parsed.activities.map((activity) => normalizeActivity(activity))
        : [],
      draft:
        parsed.draft && typeof parsed.draft.question === "string"
          ? {
              question: parsed.draft.question,
              options: Array.isArray(parsed.draft.options)
                ? parsed.draft.options.filter(Boolean)
                : [],
              updatedAt: parsed.draft.updatedAt ?? new Date().toISOString(),
            }
          : null,
    };
  } catch {
    return defaultState;
  }
}

export function savePollStore(nextState: PollStoreState) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

export function persistPollStore(
  updater: (current: PollStoreState) => PollStoreState,
) {
  const current = loadPollStore();
  const next = updater(current);
  savePollStore(next);
  window.dispatchEvent(new Event("smartpoll:store"));
  return next;
}

export function sortPolls(polls: StoredPoll[]) {
  return [...polls].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function saveDraft(question: string, options: string[]) {
  return persistPollStore((current) => ({
    ...current,
    draft: {
      question,
      options,
      updatedAt: new Date().toISOString(),
    },
  }));
}

export function clearDraft() {
  return persistPollStore((current) => ({
    ...current,
    draft: null,
  }));
}

export function upsertPoll(poll: Partial<StoredPoll>) {
  return persistPollStore((current) => {
    const normalized = normalizePoll(poll);
    const existingIndex = current.polls.findIndex(
      (entry) =>
        entry.key === normalized.key ||
        (normalized.chainPollId !== null &&
          entry.chainPollId === normalized.chainPollId),
    );

    const polls =
      existingIndex >= 0
        ? current.polls.map((entry, index) =>
            index === existingIndex
              ? normalizePoll({
                  ...entry,
                  ...normalized,
                  options:
                    normalized.options.length > 0
                      ? normalized.options
                      : entry.options,
                  question: normalized.question || entry.question,
                })
              : entry,
          )
        : [normalized, ...current.polls];

    return { ...current, polls: sortPolls(polls) };
  });
}

export function logActivity(activity: Partial<PollActivity>) {
  return persistPollStore((current) => ({
    ...current,
    activities: [
      normalizeActivity(activity),
      ...current.activities.filter(
        (entry) =>
          entry.id !== activity.id &&
          !(
            activity.type === entry.type &&
            activity.pollKey === entry.pollKey &&
            activity.timestamp === entry.timestamp
          ),
      ),
    ].slice(0, 60),
  }));
}

export function attachChainPollId(pollKey: string, chainPollId: number) {
  return persistPollStore((current) => ({
    ...current,
    polls: current.polls.map((poll) =>
      poll.key === pollKey
        ? {
            ...poll,
            key: String(chainPollId),
            chainPollId,
            awaitingChainId: false,
          }
        : poll,
    ),
  }));
}

export function syncVotesForPoll(pollKey: string, votes: number[]) {
  return persistPollStore((current) => ({
    ...current,
    polls: current.polls.map((poll) =>
      poll.key === pollKey
        ? {
            ...poll,
            lastVotes: votes,
            lastSyncedAt: new Date().toISOString(),
          }
        : poll,
    ),
  }));
}

export function getPollByKey(state: PollStoreState, key: string) {
  return state.polls.find(
    (poll) => poll.key === key || String(poll.chainPollId ?? "") === key,
  );
}

export function createImportedPoll(input: {
  chainPollId: number;
  question: string;
  options: string[];
}) {
  const key = String(input.chainPollId);
  upsertPoll({
    key,
    chainPollId: input.chainPollId,
    question: input.question,
    options: input.options,
    createdAt: new Date().toISOString(),
    metadataSource:
      input.question || input.options.length ? "manual-import" : "unknown",
    awaitingChainId: false,
  });
  logActivity({
    id: `attached-${key}-${Date.now()}`,
    pollKey: key,
    chainPollId: input.chainPollId,
    type: "attached",
    timestamp: new Date().toISOString(),
  });
}

export function getFallbackOptionLabels(optionCount: number) {
  return Array.from({ length: optionCount }, (_, index) => `Option ${index + 1}`);
}
