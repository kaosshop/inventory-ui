export type EffectType = "none" | "snow" | "matrix" | "electric" | "embers" | "rain" | "stars"
export type BackgroundMode = "preset" | "custom" | "solid"
export type BackgroundPreset = "obsidian" | "nebula" | "carbon"
export type FontChoice = "system" | "grotesk" | "mono" | "rounded"

export interface InventorySettings {
  version: number
  theme: {
    accent: string
    accentAlt: string
    surface: string
    surfaceOpacity: number
    blur: number
    radius: number
    slotRadius: number
    borderOpacity: number
    glow: number
    textPrimary: string
    textMuted: string
    font: FontChoice
    scale: number
  }
  grid: {
    columns: number
    slotSize: number
    gap: number
    showSlotNumbers: boolean
    showWeight: boolean
    showCount: boolean
    showDurability: boolean
    highlightHotbar: boolean
  }
  background: {
    mode: BackgroundMode
    preset: BackgroundPreset
    customUrl: string
    solid: string
    opacity: number
    blur: number
    dim: number
    saturation: number
    scale: number
    vignette: number
  }
  effects: {
    type: EffectType
    intensity: number
    speed: number
    color: string
    opacity: number
    behindPanels: boolean
  }
  brand: {
    show: boolean
    logoUrl: string
    size: number
    title: string
    subtitle: string
    showText: boolean
    align: "left" | "center"
  }
  behavior: {
    animations: boolean
    tooltips: boolean
    tooltipDelay: number
    sounds: boolean
    closeOnEsc: boolean
  }
}

export const SETTINGS_VERSION = 1
export const SETTINGS_KEY = "ox_inventory_ui_settings"

export const BACKGROUND_PRESETS: Record<BackgroundPreset, { label: string; url: string; swatch: string }> = {
  obsidian: { label: "Obsidian", url: "/backgrounds/obsidian.png", swatch: "#101216" },
  nebula: { label: "Nebula", url: "/backgrounds/nebula.png", swatch: "#1a1230" },
  carbon: { label: "Carbon", url: "/backgrounds/carbon.png", swatch: "#141210" },
}

export const defaultSettings: InventorySettings = {
  version: SETTINGS_VERSION,
  theme: {
    accent: "#0a84ff",
    accentAlt: "#5e5ce6",
    surface: "#0b0b0d",
    surfaceOpacity: 0.62,
    blur: 28,
    radius: 26,
    slotRadius: 16,
    borderOpacity: 0.1,
    glow: 0.35,
    textPrimary: "#f5f5f7",
    textMuted: "#8e8e93",
    font: "system",
    scale: 1,
  },
  grid: {
    columns: 5,
    slotSize: 86,
    gap: 8,
    showSlotNumbers: true,
    showWeight: true,
    showCount: true,
    showDurability: true,
    highlightHotbar: true,
  },
  background: {
    mode: "preset",
    preset: "obsidian",
    customUrl: "",
    solid: "#050506",
    opacity: 1,
    blur: 0,
    dim: 0.45,
    saturation: 1,
    scale: 1,
    vignette: 0.55,
  },
  effects: {
    type: "snow",
    intensity: 0.5,
    speed: 0.5,
    color: "#ffffff",
    opacity: 0.5,
    behindPanels: true,
  },
  brand: {
    show: true,
    logoUrl: "/brand/logo.png",
    size: 36,
    title: "INVENTORY",
    subtitle: "ox_inventory v2.48.0",
    showText: true,
    align: "left",
  },
  behavior: {
    animations: true,
    tooltips: true,
    tooltipDelay: 180,
    sounds: true,
    closeOnEsc: true,
  },
}

export interface ThemePreset {
  id: string
  label: string
  patch: Partial<InventorySettings["theme"]> & { effectColor?: string; background?: BackgroundPreset }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "midnight",
    label: "Midnight",
    patch: { accent: "#0a84ff", accentAlt: "#5e5ce6", surface: "#0b0b0d", effectColor: "#ffffff", background: "obsidian" },
  },
  {
    id: "violet",
    label: "Violet",
    patch: { accent: "#bf5af2", accentAlt: "#5e5ce6", surface: "#0d0a14", effectColor: "#c79bff", background: "nebula" },
  },
  {
    id: "matrix",
    label: "Terminal",
    patch: { accent: "#30d158", accentAlt: "#1f8f3e", surface: "#07090a", effectColor: "#30d158", background: "carbon" },
  },
  {
    id: "ember",
    label: "Ember",
    patch: { accent: "#ff9f0a", accentAlt: "#ff453a", surface: "#100c08", effectColor: "#ff9f0a", background: "carbon" },
  },
  {
    id: "ice",
    label: "Ice",
    patch: { accent: "#64d2ff", accentAlt: "#0a84ff", surface: "#080c10", effectColor: "#d6f3ff", background: "obsidian" },
  },
]

export const FONT_STACKS: Record<FontChoice, string> = {
  system:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
  grotesk: 'var(--font-grotesk), "Inter", system-ui, sans-serif',
  mono: 'var(--font-mono), ui-monospace, "SF Mono", Menlo, monospace',
  rounded: '"SF Pro Rounded", var(--font-grotesk), ui-rounded, system-ui, sans-serif',
}

/** Deep-merge persisted settings over defaults so new keys never break an old save. */
export function mergeSettings(saved: unknown): InventorySettings {
  const base: InventorySettings = structuredClone(defaultSettings)
  if (!saved || typeof saved !== "object") return base

  const input = saved as Record<string, Record<string, unknown>>
  for (const key of Object.keys(base) as (keyof InventorySettings)[]) {
    if (key === "version") continue
    const section = input[key]
    if (section && typeof section === "object") {
      Object.assign(base[key] as object, section)
    }
  }
  return base
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "").trim()
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6)
  const int = Number.parseInt(full, 16)
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
