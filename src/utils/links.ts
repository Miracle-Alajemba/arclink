import { isAddress } from 'viem'
import { parseAmountParam } from './amount'

export interface ArcLinkParams {
  merchant: string
  merchantName: string
  amount: string
  ref?: string
}

/**
 * Parse query string params from the current URL into a typed ArcLinkParams.
 * Returns null when the URL does not contain a valid ArcLink payment request.
 *
 * Amount validation uses BigInt arithmetic — no parseFloat.
 * An amount with more than 2 decimal places (e.g. "4.501") is rejected.
 */
export function parseArcLinkParams(search: string): ArcLinkParams | null {
  const params = new URLSearchParams(search)
  const merchant = params.get('merchant')
  const name = params.get('name')
  const amount = params.get('amount')

  if (!merchant || !name || !amount) return null
  if (!isAddress(merchant)) return null

  const normalized = parseAmountParam(amount)
  if (normalized === null) return null

  return {
    merchant,
    merchantName: name,
    amount: normalized,
    ref: params.get('ref') ?? undefined,
  }
}
