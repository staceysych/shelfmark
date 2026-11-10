import { coverSrc, type Book } from '@/lib/books'
import type { ReadingAge } from '@/lib/reading-age'

const WIDTH = 680
const HEIGHT = 850

function coverFetchUrl(book: Book) {
  const remote = coverSrc(book, 'L')
  if (!remote) return null
  if (remote.startsWith('/')) return remote
  if (remote.startsWith('https://')) {
    return `/api/cover?url=${encodeURIComponent(remote)}`
  }
  return null
}

async function loadCoverBitmap(book: Book): Promise<ImageBitmap | null> {
  const src = coverFetchUrl(book)
  if (!src) return null
  try {
    const res = await fetch(src)
    if (!res.ok) return null
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) return null
    return await createImageBitmap(blob)
  } catch {
    return null
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawBookIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save()
  ctx.strokeStyle = '#e8b04a'
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const s = size
  ctx.strokeRect(x + s * 0.15, y + s * 0.1, s * 0.7, s * 0.8)
  ctx.beginPath()
  ctx.moveTo(x + s * 0.35, y + s * 0.1)
  ctx.lineTo(x + s * 0.35, y + s * 0.9)
  ctx.stroke()
  ctx.restore()
}

function wrapFillText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ')
  let line = ''
  let cursorY = y
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY)
      line = word
      cursorY += lineHeight
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, x, cursorY)
}

export async function renderReadingAgePng(readingAge: ReadingAge): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')

  ctx.fillStyle = '#16181f'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const glow = ctx.createRadialGradient(WIDTH * 0.8, 0, 20, WIDTH * 0.8, 0, WIDTH * 0.7)
  glow.addColorStop(0, 'rgba(232, 176, 74, 0.18)')
  glow.addColorStop(1, 'rgba(232, 176, 74, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const cool = ctx.createRadialGradient(WIDTH * 0.1, HEIGHT * 0.9, 10, WIDTH * 0.1, HEIGHT * 0.9, WIDTH * 0.7)
  cool.addColorStop(0, 'rgba(40, 48, 72, 0.9)')
  cool.addColorStop(1, 'rgba(40, 48, 72, 0)')
  ctx.fillStyle = cool
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const pad = 48

  drawBookIcon(ctx, pad, pad, 22)
  ctx.fillStyle = '#f3eee3'
  ctx.font = '500 22px Fraunces, Georgia, serif'
  ctx.textBaseline = 'middle'
  ctx.fillText('Shelfmark', pad + 32, pad + 12)

  ctx.fillStyle = '#a8b0c0'
  ctx.font = '500 13px Inter, system-ui, sans-serif'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('YOUR SHELF READS LIKE YOU’RE', pad, 210)

  ctx.fillStyle = '#f3eee3'
  ctx.font = '500 148px Fraunces, Georgia, serif'
  const ageText = String(readingAge.age)
  ctx.fillText(ageText, pad, 360)

  const ageWidth = ctx.measureText(ageText).width
  ctx.fillStyle = '#a8b0c0'
  ctx.font = '400 22px Inter, system-ui, sans-serif'
  ctx.fillText('years old', pad + ageWidth + 16, 340)

  ctx.fillStyle = '#a8b0c0'
  ctx.font = '400 22px Inter, system-ui, sans-serif'
  const maxSubtitleWidth = WIDTH - pad * 2
  const words = readingAge.subtitle.split(' ')
  let line = ''
  let y = 410
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxSubtitleWidth && line) {
      ctx.fillText(line, pad, y)
      line = word
      y += 30
    } else {
      line = next
    }
  }
  if (line) ctx.fillText(line, pad, y)

  const covers = readingAge.covers.slice(0, 6)
  const coverH = 168
  const coverW = 112
  const gap = 10
  const totalW = covers.length * coverW + Math.max(0, covers.length - 1) * gap
  let coverX = (WIDTH - totalW) / 2
  const coverY = HEIGHT - 150 - coverH

  const bitmaps = await Promise.all(covers.map((book) => loadCoverBitmap(book)))

  covers.forEach((book, index) => {
    const img = bitmaps[index]
    ctx.save()
    roundRect(ctx, coverX, coverY, coverW, coverH, 6)
    ctx.clip()
    ctx.fillStyle = '#2a2f3c'
    ctx.fillRect(coverX, coverY, coverW, coverH)
    if (img) {
      const scale = Math.max(coverW / img.width, coverH / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      const dx = coverX + (coverW - dw) / 2
      const dy = coverY
      ctx.drawImage(img, dx, dy, dw, dh)
      img.close()
    } else {
      ctx.fillStyle = '#f3eee3'
      ctx.font = '500 12px Fraunces, Georgia, serif'
      wrapFillText(ctx, book.title.slice(0, 42), coverX + 8, coverY + coverH - 36, coverW - 16, 14)
    }
    ctx.restore()
    coverX += coverW + gap
  })

  const fade = ctx.createLinearGradient(0, HEIGHT - 160, 0, HEIGHT - 100)
  fade.addColorStop(0, 'rgba(22, 24, 31, 0)')
  fade.addColorStop(1, 'rgba(22, 24, 31, 1)')
  ctx.fillStyle = fade
  ctx.fillRect(0, HEIGHT - 160, WIDTH, 60)

  ctx.fillStyle = '#a8b0c0'
  ctx.font = '400 15px Inter, system-ui, sans-serif'
  const footer = `Based on ${readingAge.bookCount} finished ${readingAge.bookCount === 1 ? 'book' : 'books'}`
  ctx.fillText(footer, pad, HEIGHT - 48)

  const blob = await new Promise<Blob | null>((resolve, reject) => {
    try {
      canvas.toBlob((result) => resolve(result), 'image/png')
    } catch (error) {
      reject(error)
    }
  })
  if (!blob) throw new Error('PNG encode failed')
  return blob
}
