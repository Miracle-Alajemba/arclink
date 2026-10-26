import { CheckCircle, ExternalLink, Copy } from 'lucide-react'
import { useState } from 'react'
import type { Address } from 'viem'
import logo from '@/assets/arclink-logo.svg'
import { TokenUSDC } from '@web3icons/react'
import { toast } from 'sonner'

interface ReceiptPageProps {
  merchant: Address
  merchantName: string
  amount: string
  ref_?: string
  txHash: string
  txUrl: string
  chainName: string
  payer: Address
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

export default function ReceiptPage({
  merchant,
  merchantName,
  amount,
  ref_,
  txHash,
  txUrl,
  chainName,
  payer,
}: ReceiptPageProps) {
  const [hashCopied, setHashCopied] = useState(false)

  const handleCopyHash = () => {
    void navigator.clipboard.writeText(txHash).then(() => {
      setHashCopied(true)
      toast.success('Transaction hash copied!')
      setTimeout(() => setHashCopied(false), 2000)
    })
  }

  const shortHash = `${txHash.slice(0, 10)}...${txHash.slice(-8)}`

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <img src={logo} alt="ArcLink" className="h-9" style={{ width: 'auto' }} />
        </div>

        {/* Success card */}
        <div className="p-5" style={glass.card}>
          {/* Spectral strip — consumer checkout success */}
          <div
            className="mb-5 h-1 w-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 33%, #ec4899 66%, #f59e0b 100%)',
            }}
          />

          {/* Success indicator */}
          <div className="mb-5 flex flex-col items-center gap-2">
            <div
              className="flex size-16 items-center justify-center rounded-3xl"
              style={{ background: 'rgba(26,128,71,0.10)' }}
            >
              <CheckCircle className="size-8" style={{ color: 'var(--success)' }} />
            </div>
            <h2 className="display text-2xl" style={{ color: 'var(--ink)' }}>
              Payment sent
            </h2>
            <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
              Confirmed on {chainName}
            </p>
          </div>

          {/* Amount */}
          <div className="mb-4 flex flex-col items-center py-5 rounded-2xl" style={glass.inner}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Amount paid
            </p>
            <div className="flex items-baseline gap-2">
              <span className="amount-display text-4xl" style={{ color: 'var(--ink)' }}>
                {amount}
              </span>
              <span className="text-lg font-semibold" style={{ color: 'var(--subtle)', fontFamily: 'var(--font-main)' }}>USDC</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <TokenUSDC variant="branded" size={16} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{chainName}</span>
            </div>
          </div>

          {/* Details table */}
          <div className="space-y-2 rounded-2xl p-4" style={glass.inner}>
            <DetailRow label="Merchant" value={merchantName} />
            <div className="h-px" style={{ background: 'var(--border)' }} />
            {/* Full address — break-all so it wraps on narrow screens */}
            <div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Paid to
              </span>
              <p
                className="mono mt-0.5 text-xs break-all"
                style={{ color: 'var(--ink-2)' }}
              >
                {merchant}
              </p>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div>
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                Paid from
              </span>
              <p
                className="mono mt-0.5 text-xs break-all"
                style={{ color: 'var(--ink-2)' }}
              >
                {payer}
              </p>
            </div>
            {ref_ && (
              <>
                <div className="h-px" style={{ background: 'var(--border)' }} />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Reference
                  </span>
                  <span
                    className="mono text-xs font-semibold px-2 py-0.5 rounded-lg"
                    style={{ background: 'rgba(107,92,165,0.09)', color: 'var(--jelly, #6B5CA5)' }}
                  >
                    {ref_}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Transaction hash */}
          <div
            className="mt-3 flex items-center justify-between rounded-xl px-4 py-3"
            style={glass.inner}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Transaction</p>
              <p className="mono text-xs mt-0.5" style={{ color: 'var(--ink-2)' }}>{shortHash}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyHash}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all hover:scale-[1.03]"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink-2)' }}
              >
                <Copy className="size-3" />
                {hashCopied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.03]"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Explorer
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: 'var(--subtle)' }}>
            Transaction verified on-chain. Explorer link opens the real transaction.
          </p>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>{label}</span>
      <span
        className={`text-xs font-medium ${mono ? 'mono' : ''}`}
        style={{ color: 'var(--ink-2)' }}
      >
        {value}
      </span>
    </div>
  )
}
