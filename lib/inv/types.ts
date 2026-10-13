// Mirrors the data shapes ox_inventory sends to the NUI layer.
// Keeping these identical to upstream means the redesigned UI is a drop-in replacement.

export type InventoryType =
  | "player"
  | "stash"
  | "glovebox"
  | "trunk"
  | "drop"
  | "container"
  | "shop"
  | "crafting"
  | "dumpster"
  | "newdrop"

export interface ItemMetadata {
  label?: string
  description?: string
  imageurl?: string
  durability?: number
  ammo?: number
  serial?: string
  registered?: string
  quality?: number
  weapontint?: string
  [key: string]: unknown
}

export interface SlotWithItem {
  slot: number
  name: string
  count: number
  weight: number
  label?: string
  stack?: boolean
  close?: boolean
  description?: string
  metadata?: ItemMetadata
  durability?: number
  price?: number
  currency?: string
  grade?: number
  /** resolved icon path, falls back to `/items/<name>.png` in ox_inventory */
  image?: string
}

export interface EmptySlot {
  slot: number
  name?: undefined
  count?: undefined
}

export type Slot = SlotWithItem | EmptySlot

export const isSlotWithItem = (slot: Slot): slot is SlotWithItem =>
  (slot as SlotWithItem).name !== undefined && (slot as SlotWithItem).count !== undefined

export interface Inventory {
  id: string
  type: InventoryType
  label: string
  slots: number
  weight: number
  maxWeight: number
  items: Slot[]
}

export interface DragSource {
  inventory: "left" | "right"
  slot: number
  item: SlotWithItem
}

export interface ContextTarget {
  inventory: "left" | "right"
  slot: number
  item: SlotWithItem
  x: number
  y: number
}
