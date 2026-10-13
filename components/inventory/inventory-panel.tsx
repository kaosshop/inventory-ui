"use client"

import { motion } from "framer-motion"
import { Boxes, Weight } from "lucide-react"
import type { ContextTarget, Inventory } from "@/lib/inv/types"
import { isSlotWithItem } from "@/lib/inv/types"
import { useSettings } from "./settings-provider"
import type { Side } from "./inventory-provider"
import { InventorySlot } from "./inventory-slot"

function kg(grams: number) {
  return `${(grams / 1000).toFixed(1)}`
}

export function GlassPanel({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const { settings } = useSettings()
  return (
    <motion.section
      initial={settings.behavior.animations ? { opacity: 0, y: 18, scale: 0.985 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex min-h-0 flex-col overflow-hidden border ${className ?? ""}`}
      style={{
        borderRadius: "var(--ox-radius)",
        background: "var(--ox-surface)",
        backdropFilter: `blur(var(--ox-blur)) saturate(1.7)`,
        WebkitBackdropFilter: `blur(var(--ox-blur)) saturate(1.7)`,
        borderColor: "var(--ox-border)",
        boxShadow: `0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 60px -20px var(--ox-glow)`,
      }}
    >
      {children}
    </motion.section>
  )
}

export function InventoryPanel({
  inventory,
  side,
  onContextMenu,
  delay,
}: {
  inventory: Inventory
  side: Side
  onContextMenu: (target: ContextTarget) => void
  delay?: number
}) {
  const { settings } = useSettings()
  const used = inventory.items.filter(isSlotWithItem).length
  const ratio = inventory.maxWeight > 0 ? Math.min(1, inventory.weight / inventory.maxWeight) : 0
  const barColor = ratio > 0.9 ? "#ff453a" : ratio > 0.72 ? "#ff9f0a" : "var(--ox-accent)"

  return (
    <GlassPanel className="w-full" delay={delay}>
      <header className="flex items-center justify-between gap-4 border-b px-5 py-3.5" style={{ borderColor: "var(--ox-border)" }}>
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold tracking-[-0.015em]" style={{ color: "var(--ox-text)" }}>
            {inventory.label}
          </h2>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--ox-muted)" }}>
            {inventory.type}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-[11px] font-medium tabular-nums" style={{ color: "var(--ox-muted)" }}>
          <span className="flex items-center gap-1.5">
            <Boxes size={13} strokeWidth={1.6} />
            {used}/{inventory.slots}
          </span>
          {settings.grid.showWeight && (
            <span className="flex items-center gap-1.5">
              <Weight size={13} strokeWidth={1.6} />
              {kg(inventory.weight)}/{kg(inventory.maxWeight)} kg
            </span>
          )}
        </div>
      </header>

      {settings.grid.showWeight && (
        <div className="px-5 pt-3">
          <div className="h-[3px] w-full overflow-hidden rounded-full" style={{ background: "var(--ox-slot)" }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${ratio * 100}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 28 }}
              style={{ background: barColor, boxShadow: `0 0 12px ${barColor}` }}
            />
          </div>
        </div>
      )}

      <div className="ox-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div
          className="grid justify-center"
          style={{
            gridTemplateColumns: `repeat(var(--ox-columns), var(--ox-slot-size))`,
            gap: "var(--ox-gap)",
          }}
        >
          {inventory.items.map((slot) => (
            <InventorySlot key={`${side}-${slot.slot}`} side={side} slot={slot} onContextMenu={onContextMenu} />
          ))}
        </div>
      </div>
    </GlassPanel>
  )
}
