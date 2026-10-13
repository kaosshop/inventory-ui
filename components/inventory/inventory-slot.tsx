"use client"

import { useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { isSlotWithItem, type Slot } from "@/lib/inv/types"
import type { ContextTarget } from "@/lib/inv/types"
import { useSettings } from "./settings-provider"
import { useInventory, type Side } from "./inventory-provider"
import { useDrag } from "./drag-provider"
import { ItemIcon } from "./item-icon"
import { ItemTooltip } from "./item-tooltip"

interface Props {
  side: Side
  slot: Slot
  onContextMenu: (target: ContextTarget) => void
}

export function InventorySlot({ side, slot, onContextMenu }: Props) {
  const { settings } = useSettings()
  const { useSlot } = useInventory()
  const { active, over, beginDrag } = useDrag()
  const ref = useRef<HTMLButtonElement | null>(null)
  const timer = useRef<number | null>(null)
  const [tipRect, setTipRect] = useState<DOMRect | null>(null)

  const hasItem = isSlotWithItem(slot)
  const isSource = active?.side === side && active.slot === slot.slot
  const isOver = over?.side === side && over.slot === slot.slot && !isSource
  const isHotbar = settings.grid.highlightHotbar && side === "left" && slot.slot <= 5
  const durability = hasItem ? slot.durability ?? (slot.metadata?.durability as number | undefined) : undefined

  const clearTip = () => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = null
    setTipRect(null)
  }

  const scheduleTip = () => {
    if (!settings.behavior.tooltips || !hasItem) return
    timer.current = window.setTimeout(() => {
      const rect = ref.current?.getBoundingClientRect()
      if (rect) setTipRect(rect)
    }, settings.behavior.tooltipDelay)
  }

  const iconSize = Math.round(settings.grid.slotSize * 0.42)

  return (
    <>
      <motion.button
        ref={ref}
        type="button"
        data-ox-slot={slot.slot}
        data-ox-side={side}
        aria-label={hasItem ? `${slot.label ?? slot.name}, ${slot.count} in slot ${slot.slot}` : `Empty slot ${slot.slot}`}
        whileHover={settings.behavior.animations && hasItem ? { y: -2 } : undefined}
        transition={{ type: "spring", stiffness: 520, damping: 32 }}
        onPointerDown={(e) => {
          if (e.button !== 0 || !hasItem) return
          clearTip()
          beginDrag(side, slot.slot, slot, e.clientX, e.clientY)
        }}
        onDoubleClick={() => hasItem && useSlot(side, slot.slot)}
        onContextMenu={(e) => {
          e.preventDefault()
          if (!hasItem) return
          clearTip()
          onContextMenu({ inventory: side, slot: slot.slot, item: slot, x: e.clientX, y: e.clientY })
        }}
        onPointerEnter={scheduleTip}
        onPointerLeave={clearTip}
        className="group relative flex select-none flex-col items-center justify-center overflow-hidden border outline-none transition-colors duration-150 focus-visible:ring-2"
        style={{
          width: "var(--ox-slot-size)",
          height: "var(--ox-slot-size)",
          borderRadius: "var(--ox-slot-radius)",
          background: isOver ? "var(--ox-accent-soft)" : hasItem ? "var(--ox-slot-hover)" : "var(--ox-slot)",
          borderColor: isOver ? "var(--ox-accent-line)" : isHotbar ? "var(--ox-accent-line)" : "var(--ox-border)",
          borderWidth: isOver ? 1.5 : 1,
          opacity: isSource ? 0.35 : 1,
          boxShadow: isOver
            ? `0 0 0 3px var(--ox-accent-soft), 0 8px 24px var(--ox-glow)`
            : hasItem
              ? "inset 0 1px 0 rgba(255,255,255,0.05)"
              : "none",
          cursor: hasItem ? "grab" : "default",
        }}
      >
        {settings.grid.showSlotNumbers && (
          <span
            className="absolute left-1.5 top-1 font-mono text-[9px] tabular-nums"
            style={{ color: "var(--ox-muted)", opacity: 0.55 }}
          >
            {slot.slot}
          </span>
        )}

        {hasItem && (
          <>
            <div className="flex flex-1 items-center justify-center pt-1.5">
              <ItemIcon item={slot} size={iconSize} />
            </div>

            {settings.grid.showCount && slot.count > 1 && (
              <span
                className="absolute right-1.5 top-1 rounded-md px-1 py-px text-[10px] font-semibold tabular-nums"
                style={{ background: "rgba(0,0,0,0.45)", color: "var(--ox-text)" }}
              >
                {slot.count > 9999 ? `${(slot.count / 1000).toFixed(1)}k` : slot.count}
              </span>
            )}

            <span
              className="w-full truncate px-1.5 pb-1.5 text-center text-[9.5px] font-medium leading-tight tracking-tight"
              style={{ color: "var(--ox-muted)" }}
            >
              {slot.metadata?.label ?? slot.label ?? slot.name}
            </span>

            {settings.grid.showDurability && durability !== undefined && (
              <span className="absolute inset-x-0 bottom-0 h-[2.5px]" style={{ background: "rgba(0,0,0,0.35)" }}>
                <span
                  className="block h-full"
                  style={{
                    width: `${Math.max(0, Math.min(100, durability))}%`,
                    background: durability > 50 ? "var(--ox-accent)" : durability > 20 ? "#ff9f0a" : "#ff453a",
                  }}
                />
              </span>
            )}
          </>
        )}
      </motion.button>

      <AnimatePresence>{tipRect && hasItem && <ItemTooltip item={slot} rect={tipRect} />}</AnimatePresence>
    </>
  )
}
