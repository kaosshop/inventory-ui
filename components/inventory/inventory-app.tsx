"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Boxes, Settings2, Trash2, X } from "lucide-react"
import type { ContextTarget } from "@/lib/inv/types"
import { fetchNui } from "@/lib/inv/nui"
import { useSettings } from "./settings-provider"
import { useInventory } from "./inventory-provider"
import { DragProvider, useDrag } from "./drag-provider"
import { Backdrop, ForegroundEffects } from "./backdrop"
import { GlassPanel, InventoryPanel } from "./inventory-panel"
import { DragGhost } from "./drag-ghost"
import { Hotbar } from "./hotbar"
import { SlotContextMenu } from "./slot-context-menu"
import { SettingsTab } from "./settings-tab"

type View = "inventory" | "settings"

function Brand() {
  const { settings } = useSettings()
  const brand = settings.brand
  if (!brand.show) return <div />

  return (
    <div className={`flex items-center gap-3 ${brand.align === "center" ? "justify-center" : ""}`}>
      {brand.logoUrl && (
        <img
          src={brand.logoUrl || "/placeholder.svg"}
          alt=""
          className="shrink-0 rounded-xl object-contain"
          style={{ width: brand.size, height: brand.size }}
        />
      )}
      {brand.showText && (
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.02em]" style={{ color: "var(--ox-text)" }}>
            {brand.title}
          </p>
          {brand.subtitle && (
            <p className="truncate text-[10.5px] tracking-wide" style={{ color: "var(--ox-muted)" }}>
              {brand.subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DropZone() {
  const { active } = useDrag()
  return (
    <div
      data-ox-dropzone="true"
      className="flex flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center transition-colors"
      style={{
        borderRadius: "var(--ox-radius-inner)",
        borderColor: active ? "#ff453a" : "var(--ox-border-strong)",
        background: active ? "rgba(255,69,58,0.1)" : "transparent",
      }}
    >
      <Trash2 size={18} strokeWidth={1.6} style={{ color: active ? "#ff453a" : "var(--ox-muted)" }} />
      <span className="text-[10.5px] font-medium leading-tight" style={{ color: "var(--ox-muted)" }}>
        Drop on ground
      </span>
    </div>
  )
}

const SHORTCUTS = [
  ["Double click", "Use item"],
  ["Drag", "Move stack"],
  ["Shift + drag", "Move half"],
  ["Ctrl + drag", "Move one"],
  ["Right click", "More actions"],
]

function Shell() {
  const { settings, cssVars } = useSettings()
  const { left, right, open, setOpen, lastAction } = useInventory()
  const [view, setView] = useState<View>("inventory")
  const [context, setContext] = useState<ContextTarget | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && settings.behavior.closeOnEsc) {
        setOpen(false)
        void fetchNui("exit", {}, null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [settings.behavior.closeOnEsc, setOpen])

  const close = () => {
    setOpen(false)
    void fetchNui("exit", {}, null)
  }

  return (
    <div className="relative h-full w-full overflow-hidden" style={cssVars}>
      <Backdrop />

      <AnimatePresence>
        {open && (
          <motion.div
            key="shell"
            initial={settings.behavior.animations ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-10 flex items-center justify-center p-6"
          >
            <div
              className="flex h-full w-full max-w-[1500px] flex-col gap-5"
              style={{ transform: `scale(${settings.theme.scale})`, transformOrigin: "center" }}
            >
              <motion.header
                initial={settings.behavior.animations ? { opacity: 0, y: -14 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between gap-6 border px-5 py-3"
                style={{
                  borderRadius: "var(--ox-radius-inner)",
                  background: "var(--ox-surface)",
                  backdropFilter: "blur(var(--ox-blur)) saturate(1.7)",
                  WebkitBackdropFilter: "blur(var(--ox-blur)) saturate(1.7)",
                  borderColor: "var(--ox-border)",
                  boxShadow: "0 18px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <Brand />

                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5 rounded-xl p-0.5" style={{ background: "rgba(120,120,128,0.2)" }}>
                    {(
                      [
                        { id: "inventory", label: "Inventory", icon: Boxes },
                        { id: "settings", label: "Settings", icon: Settings2 },
                      ] as const
                    ).map((item) => {
                      const selected = view === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setView(item.id)}
                          className="relative flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-[12px] font-medium transition-colors"
                          style={{ color: selected ? "var(--ox-text)" : "var(--ox-muted)" }}
                        >
                          {selected && (
                            <motion.span
                              layoutId="view-pill"
                              className="absolute inset-0 rounded-[10px]"
                              style={{ background: "var(--ox-surface-strong)", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
                              transition={{ type: "spring", stiffness: 500, damping: 40 }}
                            />
                          )}
                          <item.icon size={14} strokeWidth={1.8} className="relative z-10" />
                          <span className="relative z-10">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close inventory"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors"
                    style={{ borderColor: "var(--ox-border)", color: "var(--ox-muted)", background: "var(--ox-slot)" }}
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
              </motion.header>

              {view === "inventory" ? (
                <div className="flex min-h-0 flex-1 items-stretch justify-center gap-5">
                  <div className="flex min-h-0 max-w-[640px] flex-1">
                    <InventoryPanel inventory={left} side="left" onContextMenu={setContext} />
                  </div>

                  <div className="flex w-[170px] shrink-0 flex-col justify-center gap-4">
                    <DropZone />
                    <div
                      className="flex flex-col gap-1.5 border p-3"
                      style={{ borderRadius: "var(--ox-radius-inner)", background: "var(--ox-slot)", borderColor: "var(--ox-border)" }}
                    >
                      {SHORTCUTS.map(([keys, action]) => (
                        <div key={keys} className="flex items-center justify-between gap-2 text-[9.5px]">
                          <span className="font-medium" style={{ color: "var(--ox-text)" }}>
                            {keys}
                          </span>
                          <span style={{ color: "var(--ox-muted)" }}>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-h-0 max-w-[640px] flex-1">
                    {right ? (
                      <InventoryPanel inventory={right} side="right" onContextMenu={setContext} delay={0.07} />
                    ) : (
                      <GlassPanel className="w-full items-center justify-center" delay={0.07}>
                        <p className="px-8 text-center text-[12.5px]" style={{ color: "var(--ox-muted)" }}>
                          No secondary inventory open. Walk up to a stash, vehicle or player to see it here.
                        </p>
                      </GlassPanel>
                    )}
                  </div>
                </div>
              ) : (
                <GlassPanel className="min-h-0 flex-1 p-5">
                  <SettingsTab />
                </GlassPanel>
              )}

              <div className="flex items-end justify-center gap-4">
                <Hotbar onContextMenu={setContext} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lastAction && (
          <motion.p
            key={lastAction}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none absolute bottom-4 left-1/2 z-[150] -translate-x-1/2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium"
            style={{
              background: "var(--ox-surface-strong)",
              borderColor: "var(--ox-border)",
              color: "var(--ox-muted)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            {lastAction}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>{context && <SlotContextMenu target={context} onClose={() => setContext(null)} />}</AnimatePresence>

      <ForegroundEffects />
      <DragGhost />
    </div>
  )
}

export function InventoryApp() {
  return (
    <DragProvider>
      <Shell />
    </DragProvider>
  )
}
