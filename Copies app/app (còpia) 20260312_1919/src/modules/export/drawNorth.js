export function drawNorthArrow(ctx, canvasWidth) {
  const margin = 12
  const pad = 6
  const fontSize = 10
  const arrowTotalH = 22
  const arrowW = 14
  const boxW = arrowW + pad * 2 + 4
  const boxH = fontSize + 4 + arrowTotalH + pad * 2
  const bx = canvasWidth - boxW - margin
  const by = margin

  ctx.save()

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.rect(bx, by, boxW, boxH)
  ctx.fill()
  ctx.stroke()

  const cx = bx + boxW / 2

  ctx.fillStyle = '#222'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('N', cx, by + pad)

  const arrowTop = by + pad + fontSize + 4
  const arrowMid = arrowTop + arrowTotalH / 2
  const arrowBot = arrowTop + arrowTotalH
  const halfW = arrowW / 2

  ctx.beginPath()
  ctx.moveTo(cx, arrowTop)
  ctx.lineTo(cx + halfW, arrowMid)
  ctx.lineTo(cx - halfW, arrowMid)
  ctx.closePath()
  ctx.fillStyle = '#333'
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(cx, arrowBot)
  ctx.lineTo(cx + halfW, arrowMid)
  ctx.lineTo(cx - halfW, arrowMid)
  ctx.closePath()
  ctx.fillStyle = '#bbb'
  ctx.fill()

  ctx.restore()
}
