"use client"

import { PawpalStoreProvider } from "../lib/pawpal-store"

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PawpalStoreProvider>{children}</PawpalStoreProvider>
}
