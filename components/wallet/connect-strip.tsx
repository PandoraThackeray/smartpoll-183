"use client";

import { useMemo } from "react";
import { AlertTriangle, ChevronRight, LogOut, Wallet } from "lucide-react";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";

function trimAddress(address?: string) {
  if (!address) return "Connect wallet";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectStrip() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();

  const wrongNetwork = isConnected && chainId !== base.id;
  const orderedConnectors = useMemo(
    () =>
      [...connectors].sort((a, b) => {
        if (a.id === "coinbaseWalletSDK") return -1;
        if (b.id === "coinbaseWalletSDK") return 1;
        return a.name.localeCompare(b.name);
      }),
    [connectors],
  );

  if (isConnected) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {wrongNetwork ? (
          <button
            type="button"
            onClick={() => switchChainAsync({ chainId: base.id })}
            className="inline-flex items-center gap-2 rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white"
            disabled={isSwitching}
          >
            <AlertTriangle className="h-4 w-4" />
            {isSwitching ? "Switching..." : "Switch to Base"}
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            <Wallet className="h-4 w-4" />
            {trimAddress(address)}
          </div>
        )}
        <button
          type="button"
          onClick={() => disconnect()}
          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-text"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {orderedConnectors.map((connector, index) => (
        <button
          key={`${connector.name}-${index}`}
          type="button"
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <Wallet className="h-4 w-4" />
          {isPending ? "Connecting..." : connector.name}
          <ChevronRight className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
