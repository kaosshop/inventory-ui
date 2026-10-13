"use client"

import { motion } from "framer-motion"
import type { ContextTarget } from "@/lib/inv/types"
import { useSettings } from "./settings-provider"
import { useInventory } from "./inventory-provider"
import { InventorySlot } from "./inventory-slot"

export function Hotbar({ onContextMenu }: { onContextMenu: (target: ContextTarget) => void }) {
  const { settings } = useSettings()
  const { left } = useInventory()
  const slots = left.items.slice(0, 5)

  return (
    <motion.div
      initial={settings.behavior.animations ? { opacity: 0, y: 24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 border px-3 py-2.5"
      style={{
        borderRadius: "var(--ox-radius-inner)",
        background: "var(--ox-surface)",
        backdropFilter: "blur(var(--ox-blur)) saturate(1.7)",
        WebkitBackdropFilter: "blur(var(--ox-blur)) saturate(1.7)",
        borderColor: "var(--ox-border)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {slots.map((slot, index) => (
        <div key={`hotbar-${slot.slot}`} className="relative">
          <InventorySlot side="left" slot={slot} onContextMenu={onContextMenu} />
          <span
            className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md px-1.5 text-[9px] font-semibold tabular-nums"
            style={{ background: "var(--ox-accent)", color: "#fff" }}
          >
            {index + 1}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
