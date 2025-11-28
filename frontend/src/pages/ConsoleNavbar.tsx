import React from 'react'
import { Scan, Wifi, Search, Sparkles } from 'lucide-react'

export default function ConsoleNavbar({ onHome }: { onHome: () => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">

        <button
          onClick={onHome}
          className="flex items-center gap-3 group transition active:scale-[0.97]"
        >
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-400 text-slate-900 shadow-md group-hover:shadow-teal-400/40 transition">
            <Scan className="h-5 w-5" />
          </div>

          <div>
            <div className="leading-none text-sm font-semibold text-white">Intelligent Route Optimiser</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="rounded-md border border-teal-300/30 bg-teal-400/10 px-2 py-0.5 text-[11px] font-medium text-teal-200">
                Production
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
                <Wifi className="h-3 w-3 text-teal-300" /> Live
              </span>
            </div>
          </div>
        </button>

        {/* Search */}
        <div className="hidden min-w-[280px] max-w-sm flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white backdrop-blur md:flex">
          <Search className="h-4 w-4 text-white/60" />
          <input
            placeholder="Search shipments, locations, events…"
            className="w-full bg-transparent text-sm text-white placeholder-white/50 outline-none"
          />
        </div>

        {/* Right Command Button */}
        <div>
          <button className="rounded-lg border border-white/10 bg-gradient-to-br from-white/10 to-white/5 px-3 py-2 text-white shadow-inner backdrop-blur hover:border-white/20 hover:bg-white/10 active:scale-[.97] transition inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-200" />
            <span className="text-xs text-white/80">Command</span>
          </button>
        </div>

      </div>
    </header>
  )
}
