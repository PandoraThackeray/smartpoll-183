"use client";

type Filter = "all" | "active" | "voted" | "created";

const filters: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "voted", label: "Voted" },
  { key: "created", label: "Created" },
];

export function PollFilters({
  value,
  onChange,
}: {
  value: Filter;
  onChange: (value: Filter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const active = filter.key === value;
        return (
          <button
            key={filter.key}
            type="button"
            onClick={() => onChange(filter.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-slate-900 text-white"
                : "border border-border bg-white text-text-muted hover:text-text"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export type PollFilter = Filter;
