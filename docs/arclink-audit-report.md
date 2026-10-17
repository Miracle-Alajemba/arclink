# ArcLink Audit Report

Date: 2026-10-16  
Scope: `contracts/ArcLink.sol`, all frontend components, Foundry test suite  
Chain target: Arc Testnet (chainId 5042002)  
Review level: balanced (Critical + High)

---

## 1. What was checked

### Contract (`contracts/ArcLink.sol`)
- Single entry point `pay(merchant, amount, usdcToken, ref)` — stateless, no storage
- No owner, no admin, no fees, no upgradeability
- Fund-holding invariant: `balanceOf(address(this))` before == after, enforced with `NetBalanceChanged` custom error
- SafeERC20 used for all transfers
- Input validation: zero merchant address, zero amount, wrong token
- `PaymentMade` event: indexed merchant + payer, amount, ref
- Constructor: sets immutable `USDC` address, rejects `address(0)`

### Frontend flow
- **MerchantDashboard**: generates `?merchant=0x...&name=...&amount=...&ref=...` URL + QR code; no wallet or transaction involved
- **CheckoutPage**: reads URL params via `parseArcLinkParams` (validates `isAddress`, positive amount); reads live USDC balance and allowance; two-step: Approve → Pay both routed through `ArcLink.pay()` — never a direct wallet-to-merchant transfer
- **ReceiptPage**: shown only when `isPaySuccess && payHash` — wagmi `useWaitForTransactionReceipt`; shows real tx hash, copy button, and Arc Explorer link (`https://explorer.testnet.arc.io/tx/0x...`) built from `buildTxExplorerUrl(TARGET_CHAIN_ID, payHash)` in `@/onchain-facts`
- Chain enforcement: `TARGET_CHAIN_ID = 5042002`; wrong-chain detected via `useAccount().chainId !== TARGET_CHAIN_ID`; switch button shown; all contract calls include `chainId: TARGET_CHAIN_ID`
- USDC address: read from `getUsdc(5042002)` in `@/onchain-facts` → `0x3600000000000000000000000000000000000000` (Arc Testnet official)
- Explorer base: `https://explorer.testnet.arc.io` (from `requireChain(5042002)` in `@/onchain-facts`)

### Addresses verified against `@/onchain-facts`
| Item | Value | Source |
|------|-------|--------|
| Arc Testnet chain ID | 5042002 | `onchain-facts.ts` |
| Arc Testnet USDC | `0x3600000000000000000000000000000000000000` | `onchain-facts.ts` |
| USDC decimals | 6 | `onchain-facts.ts` |
| Explorer base | `https://explorer.testnet.arc.io` | `onchain-facts.ts` |
| RPC | `https://rpc.testnet.arc.io` | `onchain-facts.ts` |

No addresses were hardcoded in the frontend — all values flow through `getUsdc()` / `requireChain()` / `buildTxExplorerUrl()`.

### Contract address status
ArcLink is **not yet deployed**. `VITE_ARCLINK_ADDRESS` in `.env` is unset; `App.tsx` falls back to `0x000...000`. The contract will not be callable until deployed and the env var is set. This is expected pre-deploy.

---

## 2. Findings

### Fixed — High: Any ERC-20 accepted as payment token

**Location:** `ArcLink.pay()`, original line 42  
**Issue:** The original contract checked only `usdcToken != address(0)`. A payer could pass any ERC-20 (including a worthless one they created), trigger `PaymentMade`, and deceive any off-chain listener treating the event as proof of USDC settlement.  
**Fix applied:** The USDC address is now pinned as an immutable set in the constructor (`address public immutable USDC`). The `pay()` function rejects any call where `usdcToken != USDC` with `WrongToken(provided, expected)`. The constructor rejects `address(0)`.

### None — solidity-auditor found no additional material findings

---

## 3. Test results (after fix)

```
Ran 14 tests for contracts/test/ArcLink.t.sol:ArcLinkTest
PASS  testFuzz_ExactForward(uint96)           (256 runs)
PASS  test_ContractHoldsNoFunds
PASS  test_EmptyRefIsValid
PASS  test_MerchantReceivesExactAmount
PASS  test_MultiplePayments
PASS  test_PinnedUSDCAddress                  (new)
PASS  test_RevertConstructorZeroUSDC          (new)
PASS  test_RevertInsufficientAllowance
PASS  test_RevertInsufficientBalance
PASS  test_RevertWrongToken                   (new — replaces RevertZeroToken)
PASS  test_RevertZeroAmount
PASS  test_RevertZeroMerchant
PASS  test_RevertZeroTokenAddress             (new)
PASS  test_SuccessfulPayment
14 passed / 0 failed / 0 skipped
```

---

## 4. Build status

| Check | Result |
|-------|--------|
| `forge test` | 14/14 pass |
| `bun run check` (lint + typecheck) | 0 errors, 0 warnings |
| `bunx vite build` | clean build |
| Dev server | running (PID 2165) |

---

## 5. Flow correctness against original spec

| Requirement | Status |
|-------------|--------|
| One merchant receives one full USDC payment | Correct — contract forwards 100% of `amount` to `merchant`; balance invariant enforced |
| Not a split-payment app | Correct — single `merchant` address, no splitting logic |
| Payment goes through ArcLink contract | Correct — `CheckoutPage.handlePay` calls `writePay({ address: arcLinkAddress, abi: ARCLINK_ABI, functionName: 'pay', ... })`; direct wallet-to-merchant transfer is never called |
| USDC approval step implemented and explained | Correct — Step 1 calls `approve(arcLinkAddress, amountRaw.raw)` via `writeApprove`; UI shows "Allow N USDC to be spent" and a two-step progress indicator; info text explains the two wallet steps |
| Receipt based on real transaction | Correct — receipt shown only when `isPaySuccess && payHash` (wagmi `useWaitForTransactionReceipt`); tx hash + Arc Explorer link derived from real `payHash` |
| No fabricated transaction details | Correct — no hardcoded hashes, balances, or addresses |
| No passkey / gasless claims | Correct — none present |
| Official Arc Testnet USDC address | Correct — `0x3600000000000000000000000000000000000000` from `@/onchain-facts` |
| No Mainnet deployment or transaction | Correct — `TARGET_CHAIN_ID = 5042002`; all operations testnet-only |

---

## 6. What still needs your action

1. **Deploy the contract** — say "deploy" and the ArcLink contract will be deployed to Arc Testnet. After deployment, add `VITE_ARCLINK_ADDRESS=0x<deployed-address>` to `.env` and restart the dev server. Until then the checkout will display a zero address and calls will fail.

2. **Get test USDC for your wallet** — use the "Get test USDC" button in the Arc Studio sidebar to fund the wallet you'll connect in the preview. The checkout reads your live balance and will show an insufficient-funds warning if the balance is zero.

3. **Connect a wallet** — the checkout page requires an injected wallet (MetaMask or similar) on Arc Testnet. No passkey or sponsored-gas flow is implemented; two standard wallet confirmations are required (approve + pay).

## Audit Provenance
| Subagent | Dispatched | Files audited | Corpus rules cited |
|---|---|---|---|
| solidity-auditor | yes | 1 | none |
| functional-auditor | yes | 1 | — |
