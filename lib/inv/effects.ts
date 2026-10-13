import { hexToRgb } from "./settings"
import type { EffectType } from "./settings"

export interface EffectOptions {
  color: string
  /** 0..1 — density / particle count multiplier */
  intensity: number
  /** 0..1 — motion speed multiplier */
  speed: number
}

export interface EffectRenderer {
  resize: (w: number, h: number) => void
  /** @param dt delta time in seconds */
  frame: (ctx: CanvasRenderingContext2D, dt: number, w: number, h: number) => void
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

/* ------------------------------------------------------------------ snow */
function createSnow({ color, intensity, speed }: EffectOptions): EffectRenderer {
  type Flake = { x: number; y: number; r: number; vy: number; drift: number; phase: number; a: number }
  let flakes: Flake[] = []
  const [r, g, b] = hexToRgb(color)

  const build = (w: number, h: number) => {
    const count = Math.round((40 + intensity * 320) * (w * h) / (1920 * 1080))
    flakes = Array.from({ length: Math.max(24, count) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.7, 2.8),
      vy: rand(14, 48),
      drift: rand(-14, 14),
      phase: rand(0, Math.PI * 2),
      a: rand(0.25, 1),
    }))
  }

  return {
    resize: build,
    frame: (ctx, dt, w, h) => {
      if (!flakes.length) build(w, h)
      const s = 0.4 + speed * 2.2
      for (const f of flakes) {
        f.phase += dt * 0.9
        f.y += f.vy * s * dt
        f.x += (f.drift + Math.sin(f.phase) * 16) * s * dt
        if (f.y - f.r > h) {
          f.y = -f.r
          f.x = rand(0, w)
        }
        if (f.x < -10) f.x = w + 10
        else if (f.x > w + 10) f.x = -10

        ctx.beginPath()
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${f.a})`
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

/* ---------------------------------------------------------------- matrix */
const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789".split("")

function createMatrix({ color, intensity, speed }: EffectOptions): EffectRenderer {
  const size = 16
  let drops: number[] = []
  let heads: number[] = []
  let cols = 0
  const [r, g, b] = hexToRgb(color)

  const build = (w: number) => {
    cols = Math.ceil(w / size)
    drops = Array.from({ length: cols }, () => rand(-60, 0))
    heads = Array.from({ length: cols }, () => (Math.random() < 0.25 + intensity * 0.7 ? 1 : 0))
  }

  return {
    resize: (w) => build(w),
    frame: (ctx, dt, w, h) => {
      if (!cols) build(w)
      ctx.font = `${size}px ui-monospace, "SF Mono", Menlo, monospace`
      ctx.textBaseline = "top"
      const s = (6 + speed * 34) * dt

      for (let i = 0; i < cols; i++) {
        if (!heads[i]) continue
        drops[i] += s
        const y = Math.floor(drops[i]) * size
        const x = i * size

        for (let t = 0; t < 14; t++) {
          const ty = y - t * size
          if (ty < -size || ty > h) continue
          const alpha = t === 0 ? 1 : Math.max(0, 1 - t / 14) * 0.65
          ctx.fillStyle = t === 0 ? `rgba(255,255,255,${alpha})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
          ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], x, ty)
        }

        if (y - 14 * size > h) {
          drops[i] = rand(-40, -4)
          heads[i] = Math.random() < 0.25 + intensity * 0.7 ? 1 : 0
        }
      }
    },
  }
}

/* -------------------------------------------------------------- electric */
function createElectric({ color, intensity, speed }: EffectOptions): EffectRenderer {
  type Bolt = { pts: { x: number; y: number }[]; life: number; max: number; width: number }
  let bolts: Bolt[] = []
  let spawn = 0
  const [r, g, b] = hexToRgb(color)

  const makeBolt = (w: number, h: number): Bolt => {
    const vertical = Math.random() < 0.5
    const start = vertical ? { x: rand(0, w), y: -20 } : { x: -20, y: rand(0, h) }
    const end = vertical ? { x: rand(0, w), y: h + 20 } : { x: w + 20, y: rand(0, h) }
    const segments = 14
    const pts = [start]
    for (let i = 1; i < segments; i++) {
      const t = i / segments
      pts.push({
        x: start.x + (end.x - start.x) * t + rand(-60, 60),
        y: start.y + (end.y - start.y) * t + rand(-60, 60),
      })
    }
    pts.push(end)
    const max = rand(0.25, 0.7)
    return { pts, life: max, max, width: rand(1, 2.6) }
  }

  return {
    resize: () => {
      bolts = []
    },
    frame: (ctx, dt, w, h) => {
      spawn -= dt
      if (spawn <= 0) {
        bolts.push(makeBolt(w, h))
        spawn = rand(0.12, 1.2) / (0.25 + intensity * 1.75) / (0.4 + speed)
      }

      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      bolts = bolts.filter((bolt) => {
        bolt.life -= dt * (0.6 + speed * 2)
        if (bolt.life <= 0) return false
        const a = bolt.life / bolt.max
        const flicker = 0.55 + Math.random() * 0.45

        ctx.shadowBlur = 18
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${a})`
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${a * flicker})`
        ctx.lineWidth = bolt.width * 2.4
        ctx.beginPath()
        ctx.moveTo(bolt.pts[0].x, bolt.pts[0].y)
        for (const p of bolt.pts.slice(1)) ctx.lineTo(p.x, p.y)
        ctx.stroke()

        ctx.shadowBlur = 0
        ctx.strokeStyle = `rgba(255,255,255,${a * flicker * 0.9})`
        ctx.lineWidth = bolt.width * 0.6
        ctx.stroke()
        return true
      })
      ctx.shadowBlur = 0
    },
  }
}

/* ---------------------------------------------------------------- embers */
function createEmbers({ color, intensity, speed }: EffectOptions): EffectRenderer {
  type Ember = { x: number; y: number; r: number; vy: number; vx: number; phase: number; a: number }
  let parts: Ember[] = []
  const [r, g, b] = hexToRgb(color)

  const build = (w: number, h: number) => {
    const count = Math.round((30 + intensity * 220) * (w * h) / (1920 * 1080))
    parts = Array.from({ length: Math.max(20, count) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.6, 2.4),
      vy: rand(-46, -14),
      vx: rand(-8, 8),
      phase: rand(0, Math.PI * 2),
      a: rand(0.2, 0.95),
    }))
  }

  return {
    resize: build,
    frame: (ctx, dt, w, h) => {
      if (!parts.length) build(w, h)
      const s = 0.4 + speed * 2.4
      for (const p of parts) {
        p.phase += dt * 1.6
        p.y += p.vy * s * dt
        p.x += (p.vx + Math.sin(p.phase) * 10) * s * dt
        if (p.y + p.r < 0) {
          p.y = h + p.r
          p.x = rand(0, w)
        }
        const flicker = 0.6 + Math.sin(p.phase * 2) * 0.4
        ctx.beginPath()
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.a * flicker})`
        ctx.shadowBlur = 10
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.a * 0.8})`
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    },
  }
}

/* ------------------------------------------------------------------ rain */
function createRain({ color, intensity, speed }: EffectOptions): EffectRenderer {
  type Drop = { x: number; y: number; len: number; vy: number; a: number }
  let drops: Drop[] = []
  const [r, g, b] = hexToRgb(color)

  const build = (w: number, h: number) => {
    const count = Math.round((80 + intensity * 500) * (w * h) / (1920 * 1080))
    drops = Array.from({ length: Math.max(40, count) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      len: rand(10, 34),
      vy: rand(500, 1000),
      a: rand(0.1, 0.5),
    }))
  }

  return {
    resize: build,
    frame: (ctx, dt, w, h) => {
      if (!drops.length) build(w, h)
      const s = 0.3 + speed * 1.6
      ctx.lineWidth = 1
      for (const d of drops) {
        d.y += d.vy * s * dt
        d.x += 60 * s * dt
        if (d.y - d.len > h) {
          d.y = -d.len
          d.x = rand(-100, w)
        }
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${d.a})`
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 6 * s, d.y - d.len)
        ctx.stroke()
      }
    },
  }
}

/* ----------------------------------------------------------------- stars */
function createStars({ color, intensity, speed }: EffectOptions): EffectRenderer {
  type Star = { x: number; y: number; r: number; phase: number; rate: number; a: number }
  let stars: Star[] = []
  const [r, g, b] = hexToRgb(color)

  const build = (w: number, h: number) => {
    const count = Math.round((60 + intensity * 400) * (w * h) / (1920 * 1080))
    stars = Array.from({ length: Math.max(40, count) }, () => ({
      x: rand(0, w),
      y: rand(0, h),
      r: rand(0.4, 1.6),
      phase: rand(0, Math.PI * 2),
      rate: rand(0.4, 2.4),
      a: rand(0.2, 0.9),
    }))
  }

  return {
    resize: build,
    frame: (ctx, dt, w, h) => {
      if (!stars.length) build(w, h)
      const s = 0.2 + speed * 1.4
      for (const st of stars) {
        st.phase += dt * st.rate * s
        st.x += 4 * s * dt
        if (st.x > w) st.x = 0
        const twinkle = 0.45 + Math.sin(st.phase) * 0.55
        ctx.beginPath()
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${st.a * twinkle})`
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

export const EFFECT_LABELS: Record<EffectType, string> = {
  none: "None",
  snow: "Snowfall",
  matrix: "Matrix Rain",
  electric: "Electric",
  embers: "Embers",
  rain: "Rainfall",
  stars: "Starfield",
}

export function createEffect(type: EffectType, options: EffectOptions): EffectRenderer | null {
  switch (type) {
    case "snow":
      return createSnow(options)
    case "matrix":
      return createMatrix(options)
    case "electric":
      return createElectric(options)
    case "embers":
      return createEmbers(options)
    case "rain":
      return createRain(options)
    case "stars":
      return createStars(options)
    default:
      return null
  }
}
