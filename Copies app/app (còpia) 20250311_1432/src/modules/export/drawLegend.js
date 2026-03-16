function getCanvasDash(dashStyle) {
  if (dashStyle === 'dashed') return [8, 6]
  if (dashStyle === 'dotted') return [2, 6]
  return []
}

function drawLegendIcon(ctx, layer, iconX, iconCenterY, iconW, rowH) {
  const { geometryType, style = {} } = layer
  ctx.save()

  if (geometryType === 'point') {
    const r = Math.min(Math.max(Number(style.radius) || 7, 3), rowH / 2 - 1)
    const cx = iconX + iconW / 2
    ctx.beginPath()
    ctx.arc(cx, iconCenterY, r, 0, Math.PI * 2)
    ctx.globalAlpha = Number(style.fillOpacity ?? 0.9)
    ctx.fillStyle = style.fillColor || '#d4335b'
    ctx.fill()
    ctx.globalAlpha = Number(style.strokeOpacity ?? 1)
    ctx.strokeStyle = style.strokeColor || '#d4335b'
    ctx.lineWidth = Math.min(Number(style.strokeWidth) || 2, 3)
    ctx.setLineDash([])
    ctx.stroke()
  } else if (geometryType === 'line') {
    ctx.beginPath()
    ctx.moveTo(iconX, iconCenterY)
    ctx.lineTo(iconX + iconW, iconCenterY)
    ctx.globalAlpha = Number(style.opacity ?? 1)
    ctx.strokeStyle = style.color || '#ea8b1f'
    ctx.lineWidth = Math.min(Number(style.width) || 3, 5)
    ctx.setLineDash(getCanvasDash(style.dashStyle))
    ctx.stroke()
  } else if (geometryType === 'polygon') {
    const rpad = 2
    const rW = iconW - rpad * 2
    const rH = Math.round(rowH * 0.6)
    const rX = iconX + rpad
    const rY = iconCenterY - rH / 2
    ctx.beginPath()
    ctx.rect(rX, rY, rW, rH)
    ctx.globalAlpha = Number(style.fillOpacity ?? 0.18)
    ctx.fillStyle = style.fillColor || '#2f7de1'
    ctx.fill()
    if ((Number(style.strokeWidth) ?? 2) > 0) {
      ctx.globalAlpha = Number(style.strokeOpacity ?? 1)
      ctx.strokeStyle = style.strokeColor || '#2f7de1'
      ctx.lineWidth = Math.min(Number(style.strokeWidth) || 2, 3)
      ctx.setLineDash(getCanvasDash(style.dashStyle))
      ctx.stroke()
    }
  }

  ctx.restore()
}

export function drawLegend(ctx, canvasWidth, canvasHeight, legendLayers) {
  if (legendLayers.length === 0) return

  const pad = 12
  const rowH = 26
  const iconW = 32
  const gap = 8
  const fontSize = 12

  ctx.save()
  ctx.font = `${fontSize}px sans-serif`

  const maxNameWidth = legendLayers.reduce(
    (max, l) => Math.max(max, ctx.measureText(l.name).width),
    0,
  )

  const boxW = pad + iconW + gap + Math.ceil(maxNameWidth) + pad
  const boxH = pad + legendLayers.length * rowH + pad
  const margin = 12
  const bx = canvasWidth - boxW - margin
  const by = canvasHeight - boxH - margin

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(bx, by, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  legendLayers.forEach((layer, i) => {
    const rowY = by + pad + i * rowH
    const iconX = bx + pad
    const iconCenterY = rowY + rowH / 2

    drawLegendIcon(ctx, layer, iconX, iconCenterY, iconW, rowH)

    ctx.globalAlpha = 1
    ctx.fillStyle = '#222'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textBaseline = 'middle'
    ctx.setLineDash([])
    ctx.fillText(layer.name, iconX + iconW + gap, iconCenterY)
  })

  ctx.restore()
}
