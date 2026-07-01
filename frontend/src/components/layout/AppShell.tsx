import type { ReactNode } from 'react'
import NavBar from './NavBar'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background bg-grid overflow-x-hidden">
      <NavBar />
      <main className="relative">{children}</main>
    </div>
  )
}
