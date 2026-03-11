export function drawScaleBar(ctx, map, canvasHeight) {
  const MAX_BAR_W = 120
  const center = map.getCenter()
  const latRad = (center.lat * Math.PI) / 180
  const metersPerPx =
    ((2 * Math.PI * 6378137) / (256 * Math.pow(2, map.getZoom()))) *
    Math.cos(latRad)

  if (!Number.isFinite(metersPerPx) || metersPerPx <= 0) return

  const maxMeters = MAX_BAR_W * metersPerPx
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxMeters)))
  let niceDist = magnitude
  if (maxMeters / magnitude >= 5) niceDist = 5 * magnitude
  else if (maxMeters / magnitude >= 2) niceDist = 2 * magnitude

  const barW = Math.round(niceDist / metersPerPx)
  const label =
    niceDist >= 1000
      ? `${Math.round(niceDist / 1000)} km`
      : `${Math.round(niceDist)} m`

  const margin = 12
  const pad = 8
  const tickH = 5
  const barH = 4
  const fontSize = 11

  ctx.save()
  ctx.font = `${fontSize}px sans-serif`
  const textW = ctx.measureText(label).width
  const boxW = Math.max(barW, textW) + pad * 2
  const boxH = tickH + barH + fontSize + 6 + pad * 2
  const bx = margin
  const by = canvasHeight - boxH - margin

  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(bx, by, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  const barX = bx + pad
  const barY = by + pad + tickH

  ctx.fillStyle = '#444'
  ctx.fillRect(barX, barY, barW, barH)

  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(barX, barY - tickH / 2)
  ctx.lineTo(barX, barY + barH + tickH / 2)
  ctx.moveTo(barX + barW, barY - tickH / 2)
  ctx.lineTo(barX + barW, barY + barH + tickH / 2)
  ctx.stroke()

  ctx.fillStyle = '#333'
  ctx.font = `${fontSize}px sans-serif`
  ctx.textBaseline = 'top'
  ctx.textAlign = 'left'
  ctx.fillText(label, barX, barY + barH + 4)

  ctx.restore()
}
