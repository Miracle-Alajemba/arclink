# ArcLink

> Built with Arc Studio — money-powered apps in minutes

ArcLink is a merchant payment-link and checkout app. Merchants create a shareable USDC payment link or QR code. Customers open it, review the details, approve USDC, and pay — funds go directly to the merchant in the same transaction.

---

## Deployed contracts

| Contract | Chain | Address | Explorer |
|----------|-------|---------|----------|
| ArcLink  | Arc Testnet | `0x91e2173ee27aebdafee0c35f0aab0ca124566ea3` | [View on Arc Explorer](https://explorer.testnet.arc.io/address/0x91e2173ee27aebdafee0c35f0aab0ca124566ea3) |

Deploy tx: `0x0a137e3ae659d8a90dd0f86eacd8ebaf6b151b2b4d93cbdecfe7565899a7203a`
Deployed: 2026-10-17T00:31:24Z
Constructor arg (USDC): `0x3600000000000000000000000000000000000000` (Arc Testnet official USDC)

---

## Architecture

| Path | Description |
|------|-------------|
| `contracts/ArcLink.sol` | Stateless ERC-20 payment forwarder — no held funds, no owner, no fees |
| `contracts/test/ArcLink.t.sol` | Foundry unit + fuzz tests (11 tests, all pass) |
| `src/App.tsx` | Router: URL has `?merchant=` params → CheckoutPage; else → MerchantDashboard |
| `src/components/MerchantDashboard.tsx` | Merchant generates link + QR code |
| `src/components/CheckoutPage.tsx` | Customer checkout with approve + pay two-step wagmi flow |
| `src/components/ReceiptPage.tsx` | On-chain verified receipt with Arc Explorer link |
| `src/components/QRCode.tsx` | Canvas QR code renderer (qrcode pkg) |
| `src/utils/links.ts` | ArcLink URL param parsing |
| `src/utils/errors.ts` | Onchain error message parser |

---

## Payment flow

1. Merchant fills dashboard (name, payout address, USDC amount, optional reference)
2. App generates `?merchant=0x...&name=...&amount=...&ref=...` URL + QR code
3. Customer opens link → CheckoutPage parses URL params
4. Customer connects wallet on Arc Testnet
5. Step 1: Customer approves exact USDC amount to ArcLink contract
6. Step 2: Customer calls `ArcLink.pay()` → contract pulls USDC from customer, forwards full amount to merchant in same tx
7. ReceiptPage shows real tx hash + Arc Explorer link (never fabricated)

---

## Env vars

| Key | Purpose |
|-----|---------|
| `VITE_ARCLINK_ADDRESS` | ArcLink contract address (set after deploy, used by CheckoutPage) |

---

## Test results (last run)

```
Ran 11 tests for contracts/test/ArcLink.t.sol:ArcLinkTest
[PASS] testFuzz_ExactForward(uint96) (runs: 256)
[PASS] test_ContractHoldsNoFunds
[PASS] test_EmptyRefIsValid
[PASS] test_MerchantReceivesExactAmount
[PASS] test_MultiplePayments
[PASS] test_RevertInsufficientAllowance
[PASS] test_RevertInsufficientBalance
[PASS] test_RevertZeroAmount
[PASS] test_RevertZeroMerchant
[PASS] test_RevertZeroToken
[PASS] test_SuccessfulPayment
Suite result: ok. 11 passed; 0 failed
```
