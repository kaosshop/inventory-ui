"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  BACKGROUND_PRESETS,
  FONT_STACKS,
  SETTINGS_KEY,
  THEME_PRESETS,
  defaultSettings,
  mergeSettings,
  rgba,
  type InventorySettings,
  type ThemePreset,
} from "@/lib/inv/settings"
import { fetchNui, useNuiEvent } from "@/lib/inv/nui"

type Section = keyof Omit<InventorySettings, "version">

interface SettingsContextValue {
  settings: InventorySettings
  set: <S extends Section, K extends keyof InventorySettings[S]>(section: S, key: K, value: InventorySettings[S][K]) => void
  patch: <S extends Section>(section: S, value: Partial<InventorySettings[S]>) => void
  replaceAll: (next: InventorySettings) => void
  reset: () => void
  applyPreset: (preset: ThemePreset) => void
  backgroundUrl: string
  cssVars: CSSProperties
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>")
  return ctx
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InventorySettings>(defaultSettings)
  const hydrated = useRef(false)

  // Load persisted settings once on mount (CEF localStorage survives between sessions).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY)
      if (raw) setSettings(mergeSettings(JSON.parse(raw)))
    } catch {
      // corrupted save — fall back to defaults
    }
    hydrated.current = true
  }, [])

  // Persist locally and mirror to Lua so the server/KVP copy stays in sync.
  useEffect(() => {
    if (!hydrated.current) return
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
      } catch {
        // storage full or blocked, in-memory settings still apply
      }
      void fetchNui("saveUiSettings", settings, null)
    }, 250)
    return () => window.clearTimeout(id)
  }, [settings])

  // Lua can push a settings payload (e.g. a server-enforced theme) at any time.
  useNuiEvent<Partial<InventorySettings>>("setUiSettings", (data) => setSettings(mergeSettings(data)))

  const set = useCallback<SettingsContextValue["set"]>((section, key, value) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }, [])

  const patch = useCallback<SettingsContextValue["patch"]>((section, value) => {
    setSettings((prev) => ({ ...prev, [section]: { ...prev[section], ...value } }))
  }, [])

  const replaceAll = useCallback((next: InventorySettings) => setSettings(mergeSettings(next)), [])
  const reset = useCallback(() => setSettings(structuredClone(defaultSettings)), [])

  const applyPreset = useCallback((preset: ThemePreset) => {
    setSettings((prev) => {
      const { effectColor, background, ...theme } = preset.patch
      return {
        ...prev,
        theme: { ...prev.theme, ...theme },
        effects: { ...prev.effects, color: effectColor ?? prev.effects.color },
        background: background ? { ...prev.background, mode: "preset" as const, preset: background } : prev.background,
      }
    })
  }, [])

  const backgroundUrl = useMemo(() => {
    const bg = settings.background
    if (bg.mode === "custom") return bg.customUrl.trim()
    if (bg.mode === "solid") return ""
    return BACKGROUND_PRESETS[bg.preset].url
  }, [settings.background])

  const cssVars = useMemo<CSSProperties>(() => {
    const t = settings.theme
    return {
      "--ox-accent": t.accent,
      "--ox-accent-alt": t.accentAlt,
      "--ox-accent-soft": rgba(t.accent, 0.16),
      "--ox-accent-line": rgba(t.accent, 0.45),
      "--ox-glow": rgba(t.accent, 0.55 * t.glow),
      "--ox-surface": rgba(t.surface, t.surfaceOpacity),
      "--ox-surface-strong": rgba(t.surface, Math.min(1, t.surfaceOpacity + 0.22)),
      "--ox-surface-raised": rgba(t.surface, Math.min(1, t.surfaceOpacity + 0.1)),
      "--ox-slot": rgba(t.textPrimary, 0.045),
      "--ox-slot-hover": rgba(t.textPrimary, 0.09),
      "--ox-border": rgba(t.textPrimary, t.borderOpacity),
      "--ox-border-strong": rgba(t.textPrimary, Math.min(1, t.borderOpacity + 0.12)),
      "--ox-text": t.textPrimary,
      "--ox-muted": t.textMuted,
      "--ox-blur": `${t.blur}px`,
      "--ox-radius": `${t.radius}px`,
      "--ox-radius-inner": `${Math.max(8, t.radius - 10)}px`,
      "--ox-slot-radius": `${t.slotRadius}px`,
      "--ox-slot-size": `${settings.grid.slotSize}px`,
      "--ox-gap": `${settings.grid.gap}px`,
      "--ox-columns": String(settings.grid.columns),
      "--ox-font": FONT_STACKS[t.font],
      fontFamily: FONT_STACKS[t.font],
    } as CSSProperties
  }, [settings.theme, settings.grid.slotSize, settings.grid.gap, settings.grid.columns])

  const value = useMemo(
    () => ({ settings, set, patch, replaceAll, reset, applyPreset, backgroundUrl, cssVars }),
    [settings, set, patch, replaceAll, reset, applyPreset, backgroundUrl, cssVars],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export { THEME_PRESETS }
