'use client'

import { useAuth } from '@/contexts/AuthProvider'

export default function Navbar() {
  const { signOut } = useAuth()

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-900">
              Smart Expense Splitter
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={signOut}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
