import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/estimate', label: 'Estimate' },
]

const GITHUB_URL = 'https://github.com/fbgranell/car-price-model'

export default function NavBar() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? 'bg-[#0A1628]/90 backdrop-blur-md border-white/[0.06]'
          : 'bg-transparent border-transparent'
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-[0_0_16px_rgba(0,212,255,0.35)] transition-transform duration-300 group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#050A14]" fill="currentColor">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
            </svg>
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-white">
            CAR<span className="text-primary">PRICE</span>
          </span>
        </Link>

        <div className="flex items-center gap-8">
          <div className="relative flex items-center gap-8">
            {LINKS.map((link) => {
              const active = pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative py-2 text-sm font-medium tracking-wide transition-colors ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-0 -bottom-[1px] h-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(0,212,255,0.65)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            title="GitHub repository"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-primary hover:bg-white/[0.06]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-1.99-3.2.7-3.88-1.54-3.88-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.27-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14 0 1.55-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z" />
            </svg>
          </a>
        </div>
      </nav>
    </header>
  )
}
