import type { Inventory, Slot } from "./types"

/** Pads an item list out to `slots` empty slots, exactly like ox_inventory does server-side. */
export function padSlots(items: Slot[], slots: number): Slot[] {
  const out: Slot[] = Array.from({ length: slots }, (_, i) => ({ slot: i + 1 }))
  for (const item of items) {
    if (item.slot >= 1 && item.slot <= slots) out[item.slot - 1] = item
  }
  return out
}

export const mockPlayerInventory: Inventory = {
  id: "player",
  type: "player",
  label: "Pockets",
  slots: 40,
  weight: 14320,
  maxWeight: 30000,
  items: padSlots(
    [
      { slot: 1, name: "WEAPON_PISTOL", label: "Pistol", count: 1, weight: 970, durability: 72, metadata: { serial: "AX-99-2241", ammo: 12, description: "Standard issue sidearm." } },
      { slot: 2, name: "ammo-9", label: "9mm Rounds", count: 120, weight: 4 },
      { slot: 3, name: "bandage", label: "Bandage", count: 6, weight: 50, metadata: { description: "Stops light bleeding." } },
      { slot: 4, name: "water", label: "Water Bottle", count: 3, weight: 500 },
      { slot: 5, name: "burger", label: "Burger", count: 2, weight: 220 },
      { slot: 6, name: "phone", label: "Phone", count: 1, weight: 190, durability: 94 },
      { slot: 7, name: "radio", label: "Radio", count: 1, weight: 300, durability: 61 },
      { slot: 8, name: "lockpick", label: "Lockpick", count: 4, weight: 160, durability: 35 },
      { slot: 10, name: "money", label: "Cash", count: 8420, weight: 0 },
      { slot: 11, name: "repairkit", label: "Repair Kit", count: 1, weight: 1200, durability: 100 },
      { slot: 13, name: "armour", label: "Body Armour", count: 1, weight: 3000, durability: 88 },
      { slot: 15, name: "cigarette", label: "Cigarette", count: 11, weight: 8 },
      { slot: 18, name: "laptop", label: "Laptop", count: 1, weight: 2400, durability: 47 },
      { slot: 21, name: "diamond", label: "Rough Diamond", count: 3, weight: 120, metadata: { quality: 91 } },
    ],
    40,
  ),
}

export const mockSecondaryInventory: Inventory = {
  id: "stash-4412",
  type: "stash",
  label: "Garage Stash",
  slots: 30,
  weight: 9650,
  maxWeight: 50000,
  items: padSlots(
    [
      { slot: 1, name: "WEAPON_SMG", label: "SMG", count: 1, weight: 2400, durability: 54, metadata: { serial: "QZ-10-8873" } },
      { slot: 2, name: "ammo-rifle", label: "Rifle Rounds", count: 240, weight: 6 },
      { slot: 4, name: "medkit", label: "Medkit", count: 2, weight: 800 },
      { slot: 5, name: "scrapmetal", label: "Scrap Metal", count: 48, weight: 90 },
      { slot: 6, name: "plastic", label: "Plastic", count: 120, weight: 20 },
      { slot: 9, name: "goldbar", label: "Gold Bar", count: 2, weight: 1500 },
      { slot: 12, name: "painting", label: "Stolen Painting", count: 1, weight: 2200 },
      { slot: 14, name: "advancedlockpick", label: "Advanced Lockpick", count: 1, weight: 220, durability: 78 },
    ],
    30,
  ),
}
