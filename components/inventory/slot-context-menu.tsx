"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { Hand, Scissors, Trash2, Zap } from "lucide-react"
import { isSlotWithItem, type ContextTarget } from "@/lib/inv/types"
import { useSettings } from "./settings-provider"
import { useInventory } from "./inventory-provider"

export function SlotContextMenu({ target, onClose }: { target: ContextTarget; onClose: () => void }) {
  const { settings } = useSettings()
  const { useSlot, giveSlot, dropSlot, move, left, right } = useInventory()
  const source = target.inventory === "left" ? left : right
  const firstEmpty = source?.items.find((s) => !isSlotWithItem(s) && s.slot !== target.slot)?.slot

  useEffect(() => {
    const close = () => onClose()
    window.addEventListener("pointerdown", close)
    window.addEventListener("keydown", close)
    return () => {
      window.removeEventListener("pointerdown", close)
      window.removeEventListener("keydown", close)
    }
  }, [onClose])

  const splittable = target.item.count > 1

  const actions = [
    { id: "use", label: "Use item", icon: Zap, run: () => useSlot(target.inventory, target.slot) },
    { id: "give", label: "Give to nearby", icon: Hand, run: () => giveSlot(target.inventory, target.slot) },
    {
      id: "split",
      label: "Split stack",
      icon: Scissors,
      disabled: !splittable || !firstEmpty,
      run: () => {
        if (!firstEmpty) return
        move({
          from: target.inventory,
          fromSlot: target.slot,
          to: target.inventory,
          toSlot: firstEmpty,
          count: Math.floor(target.item.count / 2),
        })
      },
    },
    { id: "drop", label: "Drop on ground", icon: Trash2, danger: true, run: () => dropSlot(target.inventory, target.slot) },
  ]

  return (
    <motion.div
      initial={settings.behavior.animations ? { opacity: 0, scale: 0.94, y: -4 } : false}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.13, ease: [0.16, 1, 0.3, 1] }}
      role="menu"
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed z-[400] w-52 overflow-hidden border p-1.5 shadow-2xl"
      style={{
        top: Math.min(target.y, window.innerHeight - 190),
        left: Math.min(target.x, window.innerWidth - 220),
        borderRadius: "var(--ox-radius-inner)",
        background: "var(--ox-surface-strong)",
        backdropFilter: "blur(26px) saturate(1.8)",
        WebkitBackdropFilter: "blur(26px) saturate(1.8)",
        borderColor: "var(--ox-border-strong)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.65)",
      }}
    >
      <p className="truncate px-2.5 pb-1.5 pt-1 text-[11px] font-semibold" style={{ color: "var(--ox-muted)" }}>
        {target.item.label ?? target.item.name}
      </p>
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          onClick={() => {
            action.run()
            onClose()
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35"
          style={{ color: action.danger ? "#ff453a" : "var(--ox-text)" }}
          onPointerEnter={(e) => {
            e.currentTarget.style.background = action.danger ? "rgba(255,69,58,0.14)" : "var(--ox-slot-hover)"
          }}
          onPointerLeave={(e) => {
            e.currentTarget.style.background = "transparent"
          }}
        >
          <action.icon size={14} strokeWidth={1.7} />
          {action.label}
        </button>
      ))}
    </motion.div>
  )
}
