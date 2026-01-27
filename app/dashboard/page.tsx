'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome, {user.displayName || 'User'}
            </h1>
            <p className="text-slate-600 mt-2">{user.email}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-xl text-slate-600">Dashboard coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}
