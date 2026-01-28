'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { loginWithEmail, loginWithGoogle } from '@/lib/firebase'
import { isFirebaseConfigured } from '@/lib/firebaseConfig'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSetupWarning] = useState(!isFirebaseConfigured())
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { user, error } = await loginWithEmail(email, password)
    
    if (error) {
      setError(error)
      setLoading(false)
    } else if (user) {
      // Check for pending invite token
      const pendingToken = sessionStorage.getItem('pendingInviteToken')
      if (pendingToken) {
        router.push(`/join/${pendingToken}`)
      } else {
        router.push('/dashboard')
      }
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    const { user, error } = await loginWithGoogle()
    
    if (error) {
      setError(error)
      setLoading(false)
    } else if (user) {
      // Check for pending invite token
      const pendingToken = sessionStorage.getItem('pendingInviteToken')
      if (pendingToken) {
        router.push(`/join/${pendingToken}`)
      } else {
        router.push('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6 text-center">
          Login
        </h1>
        
        {showSetupWarning && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800 mb-2">Firebase Setup Required</p>
            <p className="text-xs text-yellow-700 mb-2">
              Authentication is currently disabled. To enable login:
            </p>
            <ol className="text-xs text-yellow-700 list-decimal list-inside space-y-1">
              <li>Create a Firebase project at console.firebase.google.com</li>
              <li>Enable Email/Password and Google authentication</li>
              <li>Create a Firestore database</li>
              <li>Update .env.local with your Firebase credentials</li>
              <li>Restart the dev server</li>
            </ol>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>
          
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in with Google
          </button>
        </div>
        
        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
