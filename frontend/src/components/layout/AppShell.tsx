import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'

export default function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const showFooter = pathname === '/'

  return (
    <div className="relative min-h-screen bg-background bg-grid overflow-x-hidden flex flex-col">
      <NavBar />
      <main className="relative flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  )
}
