'use client'

import Link from 'next/link'
import { isFirebaseConfigured } from '@/lib/firebaseConfig'

export const dynamic = 'force-dynamic'

export default function Home() {
  const firebaseConfigured = isFirebaseConfigured()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Smart Expense Splitter
          </h1>
          <p className="text-xl text-slate-300 mb-12">
            Split expenses smartly with your friends and settle up instantly
          </p>
          
          {!firebaseConfigured && (
            <div className="mb-8 p-6 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-left">
              <h2 className="text-xl font-bold text-yellow-300 mb-3">⚠️ Setup Required</h2>
              <p className="text-yellow-100 mb-4">
                Firebase authentication is not configured. Follow these steps:
              </p>
              <ol className="text-yellow-100 text-sm space-y-2 list-decimal list-inside">
                <li>Visit <a href="https://console.firebase.google.com" target="_blank" className="underline">Firebase Console</a></li>
                <li>Create a new project or select existing</li>
                <li>Enable <strong>Authentication</strong> (Email/Password + Google)</li>
                <li>Create <strong>Firestore Database</strong> (test mode)</li>
                <li>Go to Project Settings → Your apps → Web</li>
                <li>Copy your config and update <code className="bg-yellow-800 px-1 rounded">.env.local</code></li>
                <li>Restart dev server: <code className="bg-yellow-800 px-1 rounded">npm run dev</code></li>
              </ol>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            <Link 
              href="/login"
              className="px-8 py-3 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
