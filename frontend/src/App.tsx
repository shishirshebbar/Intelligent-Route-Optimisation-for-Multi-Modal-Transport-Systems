import React from 'react'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto p-4">
          <h1 className="text-xl font-semibold">Adaptive Multimodal Logistics</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <Dashboard />
      </main>
    </div>
  )
}
