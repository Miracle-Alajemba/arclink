# ArcLink — Project Memory

ArcLink is a merchant payment-link and checkout app. Merchants create a shareable USDC payment link or QR code. Customers open it, review the details, approve USDC, and pay — funds go directly to the merchant in the same transaction via the ArcLink contract.

## Contract Deployments

| Contract | Network | Address | Explorer |
|---|---|---|---|
| ArcLink  | Arc Mainnet | `0x973AA3397d218a12765388E2006E6603Bf83222a` | [View on Arc Explorer](https://explorer.arc.io/address/0x973AA3397d218a12765388E2006E6603Bf83222a) |

**Arc Mainnet constructor arg (USDC):** `0x3600000000000000000000000000000000000000`
**Chain ID:** 5042
**RPC:** https://rpc.mainnet.arc.io
**Explorer:** https://explorer.arc.io

> Historical: ArcLink was previously deployed to Arc Testnet at `0x91e2173ee27aebdafee0c35f0aab0ca124566ea3`. That address is on a different network and must not be used on Mainnet.

## Key Files

| File | Description |
|---|---|
| `contracts/ArcLink.sol` | Stateless ArcLink contract — pulls USDC from caller, forwards to merchant, holds nothing |
| `contracts/test/ArcLink.t.sol` | Foundry unit + fuzz tests (14 tests, all pass) |
| `src/chain-config.ts` | Single source of truth for chain ID, RPC, explorer, USDC address, contract address |
| `src/config.ts` | wagmi config — Arc Mainnet + Ethereum Mainnet (ENS only) |
| `src/onchain-facts.ts` | Multi-chain facts registry (chain IDs, USDC addresses, RPCs, explorers) |
| `src/onchain-money.ts` | BigInt-only USDC amount math (no floats on money paths) |
| `src/components/LandingPage.tsx` | Marketing landing page |
| `src/components/MerchantDashboard.tsx` | Merchant dashboard — generate links, view payment requests |
| `src/components/CheckoutPage.tsx` | Customer checkout — approve + pay flow |
| `src/components/ReceiptPage.tsx` | On-chain receipt with real tx hash and explorer link |
| `src/components/PaymentRequests.tsx` | Payment request tracker — reads PaymentMade logs |
| `src/utils/requests.ts` | localStorage request store + on-chain log scanner |

## Environment

```
VITE_ARCLINK_ADDRESS=0x973AA3397d218a12765388E2006E6603Bf83222a
```

Set in `.env` (not committed). See `.env.example` for the key name.
