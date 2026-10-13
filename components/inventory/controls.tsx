"use client"

import { useId, type ReactNode } from "react"

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section
      className="border p-5"
      style={{
        borderRadius: "var(--ox-radius-inner)",
        background: "var(--ox-slot)",
        borderColor: "var(--ox-border)",
      }}
    >
      <h3 className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: "var(--ox-text)" }}>
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-[11.5px] leading-relaxed" style={{ color: "var(--ox-muted)" }}>
          {description}
        </p>
      )}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  )
}

export function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-5">
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium" style={{ color: "var(--ox-text)" }}>
          {label}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--ox-muted)" }}>
            {hint}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">{children}</div>
    </div>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? "var(--ox-accent)" : "rgba(120,120,128,0.32)" }}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-md transition-[left] duration-200"
        style={{ left: checked ? 21 : 3 }}
      />
    </button>
  )
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  suffix,
  precision = 0,
  onChange,
  label,
}: {
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  precision?: number
  onChange: (v: number) => void
  label: string
}) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        aria-label={label}
        className="ox-range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--ox-range-fill" as string]: `${percent}%` }}
      />
      <span className="w-14 shrink-0 text-right text-[11.5px] font-medium tabular-nums" style={{ color: "var(--ox-muted)" }}>
        {value.toFixed(precision)}
        {suffix}
      </span>
    </div>
  )
}

export function ColorField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="h-7 w-7 cursor-pointer rounded-lg border"
        style={{ background: value, borderColor: "var(--ox-border-strong)" }}
      >
        <span className="sr-only">{label}</span>
      </label>
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="sr-only" />
      <input
        type="text"
        aria-label={`${label} hex value`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ox-input w-[84px] font-mono text-[11px] uppercase"
      />
    </div>
  )
}

export function TextField({
  value,
  onChange,
  placeholder,
  label,
  wide,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label: string
  wide?: boolean
}) {
  return (
    <input
      type="text"
      aria-label={label}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`ox-input text-[12px] ${wide ? "w-[260px]" : "w-[170px]"}`}
    />
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex gap-0.5 rounded-xl p-0.5"
      style={{ background: "rgba(120,120,128,0.2)" }}
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="rounded-[10px] px-3 py-1.5 text-[11.5px] font-medium transition-all duration-150"
            style={{
              background: selected ? "var(--ox-surface-strong)" : "transparent",
              color: selected ? "var(--ox-text)" : "var(--ox-muted)",
              boxShadow: selected ? "0 1px 4px rgba(0,0,0,0.4)" : "none",
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
