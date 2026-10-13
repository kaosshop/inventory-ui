import { InventoryApp } from "@/components/inventory/inventory-app"
import { InventoryProvider } from "@/components/inventory/inventory-provider"
import { SettingsProvider } from "@/components/inventory/settings-provider"

export default function Page() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      {/* Stand-in for the game world behind the transparent CEF layer. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url("/preview/street.png")' }}
      />
      <SettingsProvider>
        <InventoryProvider>
          <InventoryApp />
        </InventoryProvider>
      </SettingsProvider>
    </main>
  )
}
