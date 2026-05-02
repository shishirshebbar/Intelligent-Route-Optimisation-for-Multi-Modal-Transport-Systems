import { Activity, ArrowLeft, Moon, Radio, Scan, Sun } from 'lucide-react'

export default function ConsoleNavbar({
  onHome,
  theme,
  onToggleTheme,
}: {
  onHome: () => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line-strong)] bg-[var(--surface-1)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <button
          onClick={onHome}
          className="flex items-center gap-3 rounded-md px-1 py-1 text-left transition hover:bg-white/5 active:scale-[0.99]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--accent-strong)]">
            <Scan className="h-5 w-5" />
          </div>

          <div>
            <div className="leading-none text-sm font-semibold text-[var(--text-primary)]">
              Intelligent Route Optimiser
            </div>
            <div className="mt-1 text-[11px] text-[var(--text-dim)]">
              Transport operations console
            </div>
          </div>
        </button>

        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] text-[var(--text-secondary)]">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--ok)]" />
            Real-time routing and event monitoring
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 md:flex">
            <Radio className="h-4 w-4 text-[var(--accent-strong)]" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                Feed
              </div>
              <div className="text-xs text-[var(--text-secondary)]">Connected</div>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 lg:flex">
            <Activity className="h-4 w-4 text-[var(--warning)]" />
            <div className="text-left">
              <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-faint)]">
                Scope
              </div>
              <div className="text-xs text-[var(--text-secondary)]">Road-first prototype</div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-secondary)] transition hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            onClick={onHome}
          >
            <ArrowLeft className="h-4 w-4" />
            Overview
          </button>
        </div>
      </div>
    </header>
  )
}
