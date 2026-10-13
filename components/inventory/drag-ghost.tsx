"use client"

import { useSettings } from "./settings-provider"
import { useDrag } from "./drag-provider"
import { ItemIcon } from "./item-icon"

export function DragGhost() {
  const { settings } = useSettings()
  const { active, pointer } = useDrag()
  if (!active) return null

  const size = settings.grid.slotSize

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[300] flex flex-col items-center justify-center border"
      style={{
        left: pointer.x,
        top: pointer.y,
        width: size,
        height: size,
        transform: "translate(-50%, -50%) rotate(-3deg) scale(1.06)",
        borderRadius: "var(--ox-slot-radius)",
        background: "var(--ox-surface-strong)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderColor: "var(--ox-accent-line)",
        boxShadow: `0 18px 50px rgba(0,0,0,0.6), 0 0 36px var(--ox-glow)`,
      }}
    >
      <ItemIcon item={active.item} size={Math.round(size * 0.42)} />
      {active.item.count > 1 && (
        <span
          className="absolute right-1.5 top-1 rounded-md px-1 py-px text-[10px] font-semibold tabular-nums"
          style={{ background: "rgba(0,0,0,0.5)", color: "var(--ox-text)" }}
        >
          {active.item.count}
        </span>
      )}
      <span className="w-full truncate px-1.5 pb-1.5 text-center text-[9.5px] font-medium" style={{ color: "var(--ox-muted)" }}>
        {active.item.label ?? active.item.name}
      </span>
    </div>
  )
}
