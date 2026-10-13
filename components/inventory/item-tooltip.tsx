"use client"

import { motion } from "framer-motion"
import type { SlotWithItem } from "@/lib/inv/types"
import { useSettings } from "./settings-provider"

const HIDDEN_META = new Set(["description", "imageurl", "label"])

function formatWeight(grams: number) {
  return grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`
}

export function ItemTooltip({ item, rect }: { item: SlotWithItem; rect: DOMRect }) {
  const { settings } = useSettings()
  const flipX = rect.left > window.innerWidth / 2
  const durability = item.durability ?? (item.metadata?.durability as number | undefined)

  const extras = Object.entries(item.metadata ?? {}).filter(
    ([key, value]) => !HIDDEN_META.has(key) && value !== undefined && value !== null && typeof value !== "object",
  )

  return (
    <motion.div
      initial={settings.behavior.animations ? { opacity: 0, y: 6, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
      role="tooltip"
      className="pointer-events-none fixed z-[200] w-64 overflow-hidden border p-3.5 shadow-2xl"
      style={{
        top: Math.min(rect.bottom + 10, window.innerHeight - 240),
        left: flipX ? undefined : rect.left,
        right: flipX ? window.innerWidth - rect.right : undefined,
        borderRadius: "var(--ox-radius-inner)",
        background: "var(--ox-surface-strong)",
        backdropFilter: `blur(${settings.theme.blur}px) saturate(1.6)`,
        WebkitBackdropFilter: `blur(${settings.theme.blur}px) saturate(1.6)`,
        borderColor: "var(--ox-border-strong)",
        color: "var(--ox-text)",
        boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px var(--ox-border), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold leading-tight tracking-[-0.01em]">
          {item.metadata?.label ?? item.label ?? item.name}
        </p>
        <span className="shrink-0 text-[11px] font-medium tabular-nums" style={{ color: "var(--ox-muted)" }}>
          {formatWeight(item.weight * item.count)}
        </span>
      </div>

      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: "var(--ox-muted)" }}>
        {item.name}
      </p>

      {(item.metadata?.description ?? item.description) && (
        <p className="mt-2.5 text-[11.5px] leading-relaxed" style={{ color: "var(--ox-muted)" }}>
          {item.metadata?.description ?? item.description}
        </p>
      )}

      {durability !== undefined && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--ox-muted)" }}>
            <span>Condition</span>
            <span className="tabular-nums">{Math.round(durability)}%</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "var(--ox-slot)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max(0, Math.min(100, durability))}%`,
                background: durability > 50 ? "var(--ox-accent)" : durability > 20 ? "#ff9f0a" : "#ff453a",
              }}
            />
          </div>
        </div>
      )}

      {extras.length > 0 && (
        <dl className="mt-3 flex flex-col gap-1 border-t pt-2.5 text-[11px]" style={{ borderColor: "var(--ox-border)" }}>
          {extras.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <dt className="capitalize" style={{ color: "var(--ox-muted)" }}>
                {key}
              </dt>
              <dd className="truncate font-medium tabular-nums">{String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </motion.div>
  )
}
