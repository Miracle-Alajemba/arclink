/**
 * Minimal QR code renderer using the `qrcode` package (canvas-based).
 * Exposed via forwardRef so parents can access the canvas for download/print.
 */
import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

interface QRCodeProps {
  value: string
  size?: number
}

export interface QRCodeHandle {
  /** Returns the canvas data URL (PNG), or null if not ready. */
  toDataURL: () => string | null
  /** Returns the underlying canvas element, or null if not mounted. */
  getCanvas: () => HTMLCanvasElement | null
}

const QRCode = forwardRef<QRCodeHandle, QRCodeProps>(function QRCode(
  { value, size = 200 },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null,
    getCanvas: () => canvasRef.current,
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    void import('qrcode').then((QRCodeLib) => {
      return QRCodeLib.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        color: { dark: '#122d45', light: '#ffffff' },
      })
    }).catch(() => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = size
      canvas.height = size
      ctx.fillStyle = '#f5f5f8'
      ctx.fillRect(0, 0, size, size)
      ctx.fillStyle = '#122d45'
      ctx.font = `${size * 0.08}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillText('QR unavailable', size / 2, size / 2)
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
})

export default QRCode
