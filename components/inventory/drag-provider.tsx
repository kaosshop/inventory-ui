"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import type { SlotWithItem } from "@/lib/inv/types"
import { useInventory, type Side } from "./inventory-provider"

interface ActiveDrag {
  side: Side
  slot: number
  item: SlotWithItem
}

interface DropTarget {
  side: Side
  slot: number
}

interface DragContextValue {
  active: ActiveDrag | null
  over: DropTarget | null
  pointer: { x: number; y: number }
  beginDrag: (side: Side, slot: number, item: SlotWithItem, x: number, y: number) => void
}

const DragContext = createContext<DragContextValue | null>(null)

export function useDrag() {
  const ctx = useContext(DragContext)
  if (!ctx) throw new Error("useDrag must be used inside <DragProvider>")
  return ctx
}

const DRAG_THRESHOLD = 5

export function DragProvider({ children }: { children: ReactNode }) {
  const { move, dropSlot } = useInventory()
  const [active, setActive] = useState<ActiveDrag | null>(null)
  const [over, setOver] = useState<DropTarget | null>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  const pending = useRef<(ActiveDrag & { x: number; y: number }) | null>(null)
  const activeRef = useRef<ActiveDrag | null>(null)
  const overRef = useRef<DropTarget | null>(null)
  activeRef.current = active
  overRef.current = over

  const beginDrag = useCallback((side: Side, slot: number, item: SlotWithItem, x: number, y: number) => {
    pending.current = { side, slot, item, x, y }
    setPointer({ x, y })
  }, [])

  useEffect(() => {
    const resolveTarget = (x: number, y: number): DropTarget | null => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      const slotEl = el?.closest<HTMLElement>("[data-ox-slot]")
      if (!slotEl) return null
      const side = slotEl.dataset.oxSide as Side | undefined
      const slot = Number(slotEl.dataset.oxSlot)
      if (!side || !slot) return null
      return { side, slot }
    }

    const onMove = (e: PointerEvent) => {
      const p = pending.current
      if (!activeRef.current && p) {
        if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < DRAG_THRESHOLD) return
        setActive({ side: p.side, slot: p.slot, item: p.item })
      }
      if (!activeRef.current && !p) return

      setPointer({ x: e.clientX, y: e.clientY })
      setOver(resolveTarget(e.clientX, e.clientY))
    }

    const onUp = (e: PointerEvent) => {
      const current = activeRef.current
      pending.current = null

      if (current) {
        const target = resolveTarget(e.clientX, e.clientY)
        if (target) {
          const full = current.item.count
          const count = e.shiftKey ? Math.max(1, Math.ceil(full / 2)) : e.ctrlKey || e.altKey ? 1 : full
          move({ from: current.side, fromSlot: current.slot, to: target.side, toSlot: target.slot, count })
        } else if (document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-ox-dropzone]")) {
          // released on the ground zone — ox_inventory turns this into a `newdrop`
          dropSlot(current.side, current.slot)
        }
      }

      setActive(null)
      setOver(null)
    }

    const onCancel = () => {
      pending.current = null
      setActive(null)
      setOver(null)
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
    }
  }, [move, dropSlot])

  const value = useMemo(() => ({ active, over, pointer, beginDrag }), [active, over, pointer, beginDrag])

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>
}
