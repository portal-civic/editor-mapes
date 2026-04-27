// Floating pill: drawn as an overlay on top of the map canvas
export function drawTitle(ctx, canvasWidth, title, fontFamily = 'sans-serif') {
  if (!title || !title.trim()) return
  const text = title.trim()
  const fontSize = 15
  const pad = 10
  const margin = 12

  ctx.save()
  ctx.font = `bold ${fontSize}px ${fontFamily}`
  const textW = ctx.measureText(text).width
  const boxW = textW + pad * 2
  const boxH = fontSize + pad * 2

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(margin, margin, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#111'
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(text, margin + pad, margin + boxH / 2)
  ctx.restore()
}

// Integrated title strip: a full-width rectangle that becomes part of the
// canvas layout (caller must account for TITLE_BAR_H in size calculations).
export const TITLE_BAR_H = 40

export function drawTitleBlock(ctx, x, y, w, h, title, fontFamily = 'sans-serif') {
  if (!title || !title.trim()) return
  ctx.save()
  // White strip
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, w, h)
  // Subtle separator line at the bottom
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(x, y + h - 0.5)
  ctx.lineTo(x + w, y + h - 0.5)
  ctx.stroke()
  // Title text
  ctx.fillStyle = '#0f172a'
  ctx.font = `bold 15px ${fontFamily}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillText(title.trim(), x + 16, y + h / 2)
  ctx.restore()
}
