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

// ─── Overlay mode (inside the map, bottom-right corner) ───────────────────────
// legendEntries: [{ title: string, rows: [{ label, geometryType, style }] }]

export function drawLegend(ctx, canvasWidth, canvasHeight, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    fontFamily = 'sans-serif',
    fontSize = 11,
    titleFontSize = 10,
    padding: pad = 12,
  } = layout

  const rowH = 24
  const titleH = 18
  const iconW = 28
  const gap = 8
  const groupGap = 6

  ctx.save()
  ctx.font = `${fontSize}px ${fontFamily}`

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
      ctx.font = `600 ${titleFontSize}px ${fontFamily}`
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
    ctx.font = `${fontSize}px ${fontFamily}`
    ctx.textBaseline = 'middle'
    ctx.setLineDash([])
    ctx.fillText(item.label, bx + pad + iconW + gap, iconCenterY)
    curY += rowH
  })

  ctx.restore()
}

// ─── Column mode (side panel in PNG export) ───────────────────────────────────
// Fills a rectangular column area with white background + legend entries.
// Text is word-wrapped to fit within the column width.

export function drawLegendColumn(ctx, colX, colY, colW, colH, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    fontFamily = 'sans-serif',
    fontSize = 11,
    titleFontSize = 10,
    background = '#ffffff',
    border = true,
    padding: pad = 14,
  } = layout

  ctx.save()

  // Clip to column bounds to prevent overflow
  ctx.beginPath()
  ctx.rect(colX, colY, colW, colH)
  ctx.clip()

  // Background
  ctx.fillStyle = background
  ctx.fillRect(colX, colY, colW, colH)

  // Border on the side that faces the map (left border for right column)
  if (border) {
    ctx.strokeStyle = 'rgba(0,0,0,0.14)'
    ctx.lineWidth = 1
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(colX, colY)
    ctx.lineTo(colX, colY + colH)
    ctx.stroke()
  }

  const iconW = Math.max(20, fontSize * 1.8)
  const gap = 7
  const textW = colW - pad * 2 - iconW - gap
  const rowH = Math.max(22, fontSize * 2.1)
  const titleH = Math.max(16, titleFontSize * 1.9)
  const lineSpacing = fontSize * 1.4

  let curY = colY + pad

  for (let ei = 0; ei < legendEntries.length; ei++) {
    const entry = legendEntries[ei]
    if (ei > 0) curY += 10

    // Group title (only when multiple rows)
    if (entry.rows.length > 1) {
      ctx.globalAlpha = 1
      ctx.fillStyle = '#94a3b8'
      ctx.font = `600 ${titleFontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.setLineDash([])
      ctx.fillText((entry.title || '').toUpperCase(), colX + pad, curY + titleH / 2)
      curY += titleH
    }

    // Rows
    for (const row of entry.rows) {
      if (curY >= colY + colH - 4) break // overflow guard

      ctx.font = `${fontSize}px ${fontFamily}`
      const lines = wrapText(ctx, row.label || '', Math.max(textW, 20))
      const rowActualH = lines.length > 1 ? lines.length * lineSpacing + 4 : rowH
      const iconCenterY = curY + Math.min(rowH, rowActualH) / 2

      drawRowIcon(ctx, row, colX + pad, iconCenterY, iconW, rowH)

      ctx.globalAlpha = 1
      ctx.fillStyle = '#1f2937'
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.textBaseline = 'top'
      ctx.setLineDash([])

      const textX = colX + pad + iconW + gap
      const textStartY = curY + (rowActualH - lines.length * lineSpacing) / 2

      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], textX, textStartY + li * lineSpacing)
      }

      curY += rowActualH
    }
  }

  ctx.restore()
}

// ─── Horizontal bar mode (bottom strip in PNG export) ────────────────────────
// Entries are laid out in columns side-by-side within a horizontal strip.

export function drawLegendBar(ctx, barX, barY, barW, barH, legendEntries, layout = {}) {
  if (!legendEntries || legendEntries.length === 0) return

  const {
    fontFamily = 'sans-serif',
    fontSize = 11,
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

  // Split entries into columns of equal width
  const count = legendEntries.length
  const colW = Math.floor((barW - pad) / Math.max(count, 1))

  legendEntries.forEach((entry, ei) => {
    // Draw each entry as a mini-column
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
