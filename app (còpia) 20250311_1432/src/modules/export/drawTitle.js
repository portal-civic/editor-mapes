export function drawTitle(ctx, canvasWidth, title) {
  if (!title || !title.trim()) return
  const text = title.trim()
  const fontSize = 16
  const pad = 10
  const margin = 12

  ctx.save()
  ctx.font = `bold ${fontSize}px sans-serif`
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
