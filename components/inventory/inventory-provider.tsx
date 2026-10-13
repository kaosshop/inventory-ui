"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { fetchNui, useNuiEvent } from "@/lib/inv/nui"
import { mockPlayerInventory, mockSecondaryInventory, padSlots } from "@/lib/inv/mock"
import { isSlotWithItem, type Inventory, type Slot, type SlotWithItem } from "@/lib/inv/types"

export type Side = "left" | "right"

export interface MoveRequest {
  from: Side
  fromSlot: number
  to: Side
  toSlot: number
  count?: number
}

interface InventoryContextValue {
  left: Inventory
  right: Inventory | null
  open: boolean
  setOpen: (v: boolean) => void
  move: (req: MoveRequest) => void
  useSlot: (side: Side, slot: number) => void
  dropSlot: (side: Side, slot: number) => void
  giveSlot: (side: Side, slot: number) => void
  weightOf: (inv: Inventory) => number
  lastAction: string | null
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

export function useInventory() {
  const ctx = useContext(InventoryContext)
  if (!ctx) throw new Error("useInventory must be used inside <InventoryProvider>")
  return ctx
}

const totalWeight = (inv: Inventory) =>
  inv.items.reduce((sum, s) => (isSlotWithItem(s) ? sum + s.weight * s.count : sum), 0)

/** Immutably apply a move/swap/stack between two slot arrays. */
function applyMove(
  sourceItems: Slot[],
  targetItems: Slot[],
  fromSlot: number,
  toSlot: number,
  count: number,
  sameInventory: boolean,
): { source: Slot[]; target: Slot[] } | null {
  const source = sourceItems.map((s) => ({ ...s }))
  const target = sameInventory ? source : targetItems.map((s) => ({ ...s }))

  const from = source[fromSlot - 1]
  const to = target[toSlot - 1]
  if (!from || !to || !isSlotWithItem(from)) return null

  const amount = Math.max(1, Math.min(count, from.count))

  // Stack onto a matching item
  if (isSlotWithItem(to) && to.name === from.name && to.slot !== from.slot) {
    target[toSlot - 1] = { ...to, count: to.count + amount }
    const remaining = from.count - amount
    source[fromSlot - 1] = remaining > 0 ? { ...from, count: remaining } : { slot: from.slot }
    return { source, target }
  }

  // Partial move into an empty slot
  if (!isSlotWithItem(to) && amount < from.count) {
    target[toSlot - 1] = { ...from, slot: toSlot, count: amount }
    source[fromSlot - 1] = { ...from, count: from.count - amount }
    return { source, target }
  }

  // Full move / swap
  target[toSlot - 1] = { ...from, slot: toSlot }
  source[fromSlot - 1] = isSlotWithItem(to) ? { ...to, slot: fromSlot } : { slot: fromSlot }
  return { source, target }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [left, setLeft] = useState<Inventory>(mockPlayerInventory)
  const [right, setRight] = useState<Inventory | null>(mockSecondaryInventory)
  const [open, setOpen] = useState(true)
  const [lastAction, setLastAction] = useState<string | null>(null)

  useNuiEvent<{ leftInventory?: Inventory; rightInventory?: Inventory }>("setupInventory", (data) => {
    if (data.leftInventory) setLeft({ ...data.leftInventory, items: padSlots(data.leftInventory.items, data.leftInventory.slots) })
    setRight(data.rightInventory ? { ...data.rightInventory, items: padSlots(data.rightInventory.items, data.rightInventory.slots) } : null)
    setOpen(true)
  })

  /** Narrow helper so the two differently-typed setters share one call site. */
  const updateSide = useCallback((side: Side, updater: (inv: Inventory) => Inventory) => {
    if (side === "left") setLeft((prev) => updater(prev))
    else setRight((prev) => (prev ? updater(prev) : prev))
  }, [])

  useNuiEvent<boolean>("closeInventory", () => setOpen(false))
  useNuiEvent<{ open: boolean }>("setInventoryVisible", (data) => setOpen(Boolean(data?.open)))

  useNuiEvent<{ item: SlotWithItem; inventory: Side }[]>("refreshSlots", (updates) => {
    if (!Array.isArray(updates)) return
    for (const update of updates) {
      updateSide(update.inventory, (prev) => {
        const items = prev.items.map((s) => (s.slot === update.item.slot ? update.item : s))
        return { ...prev, items, weight: totalWeight({ ...prev, items }) }
      })
    }
  })

  const move = useCallback(
    ({ from, fromSlot, to, toSlot, count }: MoveRequest) => {
      if (from === to && fromSlot === toSlot) return

      const sourceInv = from === "left" ? left : right
      const targetInv = to === "left" ? left : right
      if (!sourceInv || !targetInv) return

      const sourceSlot = sourceInv.items[fromSlot - 1]
      if (!sourceSlot || !isSlotWithItem(sourceSlot)) return

      const amount = count ?? sourceSlot.count
      const result = applyMove(sourceInv.items, targetInv.items, fromSlot, toSlot, amount, from === to)
      if (!result) return

      updateSide(from, (prev) => ({ ...prev, items: result.source, weight: totalWeight({ ...prev, items: result.source }) }))
      if (from !== to) {
        updateSide(to, (prev) => ({ ...prev, items: result.target, weight: totalWeight({ ...prev, items: result.target }) }))
      }

      setLastAction(`Moved ${amount}x ${sourceSlot.label ?? sourceSlot.name}`)

      void fetchNui(
        "swapItems",
        {
          fromSlot,
          toSlot,
          fromType: sourceInv.type,
          toType: targetInv.type,
          count: amount,
        },
        null,
      )
    },
    [left, right],
  )

  const consume = useCallback((side: Side, slot: number, amount: number) => {
    updateSide(side, (prev) => {
      const items = prev.items.map((s) => {
        if (s.slot !== slot || !isSlotWithItem(s)) return s
        const next = s.count - amount
        return next > 0 ? { ...s, count: next } : { slot: s.slot }
      })
      return { ...prev, items, weight: totalWeight({ ...prev, items }) }
    })
  }, [])

  const useSlot = useCallback(
    (side: Side, slot: number) => {
      const inv = side === "left" ? left : right
      const target = inv?.items[slot - 1]
      if (!target || !isSlotWithItem(target)) return
      setLastAction(`Used ${target.label ?? target.name}`)
      void fetchNui("useItem", slot, null)
      if (target.name.startsWith("WEAPON_") || target.name === "phone" || target.name === "laptop") return
      consume(side, slot, 1)
    },
    [left, right, consume],
  )

  const dropSlot = useCallback(
    (side: Side, slot: number) => {
      const inv = side === "left" ? left : right
      const target = inv?.items[slot - 1]
      if (!target || !isSlotWithItem(target)) return
      setLastAction(`Dropped ${target.label ?? target.name}`)
      void fetchNui("swapItems", { fromSlot: slot, toSlot: slot, fromType: inv?.type, toType: "newdrop", count: target.count }, null)
      consume(side, slot, target.count)
    },
    [left, right, consume],
  )

  const giveSlot = useCallback(
    (side: Side, slot: number) => {
      const inv = side === "left" ? left : right
      const target = inv?.items[slot - 1]
      if (!target || !isSlotWithItem(target)) return
      setLastAction(`Offered ${target.label ?? target.name}`)
      void fetchNui("giveItem", { slot, count: target.count }, null)
    },
    [left, right],
  )

  const value = useMemo(
    () => ({ left, right, open, setOpen, move, useSlot, dropSlot, giveSlot, weightOf: totalWeight, lastAction }),
    [left, right, open, move, useSlot, dropSlot, giveSlot, lastAction],
  )

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}
