"use client"

import { useRef, useState } from "react"
import { motion } from "framer-motion"
import { Brush, Download, Grid3x3, ImageIcon, MonitorCog, RotateCcw, Sparkles, Tag, Upload } from "lucide-react"
import { BACKGROUND_PRESETS, THEME_PRESETS, type BackgroundPreset, type EffectType, type FontChoice } from "@/lib/inv/settings"
import { EFFECT_LABELS } from "@/lib/inv/effects"
import { useSettings } from "./settings-provider"
import { ColorField, Row, Segmented, SettingsSection, Slider, TextField, Toggle } from "./controls"

const TABS = [
  { id: "theme", label: "Appearance", icon: Brush },
  { id: "layout", label: "Grid & Layout", icon: Grid3x3 },
  { id: "background", label: "Background", icon: ImageIcon },
  { id: "effects", label: "Effects", icon: Sparkles },
  { id: "brand", label: "Branding", icon: Tag },
  { id: "system", label: "Behaviour", icon: MonitorCog },
] as const

type TabId = (typeof TABS)[number]["id"]

export function SettingsTab() {
  const { settings, set, applyPreset, reset, replaceAll } = useSettings()
  const [tab, setTab] = useState<TabId>("theme")
  const fileRef = useRef<HTMLInputElement | null>(null)

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ox-inventory-theme.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = async (file: File) => {
    try {
      replaceAll(JSON.parse(await file.text()))
    } catch {
      // ignore malformed theme files
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 gap-5">
      <nav
        className="flex w-52 shrink-0 flex-col gap-1 border p-2.5"
        style={{ borderRadius: "var(--ox-radius-inner)", background: "var(--ox-slot)", borderColor: "var(--ox-border)" }}
      >
        {TABS.map((item) => {
          const selected = item.id === tab
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors"
              style={{ color: selected ? "var(--ox-text)" : "var(--ox-muted)" }}
            >
              {selected && (
                <motion.span
                  layoutId="settings-tab-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "var(--ox-accent-soft)", boxShadow: "inset 0 0 0 1px var(--ox-accent-line)" }}
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}
              <item.icon size={15} strokeWidth={1.7} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </button>
          )
        })}

        <div className="mt-auto flex flex-col gap-1 border-t pt-2" style={{ borderColor: "var(--ox-border)" }}>
          <button type="button" onClick={exportSettings} className="ox-ghost-btn">
            <Download size={14} strokeWidth={1.7} /> Export theme
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="ox-ghost-btn">
            <Upload size={14} strokeWidth={1.7} /> Import theme
          </button>
          <button type="button" onClick={reset} className="ox-ghost-btn" style={{ color: "#ff453a" }}>
            <RotateCcw size={14} strokeWidth={1.7} /> Reset to default
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importSettings(file)
              e.target.value = ""
            }}
          />
        </div>
      </nav>

      <div className="ox-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        {tab === "theme" && (
          <>
            <SettingsSection title="Presets" description="One-click colour schemes. Everything stays editable afterwards.">
              <div className="flex flex-wrap gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-transform hover:-translate-y-0.5"
                    style={{ borderColor: "var(--ox-border)", background: "var(--ox-slot-hover)", color: "var(--ox-text)" }}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${preset.patch.accent}, ${preset.patch.accentAlt})` }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>
            </SettingsSection>

            <SettingsSection title="Colours">
              <Row label="Accent" hint="Highlights, bars, focus rings.">
                <ColorField label="Accent" value={settings.theme.accent} onChange={(v) => set("theme", "accent", v)} />
              </Row>
              <Row label="Secondary accent" hint="Used in gradients and preset chips.">
                <ColorField label="Secondary accent" value={settings.theme.accentAlt} onChange={(v) => set("theme", "accentAlt", v)} />
              </Row>
              <Row label="Panel tint">
                <ColorField label="Panel tint" value={settings.theme.surface} onChange={(v) => set("theme", "surface", v)} />
              </Row>
              <Row label="Text">
                <ColorField label="Text" value={settings.theme.textPrimary} onChange={(v) => set("theme", "textPrimary", v)} />
              </Row>
              <Row label="Muted text">
                <ColorField label="Muted text" value={settings.theme.textMuted} onChange={(v) => set("theme", "textMuted", v)} />
              </Row>
            </SettingsSection>

            <SettingsSection title="Glass & shape" description="Dial in the frosted-glass look and corner rounding.">
              <Row label="Panel opacity">
                <Slider label="Panel opacity" min={0} max={1} step={0.01} precision={2} value={settings.theme.surfaceOpacity} onChange={(v) => set("theme", "surfaceOpacity", v)} />
              </Row>
              <Row label="Background blur">
                <Slider label="Background blur" min={0} max={60} suffix="px" value={settings.theme.blur} onChange={(v) => set("theme", "blur", v)} />
              </Row>
              <Row label="Panel radius">
                <Slider label="Panel radius" min={0} max={48} suffix="px" value={settings.theme.radius} onChange={(v) => set("theme", "radius", v)} />
              </Row>
              <Row label="Slot radius">
                <Slider label="Slot radius" min={0} max={40} suffix="px" value={settings.theme.slotRadius} onChange={(v) => set("theme", "slotRadius", v)} />
              </Row>
              <Row label="Border strength">
                <Slider label="Border strength" min={0} max={0.5} step={0.01} precision={2} value={settings.theme.borderOpacity} onChange={(v) => set("theme", "borderOpacity", v)} />
              </Row>
              <Row label="Accent glow">
                <Slider label="Accent glow" min={0} max={1} step={0.01} precision={2} value={settings.theme.glow} onChange={(v) => set("theme", "glow", v)} />
              </Row>
            </SettingsSection>

            <SettingsSection title="Typography & scale">
              <Row label="Font">
                <Segmented<FontChoice>
                  label="Font"
                  value={settings.theme.font}
                  onChange={(v) => set("theme", "font", v)}
                  options={[
                    { value: "system", label: "System" },
                    { value: "grotesk", label: "Grotesk" },
                    { value: "rounded", label: "Rounded" },
                    { value: "mono", label: "Mono" },
                  ]}
                />
              </Row>
              <Row label="Interface scale" hint="Handy for 1440p and 4K monitors.">
                <Slider label="Interface scale" min={0.75} max={1.35} step={0.01} precision={2} suffix="x" value={settings.theme.scale} onChange={(v) => set("theme", "scale", v)} />
              </Row>
            </SettingsSection>
          </>
        )}

        {tab === "layout" && (
          <>
            <SettingsSection title="Grid">
              <Row label="Columns">
                <Slider label="Columns" min={3} max={10} value={settings.grid.columns} onChange={(v) => set("grid", "columns", v)} />
              </Row>
              <Row label="Slot size">
                <Slider label="Slot size" min={56} max={128} suffix="px" value={settings.grid.slotSize} onChange={(v) => set("grid", "slotSize", v)} />
              </Row>
              <Row label="Slot spacing">
                <Slider label="Slot spacing" min={0} max={24} suffix="px" value={settings.grid.gap} onChange={(v) => set("grid", "gap", v)} />
              </Row>
            </SettingsSection>

            <SettingsSection title="Slot details">
              <Row label="Slot numbers">
                <Toggle label="Slot numbers" checked={settings.grid.showSlotNumbers} onChange={(v) => set("grid", "showSlotNumbers", v)} />
              </Row>
              <Row label="Item counts">
                <Toggle label="Item counts" checked={settings.grid.showCount} onChange={(v) => set("grid", "showCount", v)} />
              </Row>
              <Row label="Durability bars">
                <Toggle label="Durability bars" checked={settings.grid.showDurability} onChange={(v) => set("grid", "showDurability", v)} />
              </Row>
              <Row label="Weight readout">
                <Toggle label="Weight readout" checked={settings.grid.showWeight} onChange={(v) => set("grid", "showWeight", v)} />
              </Row>
              <Row label="Outline hotbar slots" hint="Accents slots 1-5 in your pockets.">
                <Toggle label="Outline hotbar slots" checked={settings.grid.highlightHotbar} onChange={(v) => set("grid", "highlightHotbar", v)} />
              </Row>
            </SettingsSection>
          </>
        )}

        {tab === "background" && (
          <>
            <SettingsSection title="Source">
              <Row label="Mode">
                <Segmented
                  label="Background mode"
                  value={settings.background.mode}
                  onChange={(v) => set("background", "mode", v)}
                  options={[
                    { value: "preset", label: "Preset" },
                    { value: "custom", label: "Custom" },
                    { value: "solid", label: "Solid" },
                  ]}
                />
              </Row>

              {settings.background.mode === "preset" && (
                <div className="grid grid-cols-3 gap-3">
                  {(Object.keys(BACKGROUND_PRESETS) as BackgroundPreset[]).map((key) => {
                    const preset = BACKGROUND_PRESETS[key]
                    const selected = settings.background.preset === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => set("background", "preset", key)}
                        className="group overflow-hidden rounded-xl border text-left transition-transform hover:-translate-y-0.5"
                        style={{
                          borderColor: selected ? "var(--ox-accent-line)" : "var(--ox-border)",
                          boxShadow: selected ? "0 0 0 2px var(--ox-accent-soft)" : "none",
                        }}
                      >
                        <img src={preset.url || "/placeholder.svg"} alt={`${preset.label} background preview`} className="h-16 w-full object-cover" />
                        <span className="block px-2.5 py-1.5 text-[11.5px] font-medium" style={{ color: "var(--ox-text)" }}>
                          {preset.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              {settings.background.mode === "custom" && (
                <Row label="Image URL" hint="Any https URL, or a file inside web/build/.">
                  <TextField
                    wide
                    label="Custom background URL"
                    placeholder="https://example.com/bg.jpg"
                    value={settings.background.customUrl}
                    onChange={(v) => set("background", "customUrl", v)}
                  />
                </Row>
              )}

              {settings.background.mode === "solid" && (
                <Row label="Colour">
                  <ColorField label="Background colour" value={settings.background.solid} onChange={(v) => set("background", "solid", v)} />
                </Row>
              )}
            </SettingsSection>

            <SettingsSection title="Treatment" description="Keep the backdrop quiet so items stay readable.">
              <Row label="Opacity" hint="Lower it to let the game world show through.">
                <Slider label="Background opacity" min={0} max={1} step={0.01} precision={2} value={settings.background.opacity} onChange={(v) => set("background", "opacity", v)} />
              </Row>
              <Row label="Dim">
                <Slider label="Dim" min={0} max={1} step={0.01} precision={2} value={settings.background.dim} onChange={(v) => set("background", "dim", v)} />
              </Row>
              <Row label="Blur">
                <Slider label="Background blur" min={0} max={40} suffix="px" value={settings.background.blur} onChange={(v) => set("background", "blur", v)} />
              </Row>
              <Row label="Saturation">
                <Slider label="Saturation" min={0} max={2} step={0.01} precision={2} value={settings.background.saturation} onChange={(v) => set("background", "saturation", v)} />
              </Row>
              <Row label="Zoom">
                <Slider label="Zoom" min={1} max={1.6} step={0.01} precision={2} suffix="x" value={settings.background.scale} onChange={(v) => set("background", "scale", v)} />
              </Row>
              <Row label="Vignette">
                <Slider label="Vignette" min={0} max={1} step={0.01} precision={2} value={settings.background.vignette} onChange={(v) => set("background", "vignette", v)} />
              </Row>
            </SettingsSection>
          </>
        )}

        {tab === "effects" && (
          <>
            <SettingsSection title="Ambient effect" description="Canvas particles rendered behind or above the panels.">
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(EFFECT_LABELS) as EffectType[]).map((key) => {
                  const selected = settings.effects.type === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set("effects", "type", key)}
                      className="rounded-xl border px-2 py-2.5 text-[11.5px] font-medium transition-transform hover:-translate-y-0.5"
                      style={{
                        borderColor: selected ? "var(--ox-accent-line)" : "var(--ox-border)",
                        background: selected ? "var(--ox-accent-soft)" : "var(--ox-slot-hover)",
                        color: "var(--ox-text)",
                      }}
                    >
                      {EFFECT_LABELS[key]}
                    </button>
                  )
                })}
              </div>
            </SettingsSection>

            <SettingsSection title="Tuning">
              <Row label="Colour">
                <ColorField label="Effect colour" value={settings.effects.color} onChange={(v) => set("effects", "color", v)} />
              </Row>
              <Row label="Density">
                <Slider label="Density" min={0} max={1} step={0.01} precision={2} value={settings.effects.intensity} onChange={(v) => set("effects", "intensity", v)} />
              </Row>
              <Row label="Speed">
                <Slider label="Speed" min={0} max={1} step={0.01} precision={2} value={settings.effects.speed} onChange={(v) => set("effects", "speed", v)} />
              </Row>
              <Row label="Opacity">
                <Slider label="Opacity" min={0} max={1} step={0.01} precision={2} value={settings.effects.opacity} onChange={(v) => set("effects", "opacity", v)} />
              </Row>
              <Row label="Render behind panels" hint="Turn off to let snow fall in front of the UI.">
                <Toggle label="Render behind panels" checked={settings.effects.behindPanels} onChange={(v) => set("effects", "behindPanels", v)} />
              </Row>
            </SettingsSection>
          </>
        )}

        {tab === "brand" && (
          <SettingsSection title="Your logo" description="Drop a PNG/SVG into web/build/ or point at any URL.">
            <Row label="Show branding">
              <Toggle label="Show branding" checked={settings.brand.show} onChange={(v) => set("brand", "show", v)} />
            </Row>
            <Row label="Logo URL">
              <TextField wide label="Logo URL" placeholder="/brand/logo.png" value={settings.brand.logoUrl} onChange={(v) => set("brand", "logoUrl", v)} />
            </Row>
            <Row label="Logo size">
              <Slider label="Logo size" min={18} max={80} suffix="px" value={settings.brand.size} onChange={(v) => set("brand", "size", v)} />
            </Row>
            <Row label="Show text">
              <Toggle label="Show text" checked={settings.brand.showText} onChange={(v) => set("brand", "showText", v)} />
            </Row>
            <Row label="Title">
              <TextField label="Title" value={settings.brand.title} onChange={(v) => set("brand", "title", v)} />
            </Row>
            <Row label="Subtitle">
              <TextField label="Subtitle" value={settings.brand.subtitle} onChange={(v) => set("brand", "subtitle", v)} />
            </Row>
            <Row label="Alignment">
              <Segmented
                label="Brand alignment"
                value={settings.brand.align}
                onChange={(v) => set("brand", "align", v)}
                options={[
                  { value: "left", label: "Left" },
                  { value: "center", label: "Center" },
                ]}
              />
            </Row>
          </SettingsSection>
        )}

        {tab === "system" && (
          <SettingsSection title="Behaviour">
            <Row label="Animations" hint="Disable on low-spec machines for a flat, instant UI.">
              <Toggle label="Animations" checked={settings.behavior.animations} onChange={(v) => set("behavior", "animations", v)} />
            </Row>
            <Row label="Item tooltips">
              <Toggle label="Item tooltips" checked={settings.behavior.tooltips} onChange={(v) => set("behavior", "tooltips", v)} />
            </Row>
            <Row label="Tooltip delay">
              <Slider label="Tooltip delay" min={0} max={800} step={10} suffix="ms" value={settings.behavior.tooltipDelay} onChange={(v) => set("behavior", "tooltipDelay", v)} />
            </Row>
            <Row label="UI sounds">
              <Toggle label="UI sounds" checked={settings.behavior.sounds} onChange={(v) => set("behavior", "sounds", v)} />
            </Row>
            <Row label="Close with ESC">
              <Toggle label="Close with ESC" checked={settings.behavior.closeOnEsc} onChange={(v) => set("behavior", "closeOnEsc", v)} />
            </Row>
          </SettingsSection>
        )}
      </div>
    </div>
  )
}
