import { useState, useCallback, useRef } from 'react'
import { isAddress } from 'viem'
import logo from '@/assets/arclink-logo.svg'
import { ConnectKitButton } from 'connectkit'
import {
  Copy, Link2, QrCode, CheckCircle, Store, ChevronRight,
  Eye, ArrowLeft, List, PlusCircle, Lock, Download, Printer,
  Info,
} from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { toast } from 'sonner'
import QRCode from './QRCode'
import type { QRCodeHandle } from './QRCode'
import PaymentRequests from './PaymentRequests'
import type { ArcLinkParams } from '@/utils/links'
import { generateTrackingRef, addRequest } from '@/utils/requests'
import { validateUsdcAmount } from '@/utils/amount'

import { TARGET_RPC } from '@/chain-config'

interface PaymentLink {
  merchant: string
  merchantName: string
  amount: string
  /** Auto-generated public on-chain tracking ref */
  trackingRef: string
  /** Private label stored locally only */
  privateLabel: string
  url: string
}

interface MerchantDashboardProps {
  onPreview: (params: ArcLinkParams) => void
  onBack?: () => void
}

type Tab = 'create' | 'requests'

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

/** Fetch current block number from Arc Mainnet (best-effort; returns null on error) */
async function fetchCurrentBlock(): Promise<bigint | null> {
  try {
    const res = await fetch(TARGET_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    })
    const json = await res.json() as { result: string }
    return BigInt(json.result)
  } catch {
    return null
  }
}

export default function MerchantDashboard({ onPreview, onBack }: MerchantDashboardProps) {
  const [tab, setTab] = useState<Tab>('create')

  // Form state
  const [merchantName, setMerchantName] = useState('')
  const [payoutAddress, setPayoutAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [privateLabel, setPrivateLabel] = useState('')

  // Generated link state
  const [generatedLink, setGeneratedLink] = useState<PaymentLink | null>(null)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<QRCodeHandle>(null)

  const addressValid = payoutAddress.trim().length > 0 && isAddress(payoutAddress.trim())
  const amountResult = validateUsdcAmount(amount)
  const amountValid = amountResult.ok
  const amountError = amount.length > 0 && !amountResult.ok ? amountResult.error : ''
  const nameValid = merchantName.trim().length > 0
  const canGenerate = nameValid && addressValid && amountValid

  const handleGenerate = useCallback(async () => {
    if (!canGenerate || !amountResult.ok) return
    const normalizedAmount = amountResult.normalized

    const trackingRef = generateTrackingRef()
    const base = window.location.origin
    const params = new URLSearchParams({
      merchant: payoutAddress.trim(),
      name: merchantName.trim(),
      amount: normalizedAmount,
      ref: trackingRef,
    })
    const url = `${base}/?${params.toString()}`

    const link: PaymentLink = {
      merchant: payoutAddress.trim(),
      merchantName: merchantName.trim(),
      amount: normalizedAmount,
      trackingRef,
      privateLabel: privateLabel.trim(),
      url,
    }
    setGeneratedLink(link)
    setShowQR(false)

    // Capture block number (best-effort) then save to localStorage
    const fromBlock = await fetchCurrentBlock()

    addRequest({
      id: `${trackingRef}-${Date.now()}`,
      merchant: payoutAddress.trim(),
      merchantName: merchantName.trim(),
      amount: normalizedAmount,
      trackingRef,
      privateLabel: privateLabel.trim() || undefined,
      url,
      createdAt: new Date().toISOString(),
      fromBlock,
      status: 'Pending',
    })

    toast.success('Payment link created and saved to tracker')
  }, [canGenerate, amountResult, payoutAddress, merchantName, privateLabel])

  const handleCopy = useCallback(() => {
    if (!generatedLink) return
    void navigator.clipboard.writeText(generatedLink.url).then(() => {
      setCopied(true)
      toast.success('Payment link copied!')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [generatedLink])

  const handleDownloadQR = useCallback(() => {
    if (!generatedLink) return
    const dataUrl = qrRef.current?.toDataURL()
    if (!dataUrl) { toast.error('QR not ready — show it first'); return }
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `arclink-qr-${generatedLink.trackingRef}.png`
    a.click()
    toast.success('QR downloaded')
  }, [generatedLink])

  const handlePrintQR = useCallback(() => {
    if (!generatedLink) return
    const dataUrl = qrRef.current?.toDataURL()
    if (!dataUrl) { toast.error('QR not ready — show it first'); return }
    const w = window.open('', '_blank', 'width=480,height=640')
    if (!w) { toast.error('Pop-up blocked — allow pop-ups and try again'); return }
    w.document.write(`<!doctype html><html><head>
      <meta charset="utf-8">
      <title>ArcLink payment QR — ${generatedLink.merchantName}</title>
      <style>
        body{margin:0;padding:24px;font-family:system-ui,sans-serif;color:#29233B;background:#fff}
        .wrap{max-width:320px;margin:0 auto;text-align:center}
        img{border-radius:12px;width:260px;height:260px;display:block;margin:0 auto 16px}
        h2{margin:0 0 4px;font-size:1.2rem}
        .amount{font-size:2rem;font-weight:700;margin:8px 0 2px}
        .ref{font-family:monospace;font-size:0.75rem;color:#8E89A5;margin:4px 0 12px}
        .address{font-family:monospace;font-size:0.7rem;word-break:break-all;color:#5A5374;margin:4px 0 16px}
        .note{font-size:0.7rem;color:#8E89A5;border-top:1px solid #D4DAF0;padding-top:12px;margin-top:8px}
        @media print{body{padding:0}}
      </style>
    </head><body>
      <div class="wrap">
        <img src="${dataUrl}" alt="Payment QR code">
        <h2>${generatedLink.merchantName}</h2>
        <div class="amount">${generatedLink.amount} <span style="font-size:1rem;font-weight:500">USDC</span></div>
        <div class="ref">${generatedLink.trackingRef}</div>
        <div class="address">Pay to: ${generatedLink.merchant}</div>
        <div class="note">Scan to open the ArcLink payment page. Arc Mainnet · Chain ID 5042.</div>
      </div>
      <script>window.onload=function(){window.print()}<\/script>
    </body></html>`)
    w.document.close()
  }, [generatedLink])

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-5xl px-4 py-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="flex size-8 items-center justify-center rounded-xl transition-all hover:scale-[1.06] active:scale-[0.96]"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                aria-label="Back to home"
              >
                <ArrowLeft className="size-4" style={{ color: 'var(--ink-2)' }} />
              </button>
            )}
            <div className="flex flex-col gap-1">
              <img src={logo} alt="ArcLink" className="h-9" style={{ width: 'auto' }} />
              <p className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-main)' }}>
                Merchant dashboard
              </p>
            </div>
          </div>
          <ConnectKitButton />
        </div>

        {/* Tab bar */}
        <div
          className="mb-5 flex rounded-2xl p-1 gap-1"
          style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
        >
          <button
            onClick={() => setTab('create')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all"
            style={{
              background: tab === 'create' ? 'var(--surface-strong)' : 'transparent',
              color: tab === 'create' ? 'var(--ink)' : 'var(--muted)',
              border: tab === 'create' ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: tab === 'create' ? '0 1px 4px rgba(41,35,59,0.08)' : 'none',
            }}
          >
            <PlusCircle className="size-3.5" />
            Create link
          </button>
          <button
            onClick={() => setTab('requests')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition-all"
            style={{
              background: tab === 'requests' ? 'var(--surface-strong)' : 'transparent',
              color: tab === 'requests' ? 'var(--ink)' : 'var(--muted)',
              border: tab === 'requests' ? '1px solid var(--border)' : '1px solid transparent',
              boxShadow: tab === 'requests' ? '0 1px 4px rgba(41,35,59,0.08)' : 'none',
            }}
          >
            <List className="size-3.5" />
            Requests
            {/* Show pending badge if address is entered */}
            {addressValid && (() => {
              try {
                const key = `arclink:requests:${payoutAddress.toLowerCase()}`
                const raw = localStorage.getItem(key)
                if (!raw) return null
                const items = JSON.parse(raw) as Array<{ status: string }>
                const pending = items.filter(r => r.status === 'Pending').length
                if (pending === 0) return null
                return (
                  <span
                    className="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ background: 'var(--jelly, #6B5CA5)', minWidth: 16, height: 16 }}
                  >
                    {pending}
                  </span>
                )
              } catch { return null }
            })()}
          </button>
        </div>

        {/* ── Create tab ─────────────────────────────────────────────── */}
        {tab === 'create' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
            {/* Left column: form */}
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
                      fontFamily: 'var(--font-main)',
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
                  {/* Wallet role hint */}
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <Info className="size-3 mt-0.5 shrink-0" style={{ color: 'var(--muted)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                      <strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Payout address</strong> = where you receive USDC as the merchant.{' '}
                      <strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Connected wallet</strong> = the customer's wallet that approves and pays.
                    </p>
                  </div>
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
                        // Allow digits and at most one dot; reject anything else immediately
                        const v = e.target.value.replace(/[^0-9.]/g, '')
                        if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v)
                        else setAmount(v.replace(/\.(\d{2})\d+$/, '.$1')) // trim to 2dp on paste
                      }}
                      placeholder="0.00"
                      className="amount-display w-full rounded-xl py-3 pl-4 pr-20 text-2xl outline-none transition-all"
                      style={{
                        background: 'var(--surface-muted)',
                        border: `1px solid ${amountError ? 'var(--danger)' : 'var(--border)'}`,
                        color: 'var(--ink)',
                      }}
                    />
                    <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                      <TokenUSDC variant="branded" size={18} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>USDC</span>
                    </div>
                  </div>
                  {amountError && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--danger)' }}>
                      {amountError}
                    </p>
                  )}
                </div>

                {/* Private label (local only) */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Private label{' '}
                    <span className="normal-case font-normal" style={{ color: 'var(--subtle)' }}>(optional, local only)</span>
                  </label>
                  <input
                    type="text"
                    value={privateLabel}
                    onChange={(e) => setPrivateLabel(e.target.value)}
                    placeholder="Invoice #123, Table 5, order ID…"
                    maxLength={120}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-main)',
                    }}
                  />
                  {/* Privacy notice */}
                  <div className="mt-1.5 flex items-start gap-1.5">
                    <Lock className="size-3 mt-0.5 shrink-0" style={{ color: 'var(--muted)' }} />
                    <p className="text-[11px]" style={{ color: 'var(--subtle)' }}>
                      Stored in this browser only. Never sent on-chain.
                      The auto-generated tracking ref (ARCL-…) is public on-chain — do not put customer names or sensitive information there.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={() => void handleGenerate()}
                disabled={!canGenerate}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: 'var(--accent)' }}
              >
                <Link2 className="size-4" />
                Generate payment link
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Right column: generated link card or placeholder */}
            {generatedLink ? (
              <div className="p-5" style={glass.card}>
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
                      <p className="mono mt-0.5 text-xs" style={{ color: 'var(--subtle)' }}>
                        {generatedLink.trackingRef}
                      </p>
                      {generatedLink.privateLabel && (
                        <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                          {generatedLink.privateLabel}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="amount-display text-2xl" style={{ color: 'var(--ink)' }}>
                        {generatedLink.amount}
                      </p>
                      <p className="text-xs font-medium" style={{ color: 'var(--muted)', fontFamily: 'var(--font-main)' }}>USDC</p>
                    </div>
                  </div>
                  <p className="mono mt-3 truncate text-xs" style={{ color: 'var(--subtle)' }}>
                    {generatedLink.merchant}
                  </p>
                </div>

                {/* QR code */}
                {showQR && (
                  <div className="mb-3 rounded-2xl p-5" style={glass.inner}>
                    <div className="flex justify-center mb-3">
                      <QRCode ref={qrRef} value={generatedLink.url} size={200} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadQR}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
                      >
                        <Download className="size-3.5" />
                        Download QR
                      </button>
                      <button
                        onClick={handlePrintQR}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
                      >
                        <Printer className="size-3.5" />
                        Print QR
                      </button>
                    </div>
                    <p className="mt-2 text-center text-[10px]" style={{ color: 'var(--subtle)' }}>
                      Scan encodes the exact payment link — amount, recipient, and reference unchanged.
                    </p>
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

                {/* Preview checkout */}
                <button
                  onClick={() => onPreview({
                    merchant: generatedLink.merchant,
                    merchantName: generatedLink.merchantName,
                    amount: generatedLink.amount,
                    ref: generatedLink.trackingRef,
                  })}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
                >
                  <Eye className="size-4" />
                  Preview checkout
                </button>

                {/* View in requests tab */}
                <button
                  onClick={() => setTab('requests')}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'transparent', color: 'var(--focus)', border: '1px solid var(--border)' }}
                >
                  <List className="size-3.5" />
                  View in Payment requests
                </button>

                <p className="mt-3 text-center text-xs" style={{ color: 'var(--subtle)' }}>
                  Share this link with your customer. They open it, connect a wallet, approve USDC, and pay.
                </p>
              </div>
            ) : (
              /* Placeholder shown before a link is generated */
              <div
                className="flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center"
                style={{ ...glass.card, minHeight: 220 }}
              >
                <div
                  className="flex size-12 items-center justify-center rounded-2xl"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <Link2 className="size-5" style={{ color: 'var(--subtle)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                  Your payment link will appear here
                </p>
                <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                  Fill in the form and click Generate
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Requests tab ───────────────────────────────────────────── */}
        {tab === 'requests' && (
          <>
            {!addressValid ? (
              <div className="p-5 text-center" style={glass.card}>
                <Store className="size-8 mx-auto mb-3" style={{ color: 'var(--subtle)' }} />
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>Enter your payout address first</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Switch to the "Create link" tab and fill in your payout address to view requests scoped to that address.
                </p>
              </div>
            ) : (
              <PaymentRequests merchant={payoutAddress.trim()} />
            )}
          </>
        )}

      </div>
    </div>
  )
}
