'use client'

import { useEffect, useRef } from 'react'
import { getPetDef, type PetType, type PetVariant, type PetStage } from '@/lib/pets'

interface Props {
  type: PetType
  variant: PetVariant
  stage: PetStage
  size?: number
}

// hex → rgba string
function ca(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ── ЯЙЦО ──────────────────────────────────────────────────────────────────────
function drawEgg(ctx: CanvasRenderingContext2D, cx: number, cy: number, isVirus: boolean, C: string, t: number, size: number) {
  const ew = size * 0.26, eh = size * 0.32
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.04)

  if (isVirus) {
    ctx.save()
    ctx.fillStyle = C
    ctx.shadowColor = C; ctx.shadowBlur = 8
    const spikeN = 12
    for (let i = 0; i < spikeN; i++) {
      const angle = (i / spikeN) * Math.PI * 2
      const sx = cx + Math.cos(angle) * ew
      const sy = cy + Math.sin(angle) * eh
      const spikeLen = ew * 0.22 + Math.sin(i * 2.3) * ew * 0.08
      const tx2 = cx + Math.cos(angle) * (ew + spikeLen)
      const ty2 = cy + Math.sin(angle) * (eh + spikeLen)
      const perp = angle + Math.PI / 2
      const sw = Math.max(1, ew * 0.06)
      ctx.beginPath()
      ctx.moveTo(tx2, ty2)
      ctx.lineTo(sx + Math.cos(perp) * sw, sy + Math.sin(perp) * sw)
      ctx.lineTo(sx - Math.cos(perp) * sw, sy - Math.sin(perp) * sw)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()
  }

  ctx.save()
  ctx.shadowColor = C; ctx.shadowBlur = 8 + pulse * 8
  ctx.beginPath(); ctx.ellipse(cx, cy, ew, eh, 0, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.1 + pulse * 0.05); ctx.fill()
  ctx.strokeStyle = ca(C, 0.65); ctx.lineWidth = 1.5; ctx.stroke()
  const ig = ctx.createRadialGradient(cx - ew * 0.25, cy - eh * 0.25, 0, cx, cy, ew)
  ig.addColorStop(0, ca(C, 0.18))
  ig.addColorStop(1, ca(C, 0))
  ctx.fillStyle = ig
  ctx.beginPath(); ctx.ellipse(cx, cy, ew, eh, 0, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

// ── УНИКАЛЬНЫЕ ГЛАЗА ──────────────────────────────────────────────────────────
function drawEyes(ctx: CanvasRenderingContext2D, type: PetType, cx: number, cy: number, r: number, isVirus: boolean, C: string, t: number) {
  const eo = r * 0.37
  const eyY = cy - r * 0.06
  const blink = t % 210 < 7

  ctx.save()
  ctx.fillStyle = C; ctx.strokeStyle = C
  ctx.shadowColor = C; ctx.shadowBlur = 8

  switch (type) {
    case 'hologram': {
      // Горизонтальные щели-сканлайны
      const slitH = blink ? 0.5 : 2.5
      if (isVirus && t % 25 < 5) {
        ctx.globalAlpha = 0.5
        ctx.fillRect(cx - eo - 7, eyY - 1, 14, 2)
        ctx.fillRect(cx + eo - 7, eyY - 1, 14, 2)
        ctx.globalAlpha = 1
      }
      ctx.fillRect(cx - eo - 6, eyY - slitH / 2, 12, slitH)
      ctx.fillRect(cx + eo - 6, eyY - slitH / 2, 12, slitH)
      break
    }
    case 'ghost': {
      if (!isVirus) {
        // Большие капли-слёзы
        const ery = blink ? 0.4 : 7
        const erx = blink ? 3.5 : 5
        ctx.beginPath(); ctx.ellipse(cx - eo, eyY, erx, ery, 0, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.ellipse(cx + eo, eyY, erx, ery, 0, 0, Math.PI * 2); ctx.fill()
      } else {
        // X
        const s = 5;
        [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
          ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey + s); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(ex + s, ey - s); ctx.lineTo(ex - s, ey + s); ctx.stroke()
        })
      }
      break
    }
    case 'jellyfish': {
      if (!isVirus) {
        // Широкие круглые точки
        const er = blink ? 0.3 : 4
        ctx.beginPath(); ctx.arc(cx - eo, eyY, er, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(cx + eo, eyY, er, 0, Math.PI * 2); ctx.fill()
      } else {
        // Треугольники ▽
        const s = 4;
        [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
          ctx.beginPath(); ctx.moveTo(ex - s, ey - s); ctx.lineTo(ex + s, ey - s); ctx.lineTo(ex, ey + s); ctx.closePath(); ctx.fill()
        })
      }
      break
    }
    case 'signal': {
      ctx.lineWidth = 2
      if (!isVirus) {
        // Прямая линия — осциллограф
        ctx.beginPath(); ctx.moveTo(cx - eo - 5, eyY); ctx.lineTo(cx - eo + 5, eyY); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx + eo - 5, eyY); ctx.lineTo(cx + eo + 5, eyY); ctx.stroke()
      } else {
        // Зигзаг ⌇
        ctx.lineWidth = 1.5;
        [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
          ctx.beginPath()
          ctx.moveTo(ex - 4, ey); ctx.lineTo(ex - 2, ey - 3)
          ctx.lineTo(ex, ey + 3); ctx.lineTo(ex + 2, ey - 3); ctx.lineTo(ex + 4, ey)
          ctx.stroke()
        })
      }
      break
    }
    case 'radar': {
      [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
        const s = 4
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(ex - s, ey); ctx.lineTo(ex + s, ey); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(ex, ey - s); ctx.lineTo(ex, ey + s); ctx.stroke()
        if (isVirus) {
          // Вращающийся доп. крест
          ctx.save(); ctx.translate(ex, ey); ctx.rotate(t * 0.035)
          ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.7); ctx.lineTo(s * 0.7, s * 0.7); ctx.stroke()
          ctx.beginPath(); ctx.moveTo(s * 0.7, -s * 0.7); ctx.lineTo(-s * 0.7, s * 0.7); ctx.stroke()
          ctx.restore()
        } else {
          ctx.beginPath(); ctx.arc(ex, ey, 2, 0, Math.PI * 2); ctx.fill()
        }
      })
      break
    }
    case 'neuron': {
      [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
        if (!isVirus) {
          // Точка в кольце ◎
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.stroke()
          ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2); ctx.fill()
        } else {
          // Искра ✳
          const rays = 4
          ctx.lineWidth = 1.5
          for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2
            ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(a) * 5, ey + Math.sin(a) * 5); ctx.stroke()
          }
        }
      })
      break
    }
    case 'plasma': {
      [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
        const rays = isVirus ? 6 : 4
        const s = 5
        ctx.lineWidth = 1.5
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * Math.PI * 2 + (isVirus ? t * 0.025 : 0)
          ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 1.5, ey + Math.sin(a) * 1.5)
          ctx.lineTo(ex + Math.cos(a) * s, ey + Math.sin(a) * s); ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(ex, ey, 1.5, 0, Math.PI * 2); ctx.fill()
      })
      break
    }
    case 'crystal': {
      [[cx - eo, eyY], [cx + eo, eyY]].forEach(([ex, ey]) => {
        const s = 4
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(ex, ey - s); ctx.lineTo(ex + s, ey)
        ctx.lineTo(ex, ey + s); ctx.lineTo(ex - s, ey); ctx.closePath()
        if (!isVirus) {
          ctx.stroke()
        } else {
          ctx.fill()
          // Трещина
          ctx.save(); ctx.strokeStyle = 'rgba(6,6,18,0.8)'; ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(ex - 2, ey - 3); ctx.lineTo(ex, ey); ctx.lineTo(ex + 1, ey + 3); ctx.stroke()
          ctx.restore()
        }
      })
      break
    }
  }
  ctx.restore()
}

// ── СУЩЕСТВА ──────────────────────────────────────────────────────────────────

function drawHologram(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, cy = h * 0.48
  const bw = w * 0.26, bh = h * 0.32
  const rot = t * (isVirus ? 0.02 : 0.01)

  // Антенны
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 6
  ctx.strokeStyle = ca(C, 0.5); ctx.lineWidth = 1.5
  const antLen = h * 0.16
  ;[[-bw * 0.4, -bh * 1.1, -bw * 0.6, -bh * 1.6], [bw * 0.4, -bh * 1.1, bw * 0.6, -bh * 1.6]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(cx + x1, cy + y1); ctx.lineTo(cx + x2, cy + y2); ctx.stroke()
    ctx.fillStyle = C; ctx.beginPath(); ctx.arc(cx + x2, cy + y2, 2.5, 0, Math.PI * 2); ctx.fill()
  })
  ctx.restore()

  // Код внутри тела
  ctx.save(); ctx.font = `${Math.floor(h * 0.065)}px 'JetBrains Mono',monospace`
  ctx.fillStyle = ca(C, 0.3); ctx.textAlign = 'center'
  const codeLines = isVirus ? ['ER!', 'X0X', '!!X'] : ['010', '{}[]', '<>//']
  const clipW = bw * 1.9, clipH = bh * 1.9
  ctx.save()
  ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2); ctx.clip()
  const scrollY = (t * 0.4) % (clipH * 0.4)
  codeLines.forEach((line, i) => ctx.fillText(line, cx, cy - clipH / 2 + i * 14 + scrollY))
  ctx.restore()
  ctx.restore()

  // Тело
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 14
  ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, rot, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.07); ctx.fill()
  ctx.strokeStyle = ca(C, 0.7); ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  // Глитч-полосы для вируса
  if (isVirus && t % 30 < 6) {
    ctx.save(); ctx.globalAlpha = 0.3
    ctx.fillStyle = C
    ctx.fillRect(cx - bw, cy + (Math.random() - 0.5) * bh, bw * 2, 2)
    ctx.restore()
  }

  drawEyes(ctx, 'hologram', cx, cy, Math.min(bw, bh) * 0.85, isVirus, C, t)
}

function drawGhost(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, floatY = Math.sin(t * 0.04) * 5
  const cy = h * 0.42 + floatY
  const bw = w * 0.28, bh = h * 0.28
  const tailY = cy + bh * 0.45
  const tw = isVirus ? Math.sin(t * 0.18) * 4 : Math.sin(t * 0.07) * 2

  // Частицы
  ctx.save()
  for (let i = 0; i < 6; i++) {
    const phase = (t * 0.03 + i * 1.05) % (Math.PI * 2)
    const px = cx + Math.cos(i * 1.2 + t * 0.02) * bw * 0.8
    const py = tailY + 6 + Math.sin(phase) * 8
    const alpha = 0.3 + 0.3 * Math.sin(phase + i)
    ctx.fillStyle = ca(C, alpha)
    ctx.shadowColor = C; ctx.shadowBlur = 4
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()

  // Тело-призрак
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(cx, cy - bh * 0.1, bw, Math.PI, 0) // купол
  ctx.lineTo(cx + bw, tailY)
  const segs = 6
  for (let i = 0; i <= segs; i++) {
    const tx2 = cx + bw - (i / segs) * bw * 2
    const ty2 = tailY + (i % 2 === 0 ? (bw * 0.28) : 0) + tw * (i % 2 === 0 ? 1 : -1)
    ctx.lineTo(tx2, ty2)
  }
  ctx.closePath()
  ctx.fillStyle = ca(C, 0.08); ctx.fill()
  ctx.strokeStyle = ca(C, 0.65); ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  if (isVirus && t % 28 < 5) {
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = C
    ctx.fillRect(cx - bw, cy + (Math.random() - 0.5) * bh * 0.8, bw * 2, 3)
    ctx.restore()
  }

  drawEyes(ctx, 'ghost', cx, cy, bw * 0.9, isVirus, C, t)
}

function drawJellyfish(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, floatY = Math.sin(t * 0.035) * 4
  const cy = h * 0.35 + floatY
  const bw = w * 0.26, bh = h * 0.22

  // Щупальца
  const tentN = 7
  for (let i = 0; i < tentN; i++) {
    const tx2 = cx - bw * 0.85 + (i / (tentN - 1)) * bw * 1.7
    const tLen = (0.18 + (i % 2) * 0.1) * h
    const wave = Math.sin(t * 0.06 + i * 0.9) * 6
    ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 4
    const tg = ctx.createLinearGradient(tx2, cy + bh, tx2, cy + bh + tLen)
    tg.addColorStop(0, ca(C, 0.55)); tg.addColorStop(1, ca(C, 0))
    ctx.strokeStyle = tg; ctx.lineWidth = isVirus ? 2 : 3.5
    if (isVirus) ctx.setLineDash([2, 3])
    ctx.beginPath(); ctx.moveTo(tx2, cy + bh)
    ctx.quadraticCurveTo(tx2 + wave, cy + bh + tLen * 0.5, tx2 + wave * 0.5, cy + bh + tLen)
    ctx.stroke(); ctx.setLineDash([]); ctx.restore()
  }

  // Купол
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 14
  ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.09); ctx.fill()
  ctx.strokeStyle = ca(C, 0.65); ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  drawEyes(ctx, 'jellyfish', cx, cy, Math.min(bw, bh) * 0.9, isVirus, C, t)
}

function drawSignal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, headR = h * 0.175
  const headY = headR + h * 0.14
  const waveY = headY + headR + h * 0.07
  const amp = h * 0.1
  const mg = w * 0.08

  // Антенны
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 6
  ctx.strokeStyle = ca(C, 0.5); ctx.lineWidth = 1.5
  const antOff = headR * 0.45, antLen = h * 0.13
  ;[-antOff, antOff].forEach(off => {
    ctx.beginPath(); ctx.moveTo(cx + off, headY - headR); ctx.lineTo(cx + off * 1.4, headY - headR - antLen); ctx.stroke()
    ctx.fillStyle = C; ctx.beginPath(); ctx.arc(cx + off * 1.4, headY - headR - antLen - 2, 3, 0, Math.PI * 2); ctx.fill()
  })
  ctx.restore()

  // Голова
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 12
  ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.09); ctx.fill()
  ctx.strokeStyle = ca(C, 0.72); ctx.lineWidth = 1.5; ctx.stroke()
  ctx.restore()

  drawEyes(ctx, 'signal', cx, headY, headR * 0.9, isVirus, C, t)

  // Волна-тело
  function wv(x: number, total: number) {
    if (isVirus) {
      return Math.sin(x / total * Math.PI * 4 + t * 0.07) * 0.5
        + Math.sin(x / total * Math.PI * 9 - t * 0.11) * 0.3
        + Math.sin(x / total * Math.PI * 17 + t * 0.06) * 0.2
    }
    return Math.sin(x / total * Math.PI * 3 + t * 0.06)
  }

  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 8
  ctx.strokeStyle = C; ctx.lineWidth = 2
  const ww = w - mg * 2
  ctx.beginPath()
  for (let x = 0; x <= ww; x++) {
    const y = waveY + wv(x, ww) * amp
    x === 0 ? ctx.moveTo(mg + x, y) : ctx.lineTo(mg + x, y)
  }
  ctx.stroke()

  // Бегущая точка (только КОД)
  if (!isVirus) {
    const dotX = (t * 1.8) % ww
    const dotY = waveY + wv(dotX, ww) * amp
    ctx.fillStyle = C; ctx.shadowBlur = 12
    ctx.beginPath(); ctx.arc(mg + dotX, dotY, 3.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function drawRadar(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, cy = h / 2
  const R = Math.min(w, h) * 0.4
  const cR = R * 0.28
  const spd = isVirus ? 0.045 : 0.025

  // Кольца
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 4
  ;[1, 0.66, 0.33].forEach(s => {
    ctx.beginPath(); ctx.arc(cx, cy, R * s, 0, Math.PI * 2)
    ctx.strokeStyle = ca(C, 0.18); ctx.lineWidth = 0.8; ctx.stroke()
  })
  ctx.strokeStyle = ca(C, 0.12); ctx.lineWidth = 0.6
  ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke()
  ctx.restore()

  // Внешнее кольцо
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 8
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.strokeStyle = ca(C, 0.5); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  // Конус развёртки
  const sweep = (t * spd) % (Math.PI * 2)
  const coneW = isVirus ? Math.PI * 0.65 : Math.PI * 0.45
  for (let i = 0; i < 24; i++) {
    const a0 = sweep - coneW * (i + 1) / 24
    const a1 = sweep - coneW * i / 24
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R - 1, a0, a1); ctx.closePath()
    ctx.fillStyle = ca(C, (1 - i / 24) * (isVirus ? 0.18 : 0.13)); ctx.fill()
  }
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 10
  ctx.strokeStyle = ca(C, 0.85); ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R); ctx.stroke()
  ctx.restore()

  // Блипы
  for (let i = 0; i < (isVirus ? 8 : 6); i++) {
    const ba = (i / (isVirus ? 8 : 6)) * Math.PI * 2
    const br = (0.4 + (i * 0.11) % 0.5) * R
    const diff = ((sweep - ba) + Math.PI * 2) % (Math.PI * 2)
    if (diff < spd * 3) {
      ctx.save(); ctx.fillStyle = C; ctx.shadowColor = C; ctx.shadowBlur = 10
      const bx = cx + Math.cos(isVirus ? ba + Math.sin(t * 0.05) * 0.8 : ba) * br
      const by = cy + Math.sin(isVirus ? ba + Math.sin(t * 0.05) * 0.8 : ba) * br
      ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }

  // Ядро
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 10
  ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.12); ctx.fill()
  ctx.strokeStyle = ca(C, 0.75); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  drawEyes(ctx, 'radar', cx, cy, cR * 0.9, isVirus, C, t)
}

function drawNeuron(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, cy = h / 2
  const cR = Math.min(w, h) * 0.18
  const orbitR = Math.min(w, h) * 0.36
  const nodeN = isVirus ? 6 : 7

  const nodes = Array.from({ length: nodeN }, (_, i) => {
    const a = (i / nodeN) * Math.PI * 2 - Math.PI / 2
    const jitter = isVirus ? Math.sin(i * 1.7) * 0.3 : 0
    return {
      x: cx + Math.cos(a + jitter) * orbitR,
      y: cy + Math.sin(a + jitter) * orbitR,
      broken: isVirus && i % 3 === 2,
    }
  })

  // Связи
  nodes.forEach(node => {
    if (isVirus && node.broken) return
    ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 4
    ctx.strokeStyle = ca(C, 0.28); ctx.lineWidth = isVirus ? 0.8 : 1
    if (isVirus) ctx.setLineDash([3, 4])
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(node.x, node.y); ctx.stroke()
    ctx.setLineDash([]); ctx.restore()
  })

  // Пульсы по связям
  const pulseN = isVirus ? 2 : 3
  for (let p = 0; p < pulseN; p++) {
    const nodeIdx = Math.floor((t * 0.4 + p * nodeN / pulseN) % nodeN)
    const node = nodes[nodeIdx]
    if (node.broken) return
    const prog = ((t * 0.025 + p * 0.33) % 1)
    const px = cx + (node.x - cx) * prog
    const py = cy + (node.y - cy) * prog
    ctx.save(); ctx.fillStyle = C; ctx.shadowColor = C; ctx.shadowBlur = 10
    ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }

  // Узлы
  nodes.forEach((node, i) => {
    if (isVirus && node.broken) {
      if (t % 15 < 4) {
        ctx.save(); ctx.fillStyle = C; ctx.shadowColor = C; ctx.shadowBlur = 12; ctx.globalAlpha = 0.7
        ctx.beginPath(); ctx.arc(node.x + (Math.random() - 0.5) * 5, node.y + (Math.random() - 0.5) * 5, 2, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      return
    }
    const g = 0.5 + 0.5 * Math.sin(t * 0.05 + i * 0.9)
    ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 5 + g * 6
    ctx.beginPath(); ctx.arc(node.x, node.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = ca(C, 0.07 + g * 0.07); ctx.fill()
    ctx.strokeStyle = ca(C, 0.6); ctx.lineWidth = 1; ctx.stroke(); ctx.restore()
  })

  // Ядро
  const cg = 0.5 + 0.5 * Math.sin(t * 0.04)
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 10 + cg * 10
  ctx.beginPath(); ctx.arc(cx, cy, cR, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.1); ctx.fill()
  ctx.strokeStyle = ca(C, 0.8); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  drawEyes(ctx, 'neuron', cx, cy, cR * 0.9, isVirus, C, t)
}

function drawPlasma(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, cy = h / 2
  const r = Math.min(w, h) * 0.21
  const arcN = isVirus ? 9 : 5
  const maxLen = Math.min(w, h) * 0.22

  // Молнии
  if (t % (isVirus ? 3 : 7) === 0) {
    for (let i = 0; i < arcN; i++) {
      const a = Math.random() * Math.PI * 2
      const len = maxLen * (0.4 + Math.random() * 0.6)
      const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r
      const ex = cx + Math.cos(a) * (r + len), ey = cy + Math.sin(a) * (r + len)
      ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 8
      ctx.strokeStyle = ca(C, 0.85); ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(sx, sy)
      for (let s = 1; s < 6; s++) {
        const p = s / 6
        ctx.lineTo(sx + (ex - sx) * p + (Math.random() - 0.5) * 14,
          sy + (ey - sy) * p + (Math.random() - 0.5) * 14)
      }
      ctx.lineTo(ex, ey); ctx.stroke(); ctx.restore()
    }
  }

  // Пульс
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.1)
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 16 + pulse * 12
  ctx.beginPath(); ctx.arc(cx, cy, r + 3 + pulse * 4, 0, Math.PI * 2)
  ctx.strokeStyle = ca(C, 0.2); ctx.lineWidth = 3; ctx.stroke(); ctx.restore()

  // Ядро
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 14
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, 0.1); ctx.fill()
  ctx.strokeStyle = ca(C, 0.82); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  drawEyes(ctx, 'plasma', cx, cy, r * 0.9, isVirus, C, t)
}

function drawCrystal(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) {
  const cx = w / 2, cy = h / 2
  const sides = isVirus ? 6 : 8
  const R = Math.min(w, h) * 0.38
  const iR = R * 0.55
  const rot = t * (isVirus ? 0.028 : 0.014)
  const shake = isVirus && t % 55 < 8 ? (Math.random() - 0.5) * 4 : 0

  function poly(r: number, off: number) {
    ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2 + off
      i === 0 ? ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
        : ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    }
    ctx.closePath()
  }

  ctx.save(); ctx.translate(shake, 0)

  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 10
  poly(R, rot)
  ctx.fillStyle = ca(C, 0.06); ctx.fill()
  ctx.strokeStyle = ca(C, 0.62); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore()

  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 6
  poly(iR, -rot * 1.8)
  ctx.strokeStyle = ca(C, 0.4); ctx.lineWidth = 1; ctx.stroke(); ctx.restore()

  for (let i = 0; i < sides; i++) {
    const a1 = (i / sides) * Math.PI * 2 + rot
    const a2 = ((i + 0.5) / sides) * Math.PI * 2 - rot * 1.8
    ctx.save(); ctx.strokeStyle = ca(C, 0.12); ctx.lineWidth = 0.7
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R)
    ctx.lineTo(cx + Math.cos(a2) * iR, cy + Math.sin(a2) * iR)
    ctx.stroke(); ctx.restore()
  }

  if (isVirus && t % 65 < 18) {
    ctx.save(); ctx.strokeStyle = ca(C, 0.5); ctx.lineWidth = 0.8
    for (let i = 0; i < 3; i++) {
      let ca2 = Math.random() * Math.PI * 2, cr = iR
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ca2) * cr, cy + Math.sin(ca2) * cr)
      for (let j = 0; j < 4; j++) {
        cr += Math.random() * (R - iR) * 0.4; ca2 += (Math.random() - 0.5) * 0.9
        ctx.lineTo(cx + Math.cos(ca2) * cr, cy + Math.sin(ca2) * cr)
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  const pg = 0.5 + 0.5 * Math.sin(t * 0.06)
  ctx.save(); ctx.shadowColor = C; ctx.shadowBlur = 8 + pg * 8
  ctx.beginPath(); ctx.arc(cx, cy, iR * 0.5, 0, Math.PI * 2)
  ctx.fillStyle = ca(C, pg * 0.1); ctx.fill(); ctx.restore()

  ctx.restore()

  drawEyes(ctx, 'crystal', cx, cy, iR * 0.72, isVirus, C, t)
}

// ── MAP ────────────────────────────────────────────────────────────────────────
type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number, isVirus: boolean, C: string) => void

const DRAW_MAP: Record<PetType, DrawFn> = {
  hologram: drawHologram,
  ghost: drawGhost,
  jellyfish: drawJellyfish,
  signal: drawSignal,
  radar: drawRadar,
  neuron: drawNeuron,
  plasma: drawPlasma,
  crystal: drawCrystal,
}

// ── КОМПОНЕНТ ─────────────────────────────────────────────────────────────────
export default function PetCanvas({ type, variant, stage, size = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const tRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`

    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const def = getPetDef(type)
    const isVirus = variant === 'virus'
    const C = isVirus ? def.colorVirus : def.color
    const w = size, h = size

    function animate() {
      const t = tRef.current
      ctx.clearRect(0, 0, w, h)

      if (stage === 'egg') {
        drawEgg(ctx, w / 2, h / 2, isVirus, C, t, size)
      } else {
        if (stage === 'baby') {
          ctx.save()
          ctx.translate(w * 0.13, h * 0.13)
          ctx.scale(0.74, 0.74)
          DRAW_MAP[type](ctx, w, h, t, isVirus, C)
          ctx.restore()
        } else {
          DRAW_MAP[type](ctx, w, h, t, isVirus, C)
        }
      }

      tRef.current++
      animRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [type, variant, stage, size])

  return <canvas ref={canvasRef} style={{ display: 'block' }} />
}
