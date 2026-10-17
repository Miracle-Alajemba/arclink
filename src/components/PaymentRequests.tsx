/**
 * PaymentRequests — shows a merchant's saved requests and scans on-chain logs
 * to detect payments. All records live in localStorage in this browser only.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  RefreshCw, CheckCircle2, Clock, AlertTriangle, ExternalLink,
  Copy, Info, Inbox,
} from 'lucide-react'
import { toast } from 'sonner'
import { TokenUSDC } from '@web3icons/react'
import {
  loadRequests, updateRequest, scanForPayments,
  txExplorerUrl, formatUsdcAmount, parseUsdcAmount,
  type PaymentRequest, type RequestStatus,
} from '@/utils/requests'

interface Props {
  merchant: string
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
    borderRadius: '14px',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
}

function StatusPill({ status }: { status: RequestStatus }) {
  const cfg = {
    Paid: {
      icon: <CheckCircle2 className="size-3" />,
      label: 'Paid',
      bg: 'rgba(31,210,134,0.12)',
      color: '#0d7a4e',
      border: 'rgba(31,210,134,0.30)',
    },
    Pending: {
      icon: <Clock className="size-3" />,
      label: 'Pending',
      bg: 'rgba(220,168,66,0.12)',
      color: '#7a5a00',
      border: 'rgba(220,168,66,0.30)',
    },
    'Needs review': {
      icon: <AlertTriangle className="size-3" />,
      label: 'Needs review',
      bg: 'rgba(229,62,62,0.10)',
      color: 'var(--danger)',
      border: 'rgba(229,62,62,0.25)',
    },
  }[status]

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}

function ShortHash({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="mono flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
      style={{ color: 'var(--focus)' }}
      title={hash}
    >
      {hash.slice(0, 8)}…{hash.slice(-6)}
      {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
    </button>
  )
}

function RequestRow({ req }: { req: PaymentRequest }) {
  const date = new Date(req.createdAt)
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Top row: amount + status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="amount-display text-xl" style={{ color: 'var(--ink)' }}>
            {req.amount}
          </span>
          <span className="text-xs font-semibold" style={{ color: 'var(--muted)', fontFamily: 'var(--font-main)' }}>USDC</span>
          <TokenUSDC variant="branded" size={14} />
        </div>
        <StatusPill status={req.status} />
      </div>

      {/* Tracking ref */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="mono text-xs font-semibold" style={{ color: 'var(--ink-2)' }}>{req.trackingRef}</span>
        {req.privateLabel && (
          <span className="text-xs" style={{ color: 'var(--muted)' }}>· {req.privateLabel}</span>
        )}
      </div>

      {/* Date */}
      <p className="text-[11px] mb-2" style={{ color: 'var(--subtle)' }}>
        Created {dateStr} at {timeStr}
      </p>

      {/* Paid details */}
      {(req.status === 'Paid' || req.status === 'Needs review') && req.txHash && (
        <div
          className="mt-2 rounded-xl px-3 py-2.5 space-y-1.5"
          style={glass.inner}
        >
          {req.status === 'Needs review' && (
            <p className="text-[11px]" style={{ color: 'var(--danger)' }}>
              Amount on-chain differs from requested amount. Review the transaction.
            </p>
          )}
          {req.payer && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Payer</span>
              <span className="mono text-[11px]" style={{ color: 'var(--ink-2)' }}>
                {req.payer.slice(0, 10)}…{req.payer.slice(-6)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>Tx hash</span>
            <ShortHash hash={req.txHash} />
          </div>
          <a
            href={txExplorerUrl(req.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--focus)' }}
          >
            View on Arc Explorer
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </div>
  )
}

export default function PaymentRequests({ merchant }: Props) {
  const [requests, setRequests] = useState<PaymentRequest[]>([])
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

  // Load from localStorage on mount and when merchant changes
  useEffect(() => {
    setRequests(loadRequests(merchant))
  }, [merchant])

  const refresh = useCallback(async () => {
    if (scanning) return
    setScanning(true)
    setScanError(null)

    try {
      const current = loadRequests(merchant)
      setRequests(current)

      const matches = await scanForPayments(merchant, current)

      if (matches.size > 0) {
        let updated = [...current]
        for (const [id, match] of matches) {
          const idx = updated.findIndex(r => r.id === id)
          if (idx < 0) continue
          const next: PaymentRequest = {
            ...updated[idx],
            status: match.status,
            payer: match.payer,
            txHash: match.txHash,
          }
          updateRequest(merchant, next)
          updated[idx] = next
        }
        setRequests(updated)
        const paidCount = [...matches.values()].filter(m => m.status === 'Paid').length
        if (paidCount > 0) toast.success(`${paidCount} payment${paidCount > 1 ? 's' : ''} confirmed!`)
      }

      setLastScanned(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setScanError(`Log query failed: ${msg}. Local records are intact.`)
    } finally {
      setScanning(false)
    }
  }, [merchant, scanning])

  // Auto-refresh when the view opens
  useEffect(() => {
    void refresh()
    // Only on mount — eslint-disable-next-line exhaustive-deps intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchant])

  const pendingCount = requests.filter(r => r.status === 'Pending').length
  const paidCount = requests.filter(r => r.status === 'Paid').length

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Payment requests
          </h2>
          {requests.length > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {paidCount} paid · {pendingCount} pending
            </p>
          )}
        </div>
        <button
          onClick={() => void refresh()}
          disabled={scanning}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--surface-muted)', color: 'var(--ink-2)', border: '1px solid var(--border)' }}
        >
          <RefreshCw className={`size-3.5 ${scanning ? 'animate-spin' : ''}`} />
          {scanning ? 'Scanning…' : 'Refresh payments'}
        </button>
      </div>

      {/* Local-only notice */}
      <div
        className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-[11px]"
        style={{ background: 'rgba(107,92,165,0.07)', border: '1px solid rgba(107,92,165,0.20)', color: 'var(--text-secondary)' }}
      >
        <Info className="size-3.5 shrink-0 mt-0.5" style={{ color: 'var(--jelly, #6B5CA5)' }} />
        <span>
          Records are saved in this browser only and will not sync to other devices.
          The on-chain tracking reference (ARCL-…) is public. Keep private notes in the label field — they are never sent on-chain.
        </span>
      </div>

      {/* Scan error */}
      {scanError && (
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-[11px]"
          style={{ background: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', color: 'var(--danger)' }}
        >
          <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
          {scanError}
        </div>
      )}

      {/* Last scanned */}
      {lastScanned && !scanning && (
        <p className="text-[11px] mb-3 text-right" style={{ color: 'var(--subtle)' }}>
          Last checked {lastScanned.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      {/* Request list */}
      <div style={{ ...glass.card, padding: 0, overflow: 'hidden' }}>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Inbox className="size-8" style={{ color: 'var(--subtle)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No requests yet</p>
            <p className="text-xs text-center max-w-[220px]" style={{ color: 'var(--subtle)' }}>
              Generate a payment link above and it will appear here.
            </p>
          </div>
        ) : (
          requests.map((req) => (
            <RequestRow
              key={req.id}
              req={req}
            />
          ))
        )}
      </div>
    </div>
  )
}

// Export helper so MerchantDashboard can call it without importing all of requests.ts
export { formatUsdcAmount, parseUsdcAmount }
