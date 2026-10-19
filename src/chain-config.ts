/**
 * ArcLink chain configuration — single source of truth.
 *
 * Active network: Arc Mainnet (chain ID 5042).
 *
 * USDC contract address on Arc Mainnet:
 *   0x3600000000000000000000000000000000000000
 *
 * Do NOT show native-token balance and ERC-20 balance as two separate amounts —
 * on Arc the gas token IS USDC; they are one pool of funds exposed two ways.
 * The ERC-20 view (6 decimals) is the correct view for display and transfers.
 */

// ── Arc Mainnet ───────────────────────────────────────────────────────────────

export const ARC_MAINNET_CHAIN_ID        = 5042
export const ARC_MAINNET_RPC             = 'https://rpc.mainnet.arc.io'
export const ARC_MAINNET_EXPLORER        = 'https://explorer.arc.io'
export const ARC_MAINNET_USDC            = '0x3600000000000000000000000000000000000000'
export const ARC_MAINNET_USDC_DECIMALS   = 6
export const ARC_MAINNET_NATIVE_DECIMALS = 18 // gas token = USDC at 18 decimals on Arc

/** Display label shown in network pills and badges. */
export const ARC_MAINNET_LABEL = 'Arc Mainnet · 5042'

// ── Active target (all app code imports from here) ────────────────────────────

/** Chain ID the app targets. */
export const TARGET_CHAIN_ID = ARC_MAINNET_CHAIN_ID

/** ERC-20 USDC address on the target chain. */
export const TARGET_USDC_ADDRESS = ARC_MAINNET_USDC

/** Block explorer base URL for the target chain. */
export const TARGET_EXPLORER = ARC_MAINNET_EXPLORER

/** RPC endpoint for read-only log scanning (no wallet needed). */
export const TARGET_RPC = ARC_MAINNET_RPC

/** Human-readable network label for UI badges. */
export const TARGET_NETWORK_LABEL = ARC_MAINNET_LABEL

// ── ArcLink contract address ──────────────────────────────────────────────────

/**
 * ArcLink contract address on Arc Mainnet, read from VITE_ARCLINK_ADDRESS.
 *
 * Set VITE_ARCLINK_ADDRESS in .env after deploying ArcLink to Arc Mainnet.
 * Until then, CONTRACT_PENDING is true and all payment actions are disabled.
 * Do not reuse the Arc Testnet deployment address (0x91e2...ea3) here — it
 * is a different network and a different deployment.
 */
export const ARCLINK_ADDRESS = (
  import.meta.env.VITE_ARCLINK_ADDRESS ?? '0x0000000000000000000000000000000000000000'
) as `0x${string}`

/** True when no Mainnet contract address has been configured yet. */
export const CONTRACT_PENDING =
  !import.meta.env.VITE_ARCLINK_ADDRESS ||
  import.meta.env.VITE_ARCLINK_ADDRESS === '0x0000000000000000000000000000000000000000'

// ── Explorer URL helpers ──────────────────────────────────────────────────────

export function buildTxUrl(txHash: string): string {
  return `${TARGET_EXPLORER}/tx/${txHash}`
}

export function buildAddressUrl(address: string): string {
  return `${TARGET_EXPLORER}/address/${address}`
}
