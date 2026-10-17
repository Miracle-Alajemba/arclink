/**
 * Minimal QR code renderer using the `qrcode` package.
 * We use a canvas-based approach so there is no SVG DOM bloat.
 */
import { useEffect, useRef } from 'react'

interface QRCodeProps {
  value: string
  size?: number
}

// Simple inline QR code renderer using a data URL approach.
// We generate QR codes using a minimal implementation without external packages.
// For production, swap in the `qrcode` npm package.
export default function QRCode({ value, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // We dynamically import qrcode to avoid build issues
    void import('qrcode').then((QRCodeLib) => {
      return QRCodeLib.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: { dark: '#122d45', light: '#ffffff' },
      })
    }).catch(() => {
      // Fallback: draw a placeholder
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = '#f5f5f8'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#122d45'
      ctx.font = `${size * 0.08}px DM Sans, sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('Install qrcode pkg', size / 2, size / 2)
    })
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{ borderRadius: '12px', display: 'block' }}
    />
  )
}
