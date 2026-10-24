/**
 * USDC amount validation and normalisation for ArcLink.
 *
 * Rules (matches ArcLink requirements):
 *  - Positive decimal number with at most 2 fraction digits
 *  - Minimum value: 0.01 USDC (1 raw unit at 2dp; the ERC-20 has 6dp so 0.01 → 10_000 raw)
 *  - Reject rather than round: "4.501" is an error, not "4.50"
 *  - No floating-point arithmetic anywhere on the value path
 *
 * The USDC ERC-20 on Arc has 6 decimals. This module works in 2-decimal
 * display units (the common merchant-facing representation). Conversion to
 * 6-decimal raw units is done by multipling by 10_000n (10^4) in BigInt only.
 */

/** Maximum fraction digits accepted in a user-supplied amount string. */
export const MAX_FRACTION_DIGITS = 2

/** Minimum accepted amount in display units ("0.01"). */
export const MIN_DISPLAY_AMOUNT = '0.01'

export type AmountValidationResult =
  | { ok: true; normalized: string; rawUsdc6: bigint }
  | { ok: false; error: string }

/**
 * Validate and normalise a merchant-entered USDC amount string.
 *
 * Returns `{ ok: true, normalized, rawUsdc6 }` on success where:
 *  - `normalized` is the canonical 2-decimal display string, e.g. "4.50"
 *  - `rawUsdc6` is the integer value in 6-decimal USDC raw units (bigint)
 *
 * Returns `{ ok: false, error }` on any rejection.
 * Never uses parseFloat / Number() on the value.
 */
export function validateUsdcAmount(input: string): AmountValidationResult {
  const trimmed = input.trim()

  if (trimmed === '') {
    return { ok: false, error: 'Amount is required.' }
  }

  // Allow only digits and an optional single decimal point
  if (!/^\d+(\.\d*)?$/.test(trimmed)) {
    return { ok: false, error: 'Enter a valid amount using digits and at most one decimal point.' }
  }

  const dotIndex = trimmed.indexOf('.')
  const whole  = dotIndex === -1 ? trimmed : trimmed.slice(0, dotIndex)
  const frac   = dotIndex === -1 ? ''      : trimmed.slice(dotIndex + 1)

  // Reject more than 2 fraction digits (do not round)
  if (frac.length > MAX_FRACTION_DIGITS) {
    return {
      ok: false,
      error: `Too many decimal places. USDC amounts may have at most ${MAX_FRACTION_DIGITS} decimal places. "${trimmed}" was not rounded.`,
    }
  }

  // Pad fraction to exactly 2 digits so we can work in 2dp integer units
  const frac2 = frac.padEnd(MAX_FRACTION_DIGITS, '0')

  // Combine into a 2dp integer (cents): "4.5" → "450", "0.01" → "1"
  const wholePart = whole === '' ? '0' : whole
  const cents = BigInt(wholePart) * 100n + BigInt(frac2)

  if (cents === 0n) {
    return { ok: false, error: 'Amount must be greater than zero.' }
  }

  // Minimum: 0.01 USDC = 1 cent
  if (cents < 1n) {
    return { ok: false, error: `Minimum amount is ${MIN_DISPLAY_AMOUNT} USDC.` }
  }

  // Convert 2dp cents → 6dp USDC raw units: multiply by 10_000 (10^4)
  const rawUsdc6 = cents * 10_000n

  // Produce normalised 2-decimal display string
  const centsStr   = cents.toString().padStart(3, '0')
  const normalized =
    centsStr.slice(0, centsStr.length - 2) + '.' + centsStr.slice(centsStr.length - 2)

  return { ok: true, normalized, rawUsdc6 }
}

/**
 * Quick predicate: is this string a valid ArcLink USDC amount?
 * Used for form-level disabled/enabled logic without needing the full result.
 */
export function isValidUsdcAmount(input: string): boolean {
  return validateUsdcAmount(input).ok
}

/**
 * Parse and validate an amount coming from a URL query parameter.
 * Returns the normalised string on success, null if invalid.
 * Never uses floating-point arithmetic.
 */
export function parseAmountParam(raw: string): string | null {
  const result = validateUsdcAmount(raw)
  return result.ok ? result.normalized : null
}
