import { isAddress } from 'viem'

export interface ArcLinkParams {
  merchant: string
  merchantName: string
  amount: string
  ref?: string
}

/**
 * Parse query string params from the current URL into a typed ArcLinkParams.
 * Returns null when the URL does not contain a valid ArcLink payment request.
 */
export function parseArcLinkParams(search: string): ArcLinkParams | null {
  const params = new URLSearchParams(search)
  const merchant = params.get('merchant')
  const name = params.get('name')
  const amount = params.get('amount')

  if (!merchant || !name || !amount) return null
  if (!isAddress(merchant)) return null

  const amountNum = parseFloat(amount)
  if (isNaN(amountNum) || amountNum <= 0) return null

  return {
    merchant,
    merchantName: name,
    amount: amountNum.toFixed(2),
    ref: params.get('ref') ?? undefined,
  }
}
