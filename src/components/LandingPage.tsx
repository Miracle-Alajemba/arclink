import { useRef } from 'react'
import { motion } from 'framer-motion'
import { ARC_MAINNET_EXPLORER, ARCLINK_ADDRESS, CONTRACT_PENDING } from '@/chain-config'
import logo from '@/assets/arclink-logo.svg'
import {
  Link2,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Receipt,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Store,
  Megaphone,
  Check,
  X,
  Database,
} from 'lucide-react'
import { TokenUSDC } from '@web3icons/react'

interface LandingPageProps {
  onCreateLink: () => void
}

// ── Brand tokens ──────────────────────────────────────────────────────────────
const licorice      = '#29233B'
const jelly         = '#6B5CA5'
const jellyLight    = '#7C6FC4'
const gumdrop       = '#4A9FE8'
const periwinkle    = '#EDF1FC'
const bgCardSubtle  = '#F5F7FE'
const borderSubtle  = '#D4DAF0'
const textSecondary = '#5A5374'
const textMuted     = '#8E89A5'
const gumdropBg     = 'rgba(74,159,232,0.10)'
const jellyBg       = 'rgba(107,92,165,0.09)'

const glass = (radius = 24): React.CSSProperties => ({
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: `1px solid ${borderSubtle}`,
  borderRadius: radius,
})

const cardStyle = (radius = 20): React.CSSProperties => ({
  background: '#fff',
  border: `1px solid ${borderSubtle}`,
  borderRadius: radius,
})

// ── Nav link ─────────────────────────────────────────────────────────────────
function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-sm font-medium transition-colors rounded focus-visible:outline-none focus-visible:ring-2"
      style={{ color: textSecondary, ['--tw-ring-color' as string]: gumdrop }}
      onMouseEnter={e => (e.currentTarget.style.color = jelly)}
      onMouseLeave={e => (e.currentTarget.style.color = textSecondary)}
    >
      {label}
    </a>
  )
}

// ── Step dot ─────────────────────────────────────────────────────────────────
function StepDot({ n }: { n: number }) {
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums"
      style={{ background: jellyBg, color: jelly, border: `1.5px solid rgba(107,92,165,0.25)` }}
    >
      {n}
    </div>
  )
}

// ── Section eyebrow ───────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-center text-[11px] font-bold uppercase tracking-[0.1em] mb-3"
      style={{ color: jelly }}
    >
      {children}
    </p>
  )
}

// ── Section headline ─────────────────────────────────────────────────────────
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="display text-3xl sm:text-4xl font-bold text-center text-balance mb-12"
      style={{ color: licorice, letterSpacing: '-0.025em', lineHeight: 1.15 }}
    >
      {children}
    </h2>
  )
}

// ── Demo payment-link card ────────────────────────────────────────────────────
function DemoCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="w-full max-w-[320px]"
      style={{ ...glass(28), border: `1.5px solid ${borderSubtle}`, overflow: 'hidden' }}
    >
      {/* Top accent line */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${jelly}, ${gumdrop})` }} />

      {/* Demo badge */}
      <div className="px-5 pt-4 pb-0">
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ background: periwinkle, color: jelly }}
        >
          Demo preview — not a real payment
        </span>
      </div>

      {/* Merchant row */}
      <div className="px-5 pt-3 pb-0 flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
          style={{ background: periwinkle, color: licorice }}
        >
          AC
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight" style={{ color: licorice }}>
            Acme Coffee Co.
          </p>
          <p className="mono text-[11px] truncate" style={{ color: textMuted }}>
            0x4f2F…F62f9
          </p>
        </div>
      </div>

      {/* Amount */}
      <div className="px-5 pt-4 pb-4 flex items-end justify-between">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-[0.08em] mb-1"
            style={{ color: textMuted }}
          >
            Amount due
          </p>
          <p
            className="amount-display text-[2.6rem] leading-none tabular-nums"
            style={{ color: licorice }}
          >
            12.00
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-xl px-3 py-2"
          style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
        >
          <TokenUSDC variant="branded" size={18} />
          <span className="text-sm font-semibold" style={{ color: textSecondary }}>
            USDC
          </span>
        </div>
      </div>

      {/* Ref row */}
      <div
        className="mx-5 mb-4 rounded-xl px-3 py-2.5"
        style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.08em] mb-0.5"
          style={{ color: textMuted }}
        >
          Reference
        </p>
        <p className="mono text-xs font-medium" style={{ color: textSecondary }}>
          ARCL-3f9a1c7d
        </p>
      </div>

      {/* QR placeholder */}
      <div
        className="mx-5 mb-5 rounded-2xl flex flex-col items-center justify-center py-5 gap-2"
        style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
      >
        <QrCode size={52} style={{ color: jelly, opacity: 0.22 }} />
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: textMuted }}
        >
          QR code generated on link creation
        </p>
      </div>
    </motion.div>
  )
}

// ── Audience card ─────────────────────────────────────────────────────────────
interface AudienceCardProps {
  icon: React.ReactNode
  title: string
  body: string
  example: string
  delay: number
}
function AudienceCard({ icon, title, body, example, delay }: AudienceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, ease: 'easeOut', delay }}
      className="flex flex-col p-6 h-full"
      style={cardStyle(20)}
    >
      <div
        className="mb-4 flex size-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ background: jellyBg }}
      >
        {icon}
      </div>
      <p className="font-semibold mb-2 leading-snug" style={{ color: licorice }}>
        {title}
      </p>
      <p
        className="text-sm text-pretty flex-1 mb-4"
        style={{ color: textSecondary, lineHeight: 1.65 }}
      >
        {body}
      </p>
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.08em] mb-0.5"
          style={{ color: textMuted }}
        >
          Example
        </p>
        <p className="text-xs text-pretty" style={{ color: textSecondary, lineHeight: 1.55 }}>
          {example}
        </p>
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage({ onCreateLink }: LandingPageProps) {
  const whoRef  = useRef<HTMLElement>(null)
  const howRef  = useRef<HTMLElement>(null)

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const EXPLORER = CONTRACT_PENDING
    ? ARC_MAINNET_EXPLORER
    : `${ARC_MAINNET_EXPLORER}/address/${ARCLINK_ADDRESS}`
  const REPO = 'https://github.com/Miracle-Alajemba/arclink'

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>

      {/* ── Network notice ───────────────────────────────────────────── */}
      <div
        className="w-full py-2 px-4 flex items-center justify-center gap-2 text-[11px] font-semibold"
        style={{
          background: gumdropBg,
          borderBottom: `1px solid rgba(74,159,232,0.18)`,
        }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-bold"
          style={{
            background: gumdrop,
            color: '#fff',
            fontSize: 10,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Arc Mainnet · 5042
        </span>
        {CONTRACT_PENDING ? (
          <span style={{ color: licorice }}>
            Contract deployment pending — payment actions disabled until deployed.
          </span>
        ) : (
          <span style={{ color: licorice }}>USDC payments on Arc Mainnet.</span>
        )}
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-40 w-full px-5 py-3 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(237,241,252,0.93)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${borderSubtle}`,
        }}
      >
        <img src={logo} alt="ArcLink" className="h-9 shrink-0" style={{ width: 'auto' }} />

        <div className="hidden sm:flex items-center gap-6">
          <NavLink href="#who-its-for" label="Who it's for" />
          <NavLink href="#how-it-works" label="How it works" />
          <NavLink href="#why-arclink" label="Why ArcLink" />
        </div>

        <button
          onClick={onCreateLink}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 shrink-0"
          style={{ background: licorice, ['--tw-ring-color' as string]: gumdrop }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = jelly)}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = licorice)}
        >
          <Link2 className="size-3.5" />
          Create a link
        </button>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pt-16 pb-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
              style={{
                background: gumdropBg,
                color: gumdrop,
                border: `1px solid rgba(74,159,232,0.28)`,
              }}
            >
              Arc Mainnet · 5042
            </p>

            <h1
              className="display text-4xl sm:text-5xl font-bold text-balance mb-5"
              style={{ color: licorice, letterSpacing: '-0.03em', lineHeight: 1.08 }}
            >
              USDC checkout,<br />one link away.
            </h1>

            <p
              className="text-base sm:text-lg text-pretty max-w-[42ch] mx-auto lg:mx-0 mb-3"
              style={{ color: textSecondary, lineHeight: 1.65 }}
            >
              ArcLink helps you request a fixed USDC payment with a shareable link or QR code.
            </p>
            <p
              className="text-sm text-pretty max-w-[48ch] mx-auto lg:mx-0 mb-8"
              style={{ color: textMuted, lineHeight: 1.65 }}
            >
              The customer reviews the payment, connects their wallet, approves the exact USDC
              amount, and pays. The ArcLink contract forwards the payment directly to your payout
              address — no custodian, no intermediary.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <button
                onClick={onCreateLink}
                className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
                style={{ background: licorice, ['--tw-ring-color' as string]: gumdrop }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = jelly)}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = licorice)}
              >
                <Link2 className="size-4" />
                Create a payment link
                <ChevronRight className="size-4" />
              </button>
              <button
                onClick={() => scrollTo(whoRef)}
                className="flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.85)',
                  border: `1.5px solid ${borderSubtle}`,
                  color: textSecondary,
                  backdropFilter: 'blur(12px)',
                  ['--tw-ring-color' as string]: gumdrop,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = jellyLight
                  el.style.color = jelly
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = borderSubtle
                  el.style.color = textSecondary
                }}
              >
                Who it's for
                <ArrowRight className="size-4" />
              </button>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <DemoCard />
        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section
        id="who-its-for"
        ref={whoRef}
        className="py-20 px-5"
        style={{
          background: 'rgba(255,255,255,0.55)',
          borderTop: `1px solid ${borderSubtle}`,
          borderBottom: `1px solid ${borderSubtle}`,
        }}
      >
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Who it's for</Eyebrow>
          <SectionHead>One-time payment requests, simply shared.</SectionHead>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AudienceCard
              icon={<Briefcase className="size-5" style={{ color: jelly }} />}
              title="Freelancers and consultants"
              body="Send a client a link for a one-time project fee, invoice, or milestone payment. No shared account or payment processor needed — just your wallet address and the amount."
              example="A designer completes a logo project and sends the client a link for 500 USDC."
              delay={0}
            />
            <AudienceCard
              icon={<Store className="size-5" style={{ color: jelly }} />}
              title="Creators and small online sellers"
              body="Share a payment link in a direct message, email, or social bio. The customer opens it and pays without signing up for anything."
              example="A digital artist drops a 40 USDC payment link in their bio for a print order."
              delay={0.06}
            />
            <AudienceCard
              icon={<QrCode className="size-5" style={{ color: jelly }} />}
              title="Local businesses and pop-up vendors"
              body="Display a QR code at your counter or stall. A customer scans it with their phone, reviews the amount, and pays from their wallet."
              example="A market vendor shows a 25 USDC QR code at checkout for a handmade item."
              delay={0.12}
            />
            <AudienceCard
              icon={<Megaphone className="size-5" style={{ color: jelly }} />}
              title="Event and community organizers"
              body="Request a fixed USDC contribution, ticket payment, or event fee from attendees. Send the link in a group chat or post the QR code at the door."
              example="A meetup organizer shares a 10 USDC link for a workshop ticket."
              delay={0.18}
            />
          </div>

          <div
            className="mt-6 rounded-2xl px-5 py-4 flex gap-3 items-start"
            style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
          >
            <ShieldCheck className="size-4 shrink-0 mt-0.5" style={{ color: jelly }} />
            <p className="text-sm text-pretty" style={{ color: textSecondary, lineHeight: 1.65 }}>
              <strong style={{ color: licorice }}>ArcLink is for one-time, fixed-amount payment requests.</strong>{' '}
              It is not a full accounting system, a subscription platform, or a storefront. Each link
              is for a single payment from a single customer to a single payout address.
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        ref={howRef}
        className="py-20 px-5"
      >
        <div className="mx-auto max-w-3xl">
          <Eyebrow>How it works</Eyebrow>
          <SectionHead>From request to on-chain receipt in three steps.</SectionHead>

          <div className="space-y-4">
            {[
              {
                title: 'Create a payment request',
                body: 'Enter your business name, payout wallet address, USDC amount, and an optional private note (stored only in your browser, never on-chain). ArcLink generates a unique tracking reference and produces a shareable URL and a QR code.',
                note: 'The tracking reference is public and on-chain. Do not include private customer information in it.',
                delay: 0,
              },
              {
                title: 'Share the link or QR code',
                body: 'Send the URL via message, email, or any channel. Display the QR code in person. The link encodes the merchant name, payout address, amount, and tracking reference — the customer sees all of this when they open it.',
                note: null,
                delay: 0.07,
              },
              {
                title: 'Customer pays; you check the receipt',
                body: 'The customer connects their wallet, approves the exact USDC amount, and confirms the payment. Two wallet confirmations are required: one approval and one contract call. After on-chain confirmation, a receipt with the real transaction hash and Arc Explorer link is shown. You can check the request status in the Payment requests tab of your dashboard.',
                note: null,
                delay: 0.14,
              },
            ].map(({ title, body, note, delay }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.42, ease: 'easeOut', delay }}
                className="flex gap-5 p-5"
                style={glass(20)}
              >
                <StepDot n={i + 1} />
                <div className="min-w-0">
                  <p className="font-semibold mb-1.5" style={{ color: licorice }}>
                    {title}
                  </p>
                  <p
                    className="text-sm text-pretty"
                    style={{ color: textSecondary, lineHeight: 1.65 }}
                  >
                    {body}
                  </p>
                  {note && (
                    <p
                      className="mt-2.5 text-xs text-pretty rounded-lg px-3 py-2"
                      style={{
                        color: '#7a5a1a',
                        background: 'rgba(220,168,66,0.12)',
                        border: '1px solid rgba(220,168,66,0.28)',
                        lineHeight: 1.6,
                      }}
                    >
                      {note}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ArcLink ──────────────────────────────────────────────── */}
      <section
        id="why-arclink"
        className="py-20 px-5"
        style={{
          background: 'rgba(255,255,255,0.55)',
          borderTop: `1px solid ${borderSubtle}`,
          borderBottom: `1px solid ${borderSubtle}`,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <Eyebrow>Why ArcLink</Eyebrow>
          <SectionHead>Simple, shareable, wallet-to-wallet.</SectionHead>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              {
                icon: <Link2 className="size-5" style={{ color: jelly }} />,
                title: 'Share and pay, no app required',
                body: 'One URL encodes everything. Send it via any channel — message, email, QR. The customer opens it in any browser with a compatible wallet. No app download needed on either side.',
                delay: 0,
              },
              {
                icon: <Wallet className="size-5" style={{ color: jelly }} />,
                title: 'Wallet-to-wallet settlement',
                body: 'The ArcLink contract pulls USDC from the customer and forwards the full amount to your payout address in the same transaction. The contract holds no USDC after settlement. No custody, no intermediary, no settlement queue.',
                delay: 0.08,
              },
              {
                icon: <Receipt className="size-5" style={{ color: jelly }} />,
                title: 'On-chain receipts and request tracking',
                body: 'Every payment is a real transaction on Arc. The receipt shows the confirmed hash and links to Arc Explorer. Your payment requests are saved locally in this browser and can be refreshed against on-chain events to check payment status.',
                delay: 0.16,
              },
            ].map(({ icon, title, body, delay }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.42, ease: 'easeOut', delay }}
                className="p-5"
                style={cardStyle(20)}
              >
                <div
                  className="mb-4 flex size-10 items-center justify-center rounded-2xl"
                  style={{ background: jellyBg }}
                >
                  {icon}
                </div>
                <p className="font-semibold mb-2" style={{ color: licorice }}>
                  {title}
                </p>
                <p
                  className="text-sm text-pretty"
                  style={{ color: textSecondary, lineHeight: 1.65 }}
                >
                  {body}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Honest limitations grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* What's included */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3"
                style={{ color: jelly }}
              >
                What ArcLink does
              </p>
              <ul className="space-y-2">
                {[
                  'One-time, fixed-amount USDC payment requests',
                  'Shareable payment links and scannable QR codes',
                  'Direct wallet-to-wallet settlement via the ArcLink contract',
                  'On-chain transaction receipts with Arc Explorer links',
                  'Local browser-based payment request tracking',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="size-3.5 mt-0.5 shrink-0" style={{ color: '#1FD286' }} />
                    <span
                      className="text-sm text-pretty"
                      style={{ color: textSecondary, lineHeight: 1.55 }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What's not included */}
            <div
              className="rounded-2xl px-5 py-5"
              style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
            >
              <p
                className="text-[11px] font-bold uppercase tracking-[0.08em] mb-3"
                style={{ color: textMuted }}
              >
                What ArcLink does not do
              </p>
              <ul className="space-y-2">
                {[
                  'Gas sponsorship or gasless transactions',
                  'Recurring payments or subscriptions',
                  'Split payments or shared treasuries',
                  'Escrow or conditional release',
                  'Cross-device sync of request records',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <X className="size-3.5 mt-0.5 shrink-0" style={{ color: '#E53E3E' }} />
                    <span
                      className="text-sm text-pretty"
                      style={{ color: textMuted, lineHeight: 1.55 }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Local storage notice */}
          <div
            className="mt-4 rounded-2xl px-5 py-4 flex gap-3 items-start"
            style={{ background: bgCardSubtle, border: `1px solid ${borderSubtle}` }}
          >
            <Database className="size-4 shrink-0 mt-0.5" style={{ color: textMuted }} />
            <p className="text-sm text-pretty" style={{ color: textSecondary, lineHeight: 1.65 }}>
              <strong style={{ color: licorice }}>Payment request records are saved only in this browser.</strong>{' '}
              They are not stored on-chain or synced to any server, and will not automatically
              appear on another device or browser. Two wallet confirmations are required per
              payment: one ERC-20 approval and one contract call.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <div className="mx-auto max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
            <h2
              className="display text-3xl font-bold text-balance mb-4"
              style={{ color: licorice, letterSpacing: '-0.025em' }}
            >
              Ready to create your first payment link?
            </h2>
            <p className="text-sm mb-8" style={{ color: textSecondary, lineHeight: 1.65 }}>
              Enter your business name, payout address, and amount. ArcLink generates the link and
              QR code instantly.
            </p>
            <button
              onClick={onCreateLink}
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
              style={{ background: licorice, ['--tw-ring-color' as string]: gumdrop }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = jelly)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = licorice)}
            >
              <Link2 className="size-4" />
              Create a payment link
              <ChevronRight className="size-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer
        className="py-8 px-5"
        style={{ background: licorice, borderTop: `1px solid rgba(255,255,255,0.07)` }}
      >
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-5">
          <img
            src={logo}
            alt="ArcLink"
            className="h-9"
            style={{ width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <div className="flex items-center gap-5">
            <a
              href={REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 rounded"
              style={{ color: 'rgba(255,255,255,0.65)', ['--tw-ring-color' as string]: gumdrop }}
            >
              GitHub
              <ExternalLink className="size-3" />
            </a>
            <a
              href={EXPLORER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 rounded"
              style={{ color: gumdrop, ['--tw-ring-color' as string]: gumdrop }}
            >
              Contract on Explorer
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
