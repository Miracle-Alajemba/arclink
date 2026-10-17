import { useState, useCallback } from 'react'
import { isAddress } from 'viem'
import { ConnectKitButton } from 'connectkit'
import { Copy, Link2, QrCode, CheckCircle, Store, ChevronRight, Eye } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { toast } from 'sonner'
import QRCode from './QRCode'
import type { ArcLinkParams } from '@/utils/links'

interface PaymentLink {
  merchant: string
  merchantName: string
  amount: string
  ref: string
  url: string
}

interface MerchantDashboardProps {
  onPreview: (params: ArcLinkParams) => void
}

const glass = {
  card: {
    background: 'var(--surface)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid var(--border)',
    borderRadius: '24px',
  } as React.CSSProperties,
  inner: {
    background: 'var(--surface-muted)',
    borderRadius: '16px',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
}

export default function MerchantDashboard({ onPreview }: MerchantDashboardProps) {
  const [merchantName, setMerchantName] = useState('')
  const [payoutAddress, setPayoutAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [ref, setRef] = useState('')
  const [generatedLink, setGeneratedLink] = useState<PaymentLink | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)

  const addressValid = payoutAddress.trim().length > 0 && isAddress(payoutAddress.trim())
  const amountNum = parseFloat(amount)
  const amountValid = !isNaN(amountNum) && amountNum > 0
  const nameValid = merchantName.trim().length > 0
  const canGenerate = nameValid && addressValid && amountValid

  const handleGenerate = useCallback(() => {
    if (!canGenerate) return
    const base = window.location.origin
    const params = new URLSearchParams({
      merchant: payoutAddress.trim(),
      name: merchantName.trim(),
      amount: amountNum.toFixed(2),
    })
    if (ref.trim()) params.set('ref', ref.trim())
    const url = `${base}/?${params.toString()}`
    setGeneratedLink({
      merchant: payoutAddress.trim(),
      merchantName: merchantName.trim(),
      amount: amountNum.toFixed(2),
      ref: ref.trim(),
      url,
    })
    setShowQR(false)
  }, [canGenerate, payoutAddress, merchantName, amountNum, ref])

  const handleCopy = useCallback(() => {
    if (!generatedLink) return
    void navigator.clipboard.writeText(generatedLink.url).then(() => {
      setCopied(true)
      toast.success('Payment link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [generatedLink])

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="display text-2xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              ArcLink
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>
              Create a USDC payment link
            </p>
          </div>
          <ConnectKitButton />
        </div>

        {/* Form card */}
        <div className="p-5" style={glass.card}>
          <div className="mb-4 flex items-center gap-2">
            <div
              className="flex size-8 items-center justify-center rounded-xl"
              style={{ background: 'rgba(18,45,69,0.08)' }}
            >
              <Store className="size-4" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Link details
            </span>
          </div>

          <div className="space-y-3">
            {/* Business name */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Business name
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Acme Coffee Co."
                className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all"
                style={{
                  background: 'var(--surface-muted)',
                  border: `1px solid ${merchantName && !nameValid ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--ink)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>

            {/* Payout address */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Payout address
              </label>
              <input
                type="text"
                value={payoutAddress}
                onChange={(e) => setPayoutAddress(e.target.value)}
                placeholder="0x..."
                className="mono w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-muted)',
                  border: `1px solid ${payoutAddress && !addressValid ? 'var(--danger)' : 'var(--border)'}`,
                  color: 'var(--ink)',
                }}
              />
              {payoutAddress && !addressValid && (
                <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                  Invalid Ethereum address
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Amount
              </label>
              <div className="relative">
                <input
                  inputMode="decimal"
                  type="text"
                  value={amount}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v)
                  }}
                  placeholder="0.00"
                  className="display w-full rounded-xl py-3 pl-4 pr-20 text-2xl font-bold tabular-nums outline-none transition-all"
                  style={{
                    background: 'var(--surface-muted)',
                    border: `1px solid ${amount && !amountValid ? 'var(--danger)' : 'var(--border)'}`,
                    color: 'var(--ink)',
                  }}
                />
                <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                  <TokenUSDC variant="branded" size={18} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>USDC</span>
                </div>
              </div>
            </div>

            {/* Reference (optional) */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Reference{' '}
                <span className="normal-case font-normal" style={{ color: 'var(--subtle)' }}>
                  (optional)
                </span>
              </label>
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
                placeholder="Invoice #123, Table 5, order ID..."
                maxLength={80}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            <Link2 className="size-4" />
            Generate payment link
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Generated link card */}
        {generatedLink && (
          <div className="mt-4 p-5" style={glass.card}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5" style={{ color: 'var(--success)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Link ready
                </span>
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02]"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
              >
                <QrCode className="size-3.5" />
                {showQR ? 'Hide QR' : 'Show QR'}
              </button>
            </div>

            {/* Summary row */}
            <div className="mb-3 rounded-2xl p-4" style={glass.inner}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold" style={{ color: 'var(--ink)' }}>{generatedLink.merchantName}</p>
                  {generatedLink.ref && (
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>{generatedLink.ref}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="display text-xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                    {generatedLink.amount}
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>USDC</p>
                </div>
              </div>
              <p className="mono mt-3 truncate text-xs" style={{ color: 'var(--subtle)' }}>
                {generatedLink.merchant}
              </p>
            </div>

            {/* QR code */}
            {showQR && (
              <div className="mb-3 flex justify-center rounded-2xl p-6" style={glass.inner}>
                <QRCode value={generatedLink.url} size={200} />
              </div>
            )}

            {/* URL display + copy */}
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
            >
              <p className="mono flex-1 truncate text-xs" style={{ color: 'var(--subtle)' }}>
                {generatedLink.url}
              </p>
              <button
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03] active:scale-[0.98]"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {copied ? <CheckCircle className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Preview checkout button */}
            <button
              onClick={() => onPreview({
                merchant: generatedLink.merchant,
                merchantName: generatedLink.merchantName,
                amount: generatedLink.amount,
                ref: generatedLink.ref || undefined,
              })}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
            >
              <Eye className="size-4" />
              Preview checkout
            </button>

            <p className="mt-3 text-center text-xs" style={{ color: 'var(--subtle)' }}>
              Share this link with your customer. They open it, connect a wallet, approve USDC, and pay.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
