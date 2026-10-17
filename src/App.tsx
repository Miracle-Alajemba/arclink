import { useState } from 'react'
import { parseArcLinkParams } from '@/utils/links'
import MerchantDashboard from '@/components/MerchantDashboard'
import CheckoutPage from '@/components/CheckoutPage'
import type { Address } from 'viem'
import type { ArcLinkParams } from '@/utils/links'

const ARCLINK_CONTRACT_ADDRESS = (
  import.meta.env.VITE_ARCLINK_ADDRESS ?? '0x0000000000000000000000000000000000000000'
) as Address

export default function App() {
  // Support both real URL params (shared link) and in-app preview navigation
  const [previewParams, setPreviewParams] = useState<ArcLinkParams | null>(null)

  const urlParams = parseArcLinkParams(window.location.search)
  const activeParams = urlParams ?? previewParams

  if (activeParams) {
    return (
      <CheckoutPage
        params={activeParams}
        arcLinkAddress={ARCLINK_CONTRACT_ADDRESS}
        onBack={previewParams ? () => setPreviewParams(null) : undefined}
      />
    )
  }

  return (
    <MerchantDashboard
      onPreview={(params) => setPreviewParams(params)}
    />
  )
}
