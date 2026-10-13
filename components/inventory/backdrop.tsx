"use client"

import { useEffect, useRef } from "react"
import { createEffect } from "@/lib/inv/effects"
import { useSettings } from "./settings-provider"

/** Canvas that renders the selected ambient effect. Pure 2D canvas so CEF stays cheap. */
export function EffectCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const { settings } = useSettings()
  const { type, color, intensity, speed, opacity } = settings.effects
  const animations = settings.behavior.animations

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || type === "none" || !animations) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const renderer = createEffect(type, { color, intensity, speed })
    if (!renderer) return

    let width = 0
    let height = 0
    let raf = 0
    let last = performance.now()
    const trail = type === "matrix"

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      renderer.resize(width, height)
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      if (trail) {
        ctx.globalCompositeOperation = "destination-out"
        ctx.fillStyle = "rgba(0,0,0,0.14)"
        ctx.fillRect(0, 0, width, height)
        ctx.globalCompositeOperation = "source-over"
      } else {
        ctx.clearRect(0, 0, width, height)
      }

      renderer.frame(ctx, dt, width, height)
      raf = requestAnimationFrame(loop)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [type, color, intensity, speed, animations])

  if (type === "none" || !animations) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ opacity, width: "100%", height: "100%", display: "block" }}
    />
  )
}

/** Full-screen background: image or solid colour, dim, saturation, vignette, then effects. */
export function Backdrop() {
  const { settings, backgroundUrl } = useSettings()
  const bg = settings.background

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {bg.mode === "solid" || !backgroundUrl ? (
        <div className="absolute inset-0" style={{ background: bg.solid, opacity: bg.opacity }} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center transition-[filter] duration-300"
          style={{
            backgroundImage: `url("${backgroundUrl}")`,
            filter: `blur(${bg.blur}px) saturate(${bg.saturation})`,
            transform: `scale(${bg.scale + bg.blur / 200})`,
            opacity: bg.opacity,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${bg.dim})` }} />

      {settings.effects.behindPanels && (
        <div className="absolute inset-0">
          <EffectCanvas />
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,${bg.vignette}) 100%)`,
        }}
      />
    </div>
  )
}

/** Effects drawn above the panels (optional — reads nicer for snow/embers). */
export function ForegroundEffects() {
  const { settings } = useSettings()
  if (settings.effects.behindPanels) return null
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-50">
      <EffectCanvas />
    </div>
  )
}
