function getCanvasDash(dashStyle) {
  if (dashStyle === 'dashed') return [8, 6]
  if (dashStyle === 'dotted') return [2, 6]
  return []
}

function drawRowIcon(ctx, row, iconX, iconCenterY, iconW, rowH) {
  const { geometryType, style = {} } = row
  ctx.save()

  if (geometryType === 'point') {
    const r = Math.min(Math.max(Number(style.radius) || 6, 3), rowH / 2 - 1)
    const cx = iconX + iconW / 2
    ctx.beginPath()
    ctx.arc(cx, iconCenterY, r, 0, Math.PI * 2)
    ctx.globalAlpha = Number(style.fillOpacity ?? 0.9)
    ctx.fillStyle = style.fillColor || '#d4335b'
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = style.strokeColor || style.fillColor || '#d4335b'
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
  } else {
    // polygon
    const rpad = 2
    const rW = iconW - rpad * 2
    const rH = Math.round(rowH * 0.6)
    const rX = iconX + rpad
    const rY = iconCenterY - rH / 2
    ctx.beginPath()
    ctx.rect(rX, rY, rW, rH)
    ctx.globalAlpha = Number(style.fillOpacity ?? 0.35)
    ctx.fillStyle = style.fillColor || '#2f7de1'
    ctx.fill()
    if ((Number(style.strokeWidth) ?? 2) > 0) {
      ctx.globalAlpha = Number(style.strokeOpacity ?? 1)
      ctx.strokeStyle = style.strokeColor || style.fillColor || '#2f7de1'
      ctx.lineWidth = Math.min(Number(style.strokeWidth) || 2, 3)
      ctx.setLineDash(getCanvasDash(style.dashStyle))
      ctx.stroke()
    }
  }

  ctx.restore()
}

// ─── Main export ──────────────────────────────────────────────────────────────
// legendEntries: [{ title: string, rows: [{ label, geometryType, style }] }]

export function drawLegend(ctx, canvasWidth, canvasHeight, legendEntries) {
  if (!legendEntries || legendEntries.length === 0) return

  const pad = 12
  const rowH = 24
  const titleH = 18
  const iconW = 28
  const gap = 8
  const groupGap = 6
  const fontSize = 11
  const titleFontSize = 10

  ctx.save()
  ctx.font = `${fontSize}px sans-serif`

  // Build flat render list + measure max text width
  const items = []
  let maxTextWidth = 0

  legendEntries.forEach((entry, ei) => {
    if (ei > 0) items.push({ type: 'gap' })
    if (entry.rows.length > 1) {
      items.push({ type: 'title', text: entry.title })
      maxTextWidth = Math.max(maxTextWidth, ctx.measureText(entry.title).width)
    }
    entry.rows.forEach((row) => {
      items.push({ type: 'row', ...row })
      maxTextWidth = Math.max(maxTextWidth, ctx.measureText(row.label).width)
    })
  })

  const boxW = pad + iconW + gap + Math.ceil(maxTextWidth) + pad
  let boxH = pad
  items.forEach((item) => {
    if (item.type === 'gap') boxH += groupGap
    else if (item.type === 'title') boxH += titleH
    else boxH += rowH
  })
  boxH += pad

  const margin = 12
  const bx = canvasWidth - boxW - margin
  const by = canvasHeight - boxH - margin

  // Background box
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(bx, by, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  // Render items
  let curY = by + pad
  items.forEach((item) => {
    if (item.type === 'gap') {
      curY += groupGap
      return
    }
    if (item.type === 'title') {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#94a3b8'
      ctx.font = `600 ${titleFontSize}px sans-serif`
      ctx.textBaseline = 'middle'
      ctx.setLineDash([])
      ctx.fillText(item.text.toUpperCase(), bx + pad, curY + titleH / 2)
      curY += titleH
      return
    }
    // row
    const iconCenterY = curY + rowH / 2
    drawRowIcon(ctx, item, bx + pad, iconCenterY, iconW, rowH)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#222'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textBaseline = 'middle'
    ctx.setLineDash([])
    ctx.fillText(item.label, bx + pad + iconW + gap, iconCenterY)
    curY += rowH
  })

  ctx.restore()
}
