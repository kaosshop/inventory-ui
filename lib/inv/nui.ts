"use client"

import { useEffect, useRef } from "react"

/** True when running in a normal browser (v0 preview / `pnpm dev`) instead of FiveM's CEF. */
export const isBrowser = (): boolean => typeof window !== "undefined" && !(window as any).invokeNative

/** Resource name injected by CEF. Falls back to the ox_inventory default. */
export const resourceName = (): string => {
  if (typeof window === "undefined") return "ox_inventory"
  return (window as any).GetParentResourceName?.() ?? "ox_inventory"
}

/**
 * POST to a registered NUI callback. In the browser it resolves with `mock`
 * so every interaction stays testable outside the game.
 */
export async function fetchNui<T = unknown>(event: string, data?: unknown, mock?: T): Promise<T> {
  if (isBrowser()) {
    await new Promise((r) => setTimeout(r, 40))
    return mock as T
  }

  const res = await fetch(`https://${resourceName()}/${event}`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify(data ?? {}),
  })

  return (await res.json()) as T
}

interface NuiMessage<T = unknown> {
  action: string
  data: T
}

/** Subscribe to `SendNUIMessage({ action, data })` from Lua. */
export function useNuiEvent<T = unknown>(action: string, handler: (data: T) => void) {
  const saved = useRef(handler)
  saved.current = handler

  useEffect(() => {
    const listener = (event: MessageEvent<NuiMessage<T>>) => {
      if (event.data?.action === action) saved.current(event.data.data)
    }
    window.addEventListener("message", listener)
    return () => window.removeEventListener("message", listener)
  }, [action])
}

/** Dispatch a fake NUI message — used by the preview harness. */
export function emitNui<T>(action: string, data: T) {
  window.dispatchEvent(new MessageEvent("message", { data: { action, data } }))
}
