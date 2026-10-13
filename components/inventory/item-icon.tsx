"use client"

import {
  Banknote,
  Cigarette,
  Coins,
  Cog,
  Crosshair,
  Droplet,
  Gem,
  HeartPulse,
  Image as ImageIcon,
  KeyRound,
  Laptop,
  Layers,
  Package,
  Radio,
  Recycle,
  Shield,
  Smartphone,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { SlotWithItem } from "@/lib/inv/types"

const EXACT: Record<string, LucideIcon> = {
  bandage: HeartPulse,
  medkit: HeartPulse,
  water: Droplet,
  burger: Utensils,
  phone: Smartphone,
  radio: Radio,
  lockpick: KeyRound,
  advancedlockpick: KeyRound,
  money: Banknote,
  cash: Banknote,
  repairkit: Wrench,
  armour: Shield,
  armor: Shield,
  cigarette: Cigarette,
  laptop: Laptop,
  diamond: Gem,
  scrapmetal: Cog,
  plastic: Recycle,
  goldbar: Coins,
  painting: ImageIcon,
}

export function iconForItem(name: string): LucideIcon {
  const key = name.toLowerCase()
  if (key.startsWith("weapon_")) return Crosshair
  if (key.startsWith("ammo")) return Layers
  return EXACT[key] ?? Package
}

/**
 * ox_inventory ships PNGs at `web/images/<name>.png`. When an image exists we use it,
 * otherwise we fall back to a vector glyph so no slot ever renders empty.
 */
export function ItemIcon({ item, size }: { item: SlotWithItem; size: number }) {
  const src = item.image ?? (item.metadata?.imageurl as string | undefined)

  if (src) {
    return (
      <img
        src={src || "/placeholder.svg"}
        alt=""
        draggable={false}
        style={{ width: size, height: size, objectFit: "contain" }}
        className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
      />
    )
  }

  const Icon = iconForItem(item.name)
  return (
    <Icon
      size={size}
      strokeWidth={1.25}
      className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
      style={{ color: "var(--ox-text)", opacity: 0.92 }}
    />
  )
}
