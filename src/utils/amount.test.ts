/**
 * Unit tests for USDC amount validation in ArcLink.
 *
 * Run with: bunx vitest run src/utils/amount.test.ts
 *
 * No new dependencies beyond vitest (already added to devDependencies).
 * No floating-point arithmetic is used in the module under test.
 */

import { describe, it, expect } from 'vitest'
import { validateUsdcAmount, isValidUsdcAmount, parseAmountParam } from './amount'

// ── Valid amounts ─────────────────────────────────────────────────────────────

describe('validateUsdcAmount — valid inputs', () => {
  it('accepts "0.01" and normalises to "0.01"', () => {
    const r = validateUsdcAmount('0.01')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('0.01')
    expect(r.rawUsdc6).toBe(10_000n)          // 0.01 * 10^6 = 10_000
  })

  it('accepts "4.5" and normalises to "4.50"', () => {
    const r = validateUsdcAmount('4.5')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('4.50')
    expect(r.rawUsdc6).toBe(4_500_000n)       // 4.50 * 10^6
  })

  it('accepts "4.50" and normalises to "4.50"', () => {
    const r = validateUsdcAmount('4.50')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('4.50')
    expect(r.rawUsdc6).toBe(4_500_000n)
  })

  it('accepts "1" and normalises to "1.00"', () => {
    const r = validateUsdcAmount('1')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('1.00')
    expect(r.rawUsdc6).toBe(1_000_000n)
  })

  it('accepts "100.00" and normalises correctly', () => {
    const r = validateUsdcAmount('100.00')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('100.00')
    expect(r.rawUsdc6).toBe(100_000_000n)
  })

  it('accepts "0.10" and normalises to "0.10"', () => {
    const r = validateUsdcAmount('0.10')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('0.10')
    expect(r.rawUsdc6).toBe(100_000n)
  })

  it('accepts a large amount "99999.99"', () => {
    const r = validateUsdcAmount('99999.99')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.normalized).toBe('99999.99')
    expect(r.rawUsdc6).toBe(99_999_990_000n)
  })
})

// ── Invalid amounts — rejection (never round) ─────────────────────────────────

describe('validateUsdcAmount — invalid inputs', () => {
  it('rejects "4.501" — 3 decimal places, does NOT round to 4.50', () => {
    const r = validateUsdcAmount('4.501')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/decimal places/i)
  })

  it('rejects "0" — zero is not a valid payment amount', () => {
    const r = validateUsdcAmount('0')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/greater than zero/i)
  })

  it('rejects "0.00" — zero is not a valid payment amount', () => {
    const r = validateUsdcAmount('0.00')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/greater than zero/i)
  })

  it('rejects empty string', () => {
    const r = validateUsdcAmount('')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/required/i)
  })

  it('rejects negative value "-1"', () => {
    const r = validateUsdcAmount('-1')
    expect(r.ok).toBe(false)
  })

  it('rejects negative decimal "-0.50"', () => {
    const r = validateUsdcAmount('-0.50')
    expect(r.ok).toBe(false)
  })

  it('rejects alphabetic input "abc"', () => {
    const r = validateUsdcAmount('abc')
    expect(r.ok).toBe(false)
  })

  it('rejects mixed "1a2"', () => {
    const r = validateUsdcAmount('1a2')
    expect(r.ok).toBe(false)
  })

  it('rejects multiple decimal points "1.2.3"', () => {
    const r = validateUsdcAmount('1.2.3')
    expect(r.ok).toBe(false)
  })

  it('rejects whitespace-only "   "', () => {
    const r = validateUsdcAmount('   ')
    expect(r.ok).toBe(false)
  })

  it('rejects "0.001" — 3dp', () => {
    const r = validateUsdcAmount('0.001')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/decimal places/i)
  })

  it('rejects "10.999" — 3dp', () => {
    const r = validateUsdcAmount('10.999')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toMatch(/decimal places/i)
  })
})

// ── isValidUsdcAmount predicate ────────────────────────────────────────────────

describe('isValidUsdcAmount', () => {
  it('returns true for "2.00"', () => { expect(isValidUsdcAmount('2.00')).toBe(true) })
  it('returns true for "0.01"', () => { expect(isValidUsdcAmount('0.01')).toBe(true) })
  it('returns false for "4.501"', () => { expect(isValidUsdcAmount('4.501')).toBe(false) })
  it('returns false for ""', () => { expect(isValidUsdcAmount('')).toBe(false) })
  it('returns false for "0"', () => { expect(isValidUsdcAmount('0')).toBe(false) })
})

// ── parseAmountParam (URL param parsing) ──────────────────────────────────────

describe('parseAmountParam', () => {
  it('normalises "4.5" to "4.50"', () => { expect(parseAmountParam('4.5')).toBe('4.50') })
  it('normalises "4.50" to "4.50"', () => { expect(parseAmountParam('4.50')).toBe('4.50') })
  it('normalises "0.01" to "0.01"', () => { expect(parseAmountParam('0.01')).toBe('0.01') })
  it('returns null for "4.501"',    () => { expect(parseAmountParam('4.501')).toBeNull() })
  it('returns null for "0"',        () => { expect(parseAmountParam('0')).toBeNull() })
  it('returns null for ""',         () => { expect(parseAmountParam('')).toBeNull() })
  it('returns null for "abc"',      () => { expect(parseAmountParam('abc')).toBeNull() })
  it('returns null for "-1"',       () => { expect(parseAmountParam('-1')).toBeNull() })
})
