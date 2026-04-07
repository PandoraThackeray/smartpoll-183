# SmartPoll

SmartPoll is a governance-focused Base Mini App built with Next.js, TypeScript, Tailwind CSS, wagmi, viem, lucide-react, and framer-motion.

## What it does

- Browse tracked polls from a local browser cache.
- Create new polls with onchain `createPoll(question, options)`.
- Vote on a poll with onchain `vote(pollId, option)`.
- Read live result counts with `getVotes(pollId)`.
- Check per-wallet participation with `voted(pollId, address)`.

## Contract compatibility notes

The current contract interface does not expose a reliable poll count or full poll metadata enumeration. SmartPoll therefore uses a hybrid model:

- Onchain reads for `getVotes` and `voted`.
- Best-effort optional probe for a `polls(uint256)` question getter.
- Local browser storage for question text, options, created polls, attached poll IDs, and recent activity.

## Local development

```bash
npm install
npm run dev
```
