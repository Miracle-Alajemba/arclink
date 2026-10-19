import { useState } from 'react'
import { parseArcLinkParams } from '@/utils/links'
import LandingPage from '@/components/LandingPage'
import MerchantDashboard from '@/components/MerchantDashboard'
import CheckoutPage from '@/components/CheckoutPage'
import { ARCLINK_ADDRESS } from '@/chain-config'
import type { ArcLinkParams } from '@/utils/links'

type View = 'landing' | 'dashboard'

export default function App() {
  const [view, setView] = useState<View>('landing')
  const [previewParams, setPreviewParams] = useState<ArcLinkParams | null>(null)

  // Deep-link: URL params always take priority — open checkout directly
  const urlParams = parseArcLinkParams(window.location.search)
  const activeParams = urlParams ?? previewParams

  if (activeParams) {
    return (
      <CheckoutPage
        params={activeParams}
        arcLinkAddress={ARCLINK_ADDRESS}
        onBack={previewParams ? () => setPreviewParams(null) : undefined}
      />
    )
  }

  if (view === 'dashboard') {
    return (
      <MerchantDashboard
        onPreview={(params) => setPreviewParams(params)}
        onBack={() => setView('landing')}
      />
    )
  }

  return <LandingPage onCreateLink={() => setView('dashboard')} />
}
