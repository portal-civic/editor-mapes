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

// Word-wrap helper for canvas text
function wrapText(ctx, text, maxWidth) {
  if (!text) return ['']
  if (ctx.measureText(text).width <= maxWidth) return [text]
  const words = String(text).split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [text]
}

// Count renderable rows across all entries (title rows + data rows)
function countTotalRows(entries) {
  let n = 0
  for (const entry of entries) {
    if (entry.isGroupHeader) { n++; continue }
    if (entry.rows.length > 1) n++ // group title counts as a row
    n += entry.rows.length
  }
  return n
}

// ─── Overlay mode (inside the map, bottom-right corner) ───────────────────────

export function drawLegend(ctx, canvasWidth, canvasHeight, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    fontFamily = 'Inter, sans-serif',
    fontSize = 11,
    titleFontSize = 12,
    padding: pad = 12,
  } = layout

  const rowH = 20
  const titleH = 18
  const iconW = 26
  const gap = 7
  const groupGap = 12

  ctx.save()
  ctx.font = `${fontSize}px ${fontFamily}`

  const items = []
  let maxTextWidth = 0

  legendEntries.forEach((entry, ei) => {
    if (ei > 0) items.push({ type: 'gap' })
    if (entry.isGroupHeader) {
      items.push({ type: 'title', text: entry.title })
      maxTextWidth = Math.max(maxTextWidth, ctx.measureText(entry.title).width)
      return
    }
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

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(bx, by, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  let curY = by + pad
  items.forEach((item) => {
    if (item.type === 'gap') {
      curY += groupGap
      return
    }
    if (item.type === 'title') {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#666666'
      ctx.font = `500 ${titleFontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.setLineDash([])
      ctx.fillText(item.text, bx + pad, curY + titleH / 2)
      curY += titleH
      return
    }
    const iconCenterY = curY + rowH / 2
    drawRowIcon(ctx, item, bx + pad, iconCenterY, iconW, rowH)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#222222'
    ctx.font = `400 ${fontSize}px ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.setLineDash([])
    ctx.fillText(item.label, bx + pad + iconW + gap, iconCenterY)
    curY += rowH
  })

  ctx.restore()
}

// ─── Column mode (side panel in PNG export) ───────────────────────────────────
// When maxLegendRows > 0 and total rows exceed the limit, entries are split
// into two equal sub-columns within the same colW.

export function drawLegendColumn(ctx, colX, colY, colW, colH, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    fontFamily = 'Inter, sans-serif',
    fontSize = 11,
    titleFontSize = 12,
    background = '#ffffff',
    border = true,
    padding: pad = 14,
    maxLegendRows = 0,
  } = layout

  // Multi-column: split into 2 sub-columns when over the row limit
  if (maxLegendRows > 0 && countTotalRows(legendEntries) > maxLegendRows) {
    const halfCount = Math.ceil(legendEntries.length / 2)
    const leftEntries = legendEntries.slice(0, halfCount)
    const rightEntries = legendEntries.slice(halfCount)
    const halfW = Math.floor(colW / 2)
    // Background + border drawn once for the full area
    ctx.save()
    ctx.fillStyle = background
    ctx.fillRect(colX, colY, colW, colH)
    if (border) {
      ctx.strokeStyle = 'rgba(0,0,0,0.14)'
      ctx.lineWidth = 1
      ctx.setLineDash([])
      ctx.beginPath()
      ctx.moveTo(colX, colY)
      ctx.lineTo(colX, colY + colH)
      ctx.stroke()
      // Divider between sub-columns
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.beginPath()
      ctx.moveTo(colX + halfW, colY + pad)
      ctx.lineTo(colX + halfW, colY + colH - pad)
      ctx.stroke()
    }
    ctx.restore()
    const noDecorLayout = { ...layout, background: 'transparent', border: false, maxLegendRows: 0 }
    drawLegendColumn(ctx, colX, colY, halfW, colH, leftEntries, noDecorLayout)
    if (rightEntries.length > 0) {
      drawLegendColumn(ctx, colX + halfW, colY, halfW, colH, rightEntries, noDecorLayout)
    }
    return
  }

  ctx.save()

  ctx.beginPath()
  ctx.rect(colX, colY, colW, colH)
  ctx.clip()

  ctx.fillStyle = background
  ctx.fillRect(colX, colY, colW, colH)

  if (border) {
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(colX, colY)
    ctx.lineTo(colX, colY + colH)
    ctx.stroke()
  }

  const iconW = Math.max(18, fontSize * 1.7)
  const gap = 7
  const textW = colW - pad * 2 - iconW - gap
  const rowH = Math.max(18, fontSize + 7)
  const titleH = Math.max(16, titleFontSize + 6)
  const lineSpacing = fontSize * 1.5

  let curY = colY + pad

  for (let ei = 0; ei < legendEntries.length; ei++) {
    const entry = legendEntries[ei]
    if (ei > 0) curY += 12

    if (entry.isGroupHeader) {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#555555'
      ctx.font = `700 ${titleFontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.setLineDash([])
      ctx.fillText(entry.title || '', colX + pad, curY + titleH / 2)
      curY += titleH + 3
      continue
    }

    if (entry.rows.length > 1) {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#666666'
      ctx.font = `500 ${titleFontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.setLineDash([])
      ctx.fillText(entry.title || '', colX + pad, curY + titleH / 2)
      curY += titleH + 3
    }

    for (const row of entry.rows) {
      if (curY >= colY + colH - 4) break

      ctx.font = `400 ${fontSize}px ${fontFamily}`
      const lines = wrapText(ctx, row.label || '', Math.max(textW, 20))
      const rowActualH = lines.length > 1 ? lines.length * lineSpacing + 4 : rowH
      const iconCenterY = curY + Math.min(rowH, rowActualH) / 2

      drawRowIcon(ctx, row, colX + pad, iconCenterY, iconW, rowH)

      ctx.globalAlpha = 1
      ctx.fillStyle = '#222222'
      ctx.font = `400 ${fontSize}px ${fontFamily}`
      ctx.textBaseline = 'top'
      ctx.setLineDash([])

      const textX = colX + pad + iconW + gap
      const textStartY = curY + (rowActualH - lines.length * lineSpacing) / 2

      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], textX, textStartY + li * lineSpacing)
      }

      curY += rowActualH + 4
    }
  }

  ctx.restore()
}

// ─── Horizontal bar mode (bottom strip in PNG export) ────────────────────────

export function drawLegendBar(ctx, barX, barY, barW, barH, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    background = '#ffffff',
    border = true,
    padding: pad = 12,
  } = layout

  ctx.save()

  ctx.beginPath()
  ctx.rect(barX, barY, barW, barH)
  ctx.clip()

  ctx.fillStyle = background
  ctx.fillRect(barX, barY, barW, barH)

  if (border) {
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(barX, barY)
    ctx.lineTo(barX + barW, barY)
    ctx.stroke()
  }

  const count = legendEntries.length
  const colW = Math.floor((barW - pad) / Math.max(count, 1))

  legendEntries.forEach((entry, ei) => {
    drawLegendColumn(
      ctx,
      barX + ei * colW,
      barY,
      colW,
      barH,
      [entry],
      { ...layout, border: false },
    )
  })

  ctx.restore()
}
