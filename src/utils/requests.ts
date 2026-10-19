/**
 * ArcLink Payment Request tracker — localStorage-backed, scoped by merchant address.
 *
 * Tracking refs (ARCL-<id>) are non-sensitive and public on-chain.
 * The optional private label is stored locally only and never sent on-chain.
 *
 * Records are saved in this browser/device only and will not automatically
 * sync to other devices or browsers.
 *
 * Target: Arc Mainnet (chain ID 5042). All RPC, explorer, and log queries
 * use the Mainnet configuration from chain-config.ts.
 */

import { createPublicClient, http, parseAbiItem, type Address } from 'viem'
import {
  TARGET_CHAIN_ID,
  TARGET_RPC,
  TARGET_EXPLORER,
  ARCLINK_ADDRESS,
} from '@/chain-config'

// USDC has 6 decimals on Arc Mainnet ERC-20 interface
const USDC_DECIMALS = 6

// PaymentMade event (matches deployed ArcLink contract)
const PAYMENT_MADE_ABI = parseAbiItem(
  'event PaymentMade(address indexed merchant, address indexed payer, uint256 amount, string ref)'
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type RequestStatus = 'Pending' | 'Paid' | 'Needs review'

export interface PaymentRequest {
  /** Unique identifier */
  id: string
  /** Merchant payout address (checksummed) */
  merchant: string
  /** Business name entered by merchant */
  merchantName: string
  /** Requested amount as decimal string, e.g. "2.00" */
  amount: string
  /** Auto-generated on-chain tracking reference, e.g. ARCL-a1b2c3 */
  trackingRef: string
  /** Private label/note — stored locally only, never on-chain */
  privateLabel?: string
  /** Full payment URL */
  url: string
  /** ISO timestamp when created */
  createdAt: string
  /** Block number at creation time (for log lookups — avoids scanning from genesis) */
  fromBlock: bigint | null
  status: RequestStatus
  /** Payer address — set when Paid or Needs review */
  payer?: string
  /** Transaction hash — set when Paid or Needs review */
  txHash?: string
}

// Serialisable form stored in localStorage (bigint → string)
interface StoredRequest extends Omit<PaymentRequest, 'fromBlock'> {
  fromBlock: string | null
}

// ── Storage key ───────────────────────────────────────────────────────────────

function storageKey(merchant: string): string {
  return `arclink:requests:${merchant.toLowerCase()}`
}

// ── Serialise / deserialise ───────────────────────────────────────────────────

function toStored(r: PaymentRequest): StoredRequest {
  return { ...r, fromBlock: r.fromBlock !== null ? r.fromBlock.toString() : null }
}

function fromStored(s: StoredRequest): PaymentRequest {
  return { ...s, fromBlock: s.fromBlock !== null ? BigInt(s.fromBlock) : null }
}

// ── Public storage API ────────────────────────────────────────────────────────

/** Load all requests for a merchant address (most-recent first) */
export function loadRequests(merchant: string): PaymentRequest[] {
  try {
    const raw = localStorage.getItem(storageKey(merchant))
    if (!raw) return []
    const stored: StoredRequest[] = JSON.parse(raw) as StoredRequest[]
    return stored.map(fromStored).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  } catch {
    return []
  }
}

function saveRequests(merchant: string, requests: PaymentRequest[]): void {
  localStorage.setItem(storageKey(merchant), JSON.stringify(requests.map(toStored)))
}

/** Add a new request */
export function addRequest(req: PaymentRequest): void {
  const list = loadRequests(req.merchant)
  list.unshift(req)
  saveRequests(req.merchant, list)
}

/** Update one request by id */
export function updateRequest(merchant: string, updated: PaymentRequest): void {
  const list = loadRequests(merchant)
  const idx = list.findIndex(r => r.id === updated.id)
  if (idx >= 0) list[idx] = updated
  else list.unshift(updated)
  saveRequests(merchant, list)
}

// ── Reference generator ───────────────────────────────────────────────────────

/** Generate a short non-sensitive public tracking reference: ARCL-xxxxxxxx */
export function generateTrackingRef(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return `ARCL-${hex}`
}

// ── Amount helpers ────────────────────────────────────────────────────────────

/** Parse a decimal USDC string to raw uint256 (6-decimal integer) */
export function parseUsdcAmount(decimal: string): bigint {
  const [intPart, fracPart = ''] = decimal.split('.')
  const frac = fracPart.slice(0, USDC_DECIMALS).padEnd(USDC_DECIMALS, '0')
  return BigInt(intPart) * 10n ** BigInt(USDC_DECIMALS) + BigInt(frac)
}

/** Format raw uint256 to 2-decimal USDC string */
export function formatUsdcAmount(raw: bigint): string {
  const divisor = 10n ** BigInt(USDC_DECIMALS)
  const int = raw / divisor
  const frac = raw % divisor
  return `${int}.${frac.toString().padStart(USDC_DECIMALS, '0').slice(0, 2)}`
}

// ── Explorer URL ──────────────────────────────────────────────────────────────

/** Build an Arc Mainnet explorer transaction URL. */
export function txExplorerUrl(hash: string): string {
  return `${TARGET_EXPLORER}/tx/${hash}`
}

// ── Log query ─────────────────────────────────────────────────────────────────

const LOG_BATCH_RANGE = 2000n

interface MatchResult {
  requestId: string
  status: RequestStatus
  payer: string
  txHash: string
}

/**
 * Scan PaymentMade logs on Arc Mainnet for all pending/needs-review requests.
 *
 * Uses TARGET_RPC (Arc Mainnet) and ARCLINK_ADDRESS from chain-config.
 * If CONTRACT_PENDING is true (zero address), returns an empty map immediately
 * rather than querying an invalid address.
 *
 * Starts from each request's recorded fromBlock (or currentBlock − 10 000 when
 * absent) to avoid scanning from block 0.
 */
export async function scanForPayments(
  merchant: string,
  requests: PaymentRequest[]
): Promise<Map<string, MatchResult>> {
  const pending = requests.filter(r => r.status === 'Pending' || r.status === 'Needs review')
  if (pending.length === 0) return new Map()

  // If the contract isn't deployed yet, skip log scanning entirely
  const contractAddr = ARCLINK_ADDRESS
  if (
    contractAddr === '0x0000000000000000000000000000000000000000' ||
    !import.meta.env.VITE_ARCLINK_ADDRESS
  ) {
    return new Map()
  }

  const client = createPublicClient({
    transport: http(TARGET_RPC),
    chain: { id: TARGET_CHAIN_ID, name: 'Arc', nativeCurrency: { name: 'USD Coin', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: [TARGET_RPC] } } },
  })

  const currentBlock = await client.getBlockNumber()

  const minFromBlock = pending.reduce<bigint>((min, r) => {
    const fb = r.fromBlock ?? (currentBlock > 10000n ? currentBlock - 10000n : 0n)
    return fb < min ? fb : min
  }, currentBlock)

  const results = new Map<string, MatchResult>()

  let from = minFromBlock < 0n ? 0n : minFromBlock
  while (from <= currentBlock) {
    const to = from + LOG_BATCH_RANGE > currentBlock ? currentBlock : from + LOG_BATCH_RANGE

    const logs = await client.getLogs({
      address: contractAddr,
      event: PAYMENT_MADE_ABI,
      args: { merchant: merchant as Address },
      fromBlock: from,
      toBlock: to,
    })

    for (const log of logs) {
      const { payer, amount, ref } = log.args as {
        merchant: Address
        payer: Address
        amount: bigint
        ref: string
      }
      const txHash = log.transactionHash ?? ''

      const matchedReq = pending.find(r => r.trackingRef === ref)
      if (!matchedReq) continue
      if (results.has(matchedReq.id)) continue

      const expectedRaw = parseUsdcAmount(matchedReq.amount)
      const status: RequestStatus = amount === expectedRaw ? 'Paid' : 'Needs review'

      results.set(matchedReq.id, { requestId: matchedReq.id, status, payer, txHash })
    }

    if (to === currentBlock) break
    from = to + 1n
  }

  return results
}
