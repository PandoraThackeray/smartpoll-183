import { createPublicClient, http } from "viem";
import type { Address } from "viem";
import { base } from "viem/chains";

import { appConfig } from "@/lib/app-config";

export const contractAddress = appConfig.contractAddress as Address;

export const smartPollAbi = [
  {
    type: "function",
    name: "createPoll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "question", type: "string" },
      { name: "options", type: "string[]" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "option", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "getVotes",
    stateMutability: "view",
    inputs: [{ name: "pollId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    type: "function",
    name: "voted",
    stateMutability: "view",
    inputs: [
      { name: "pollId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

const questionGetterAbi = [
  {
    type: "function",
    name: "polls",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "question", type: "string" }],
  },
] as const;

export const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function readVotes(pollId: number) {
  const result = await publicClient.readContract({
    address: contractAddress,
    abi: smartPollAbi,
    functionName: "getVotes",
    args: [BigInt(pollId)],
  });
  return result.map((value) => Number(value));
}

export async function readVoted(pollId: number, address: Address) {
  return publicClient.readContract({
    address: contractAddress,
    abi: smartPollAbi,
    functionName: "voted",
    args: [BigInt(pollId), address],
  });
}

export async function readQuestionMaybe(pollId: number) {
  try {
    const question = await publicClient.readContract({
      address: contractAddress,
      abi: questionGetterAbi,
      functionName: "polls",
      args: [BigInt(pollId)],
    });
    return question || null;
  } catch {
    return null;
  }
}
