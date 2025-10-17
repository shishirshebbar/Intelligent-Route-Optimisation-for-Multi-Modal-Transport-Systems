import React, { useState } from 'react'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import ConsoleNavbar from './pages/ConsoleNavbar'

export default function App() {
  const [showApp, setShowApp] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {!showApp ? (
        <LandingPage onStart={() => setShowApp(true)} />
      ) : (
        <>
          <ConsoleNavbar />
          <main className="mx-auto max-w-7xl p-4">
            <Dashboard />
          </main>
        </>
      )}
    </div>
  )
}
