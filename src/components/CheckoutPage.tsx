import { useCallback, useEffect } from 'react'
import { erc20Abi, type Address } from 'viem'
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import { ShieldCheck, AlertTriangle, Loader2, ArrowRight, Store, ArrowLeft } from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'
import { getUsdc, requireChain, buildTxExplorerUrl } from '@/onchain-facts'
import { parseAmount, usdcDecimalsFor, Amount } from '@/onchain-money'
import { parseOnchainError } from '@/utils/errors'
import type { ArcLinkParams } from '@/utils/links'
import ReceiptPage from './ReceiptPage'

// ArcLink contract ABI (only what the checkout needs)
const ARCLINK_ABI = [
  {
    name: 'pay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'merchant',  type: 'address' },
      { name: 'amount',    type: 'uint256' },
      { name: 'usdcToken', type: 'address' },
      { name: 'ref',       type: 'string'  },
    ],
    outputs: [],
  },
] as const

const TARGET_CHAIN_ID = 5042002 // Arc Testnet

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

interface CheckoutPageProps {
  params: ArcLinkParams
  arcLinkAddress: Address
  onBack?: () => void
}

export default function CheckoutPage({ params, arcLinkAddress, onBack }: CheckoutPageProps) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const chain = requireChain(TARGET_CHAIN_ID)
  const usdcFact = getUsdc(TARGET_CHAIN_ID)!
  const USDC_ADDRESS = usdcFact.address as Address

  const amountRaw = parseAmount(TARGET_CHAIN_ID, params.amount)

  // Read USDC balance
  const { data: balanceRaw, refetch: refetchBalance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  // Read USDC allowance for ArcLink
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', arcLinkAddress],
    chainId: TARGET_CHAIN_ID,
    query: { enabled: !!address },
  })

  const formattedBalance = balanceRaw !== undefined
    ? Amount.fromRaw(balanceRaw, usdcDecimalsFor(TARGET_CHAIN_ID)).toFixed(2)
    : null

  const hasEnoughBalance = balanceRaw !== undefined && balanceRaw >= amountRaw.raw
  const hasEnoughAllowance = allowanceRaw !== undefined && allowanceRaw >= amountRaw.raw
  const wrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  // Approve tx
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    reset: resetApprove,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // Pay tx
  const {
    writeContract: writePay,
    data: payHash,
    isPending: isPayPending,
    isError: isPayError,
    error: payError,
    reset: resetPay,
  } = useWriteContract()

  const {
    isLoading: isPayConfirming,
    isSuccess: isPaySuccess,
  } = useWaitForTransactionReceipt({ hash: payHash })

  // After approval confirmed, refetch allowance so the UI advances to step 2
  useEffect(() => {
    if (isApproveSuccess) {
      void refetchAllowance()
    }
  }, [isApproveSuccess, refetchAllowance])

  // After pay confirmed, refetch balance
  useEffect(() => {
    if (isPaySuccess) {
      void refetchBalance()
    }
  }, [isPaySuccess, refetchBalance])

  const handleApprove = useCallback(() => {
    resetApprove()
    writeApprove({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: 'approve',
      args: [arcLinkAddress, amountRaw.raw],
      chainId: TARGET_CHAIN_ID,
    })
  }, [writeApprove, resetApprove, USDC_ADDRESS, arcLinkAddress, amountRaw])

  const handlePay = useCallback(() => {
    resetPay()
    writePay({
      address: arcLinkAddress,
      abi: ARCLINK_ABI,
      functionName: 'pay',
      args: [
        params.merchant as Address,
        amountRaw.raw,
        USDC_ADDRESS,
        params.ref ?? '',
      ],
      chainId: TARGET_CHAIN_ID,
    })
  }, [writePay, resetPay, arcLinkAddress, params, amountRaw, USDC_ADDRESS])

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: TARGET_CHAIN_ID })
  }, [switchChain])

  const txUrl = payHash ? buildTxExplorerUrl(TARGET_CHAIN_ID, payHash) : undefined

  // Done state — show receipt
  if (isPaySuccess && payHash) {
    return (
      <ReceiptPage
        merchant={params.merchant as Address}
        merchantName={params.merchantName}
        amount={params.amount}
        ref_={params.ref}
        txHash={payHash}
        txUrl={txUrl!}
        chainName={chain.name}
        payer={address!}
      />
    )
  }

  const errorMsg = isPayError && payError ? parseOnchainError(payError) : ''

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex size-8 items-center justify-center rounded-xl transition-all hover:scale-[1.06] active:scale-[0.96]"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="size-4" style={{ color: 'var(--ink-2)' }} />
              </button>
            )}
            <h1 className="display text-xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              ArcLink
            </h1>
          </div>
          <ConnectKitButton />
        </div>

        {/* Payment details card */}
        <div className="p-5" style={glass.card}>
          {/* Merchant identity */}
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: 'rgba(18,45,69,0.08)' }}
            >
              <Store className="size-6" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: 'var(--ink)' }}>{params.merchantName}</p>
              <p className="mono text-xs" style={{ color: 'var(--subtle)' }}>
                {params.merchant.slice(0, 10)}...{params.merchant.slice(-6)}
              </p>
            </div>
          </div>

          {/* Amount hero */}
          <div
            className="mb-5 flex flex-col items-center justify-center py-6"
            style={glass.inner}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>
              Amount due
            </p>
            <div className="flex items-baseline gap-2">
              <span className="display text-5xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {params.amount}
              </span>
              <span className="text-xl font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <TokenUSDC variant="branded" size={16} />
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{chain.name}</span>
            </div>
          </div>

          {/* Reference row */}
          {params.ref && (
            <div
              className="mb-4 flex items-center justify-between rounded-xl px-4 py-2.5"
              style={glass.inner}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Reference</span>
              <span className="text-xs font-medium" style={{ color: 'var(--ink-2)' }}>{params.ref}</span>
            </div>
          )}

          {/* Balance row */}
          {isConnected && address && (
            <div
              className="mb-4 flex items-center justify-between rounded-xl px-4 py-2.5"
              style={glass.inner}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Your USDC balance</span>
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: hasEnoughBalance ? 'var(--success)' : 'var(--danger)' }}
              >
                {formattedBalance !== null ? `${formattedBalance} USDC` : '...'}
              </span>
            </div>
          )}

          {/* How it works */}
          <div
            className="mb-5 flex items-start gap-3 rounded-xl p-4"
            style={{ background: 'rgba(18,45,69,0.04)', border: '1px solid var(--border)' }}
          >
            <ShieldCheck className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--accent)' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
              Payments go directly to the merchant in the same transaction via the ArcLink contract.
              You first allow USDC spending, then confirm payment. Two wallet steps total.
            </p>
          </div>

          {/* Wrong chain warning */}
          {wrongChain && (
            <div
              className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(186,43,76,0.08)', border: '1px solid rgba(186,43,76,0.20)' }}
            >
              <AlertTriangle className="size-4 shrink-0" style={{ color: 'var(--danger)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                Switch to {chain.name} to continue
              </p>
            </div>
          )}

          {/* Insufficient balance warning */}
          {isConnected && !wrongChain && balanceRaw !== undefined && !hasEnoughBalance && (
            <div
              className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(186,43,76,0.08)', border: '1px solid rgba(186,43,76,0.20)' }}
            >
              <AlertTriangle className="size-4 shrink-0" style={{ color: 'var(--danger)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>
                Insufficient USDC balance. You need {params.amount} USDC.
                Use &ldquo;Get test USDC&rdquo; in Arc Studio to add funds.
              </p>
            </div>
          )}

          {/* Error */}
          {errorMsg && (
            <div
              className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(186,43,76,0.08)', border: '1px solid rgba(186,43,76,0.20)' }}
            >
              <AlertTriangle className="size-4 shrink-0" style={{ color: 'var(--danger)' }} />
              <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>{errorMsg}</p>
            </div>
          )}

          {/* Action button */}
          {!isConnected ? (
            <ConnectKitButton.Custom>
              {({ show }) => (
                <button
                  onClick={show}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'var(--accent)' }}
                >
                  Connect wallet to pay
                </button>
              )}
            </ConnectKitButton.Custom>
          ) : wrongChain ? (
            <button
              onClick={handleSwitchChain}
              className="w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: 'var(--accent)' }}
            >
              Switch to {chain.name}
            </button>
          ) : !hasEnoughAllowance ? (
            /* Step 1: Approve */
            <button
              onClick={handleApprove}
              disabled={!hasEnoughBalance || isApprovePending || isApproveConfirming}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {isApprovePending
                ? <><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</>
                : isApproveConfirming
                  ? <><Loader2 className="size-4 animate-spin" /> Approving USDC...</>
                  : <>Allow {params.amount} USDC to be spent <ArrowRight className="size-4" /></>}
            </button>
          ) : (
            /* Step 2: Pay */
            <button
              onClick={handlePay}
              disabled={!hasEnoughBalance || isPayPending || isPayConfirming}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: 'var(--success)' }}
            >
              {isPayPending
                ? <><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</>
                : isPayConfirming
                  ? <><Loader2 className="size-4 animate-spin" /> Confirming payment...</>
                  : <>Pay {params.amount} USDC <ArrowRight className="size-4" /></>}
            </button>
          )}

          {/* Step indicator */}
          {isConnected && !wrongChain && (
            <div className="mt-3 flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex size-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: hasEnoughAllowance ? 'var(--success)' : 'var(--accent)',
                    color: 'white',
                  }}
                >
                  {hasEnoughAllowance ? '✓' : '1'}
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Allow</span>
              </div>
              <div className="h-px w-8" style={{ background: 'var(--border)' }} />
              <div className="flex items-center gap-1.5">
                <div
                  className="flex size-5 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: isPaySuccess ? 'var(--success)' : 'rgba(18,45,69,0.12)',
                    color: isPaySuccess ? 'white' : 'var(--muted)',
                  }}
                >
                  {isPaySuccess ? '✓' : '2'}
                </div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Pay</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
