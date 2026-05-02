import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import ConsoleNavbar from './pages/ConsoleNavbar'

type ThemeMode = 'dark' | 'light'

export default function App() {
  const [showApp, setShowApp] = useState(false)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = window.localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)]">
      {!showApp ? (
        <LandingPage onStart={() => setShowApp(true)} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <>
          <ConsoleNavbar onHome={() => setShowApp(false)} theme={theme} onToggleTheme={toggleTheme} />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-4 lg:px-6 lg:py-5">
            <Dashboard />
          </main>
        </>
      )}
    </div>
  )
}
