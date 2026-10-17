export function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? ''

  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001) {
    return 'Transaction cancelled.'
  }
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) {
    return 'Insufficient USDC balance. Add funds and try again.'
  }
  if (msg.includes('invalidmerchant')) {
    return 'Invalid merchant address.'
  }
  if (msg.includes('invalidamount')) {
    return 'Invalid payment amount.'
  }
  if (msg.includes('invalidtoken')) {
    return 'Invalid token address.'
  }
  if (msg.includes('erc20insufficientallowance') || msg.includes('allowance')) {
    return 'USDC allowance too low. Please allow the payment amount first.'
  }
  if (msg.includes('erc20insufficientbalance') || msg.includes('transfer amount exceeds')) {
    return 'Insufficient USDC balance for this payment.'
  }
  if (msg.includes('reverted')) {
    const reasonMatch = msg.match(/reason="([^"]+)"/)
    return reasonMatch
      ? `Transaction failed: ${reasonMatch[1]}`
      : 'Transaction failed. Please try again.'
  }
  if (msg.includes('network') || msg.includes('timeout')) {
    return 'Network error. Check your connection and retry.'
  }
  return 'Something went wrong. Please try again.'
}
