# ArcLink

**Share a payment request. Get paid in USDC.**

ArcLink is a non-custodial payment-link app for one-time, fixed-amount USDC payments on Arc Mainnet. A merchant creates a link or QR code for a payment request. The customer reviews the amount and recipient, connects a compatible wallet, approves USDC spending when needed, and confirms the payment. The ArcLink contract forwards the exact amount to the merchant in the same transaction.

- **Live app:** [usearclink.vercel.app](https://usearclink.vercel.app/)
- **Source code:** [github.com/Miracle-Alajemba/arclink](https://github.com/Miracle-Alajemba/arclink)
- **ArcLink contract:** [0x973AA3397d218a12765388E2006E6603Bf83222a on Arc Explorer](https://explorer.arc.io/address/0x973AA3397d218a12765388E2006E6603Bf83222a)
- **Deployment transaction:** [View on Arc Explorer](https://explorer.arc.io/tx/0xf86c8115e5132b06898bef14fd219163f1e6af95cb261b2cd77f2233f3d7ebeb)

> The contract is deployed and the public app is configured for Arc Mainnet. A live payment through the public app still needs to be tested and verified; do not treat this README as evidence that a payment test has been completed.

## Who it is for

ArcLink is designed for freelancers, creators, small businesses, pop-up vendors, and event organizers who need to request a specific one-time amount without setting up a conventional storefront. A merchant can send the link by message or email, or display its QR code in person.

ArcLink is a payment-request and checkout flow, not a complete point-of-sale, accounting, subscription, escrow, or split-payment system.

## How a payment works

1. **Create a request.** The merchant opens the dashboard and enters a business name, payout wallet address, and USDC amount. The merchant can add an optional private label for their own browser records.
2. **Share the link or QR code.** ArcLink creates a URL containing the merchant address, business name, requested amount, and an automatically generated tracking reference.
3. **Review and pay.** The customer opens the URL, checks the payment details, connects a wallet on Arc Mainnet, and approves the requested USDC allowance if required. The customer then confirms the contract payment.
4. **Settle and verify.** The contract transfers the exact USDC amount to the merchant and emits a `PaymentMade` event. The checkout presents a transaction receipt with an Arc Explorer link. The merchant can refresh the request tracker to look for the matching on-chain event.

The merchant-dashboard wallet connection is for using the dashboard; it does not itself make a payment. The payout address is where funds are sent and can be the connected merchant wallet. The customer connects their own wallet on the checkout page to pay. Before confirming a transaction, the payer should verify the network, amount, recipient, and wallet-displayed fee.

## Contract behavior

The ArcLink Solidity contract is intentionally small and stateless. It pins the accepted USDC token address at construction, rejects a zero merchant or zero amount, pulls USDC from the payer with `transferFrom`, forwards the same amount to the merchant, checks that its own token balance did not increase, and emits `PaymentMade` with the merchant, payer, amount, and reference.

The contract has no owner or administrator role, no protocol fee, and no upgradeability mechanism. The payment reference is public on-chain. It is intended for a non-sensitive order or request identifier only. ArcLink is not audited or endorsed by Arc or Circle; users should review the contract and use appropriate caution.

## Arc Mainnet deployment

| Setting | Value |
| --- | --- |
| Network | Arc Mainnet |
| Chain ID | `5042` |
| RPC | `https://rpc.mainnet.arc.io` |
| Explorer | [explorer.arc.io](https://explorer.arc.io) |
| USDC contract | `0x3600000000000000000000000000000000000000` |
| ArcLink contract | `0x973AA3397d218a12765388E2006E6603Bf83222a` |
| ArcLink deployment transaction | `0xf86c8115e5132b06898bef14fd219163f1e6af95cb261b2cd77f2233f3d7ebeb` |

The frontend reads the ArcLink address from `VITE_ARCLINK_ADDRESS` at build time. This is a public contract address, not a secret. Vite exposes variables with the `VITE_` prefix in browser code, so never put a private key, recovery phrase, API secret, or access token in a `VITE_` variable. The repository's `.env.example` documents the variable name; the local `.env` file must not be committed.

## Payment request privacy and tracking

Payment request records and optional private labels are stored in the browser's local storage, scoped to the merchant address. They are not synced to a server or automatically shared across devices and browsers. Clearing browser data can remove the local request history. The generated tracking reference is included in the payment link and emitted on-chain, so do not put customer names or sensitive details in it.

## Run locally

Prerequisites:

- [Bun](https://bun.sh/) for the React/Vite application and scripts
- [Foundry](https://book.getfoundry.sh/) for Solidity compilation and tests

```bash
git clone https://github.com/Miracle-Alajemba/arclink.git
cd arclink
bun install --frozen-lockfile
cp .env.example .env
```

Set the deployed contract address in `.env`:

```dotenv
VITE_ARCLINK_ADDRESS=0x973AA3397d218a12765388E2006E6603Bf83222a
```

Start the development server:

```bash
bun run dev
```

## Checks

```bash
bun run check       # lint and TypeScript type check
bunx vite build     # production frontend build
forge test          # Solidity unit and fuzz tests
```

## Current scope and limitations

- One payer pays one fixed amount to one merchant per request.
- No recurring billing, split payments, escrow, conditional release, or gas sponsorship.
- Request history is browser-local and does not sync across devices.
- A payment can require separate wallet confirmations for USDC approval and the payment itself.
- ArcLink does not custody funds beyond the transfer executed within the payment transaction.

## Technology

- React, TypeScript, and Vite
- Solidity and OpenZeppelin `SafeERC20`
- Foundry for contract builds and tests
- wagmi, viem, and ConnectKit for wallet and EVM interactions
- QR-code generation and Arc Mainnet event scanning for request tracking
