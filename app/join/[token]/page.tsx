'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { validateInviteToken, joinGroupWithToken } from '@/lib/groups'

export default function JoinGroupPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  
  const [validating, setValidating] = useState(true)
  const [joining, setJoining] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [error, setError] = useState('')
  const [validationDone, setValidationDone] = useState(false)

  const token = params.token as string

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Store token in sessionStorage to resume after login
      if (token) {
        sessionStorage.setItem('pendingInviteToken', token)
      }
      router.push('/login')
    }
  }, [user, authLoading, router, token])

  // Validate token when user is ready
  useEffect(() => {
    if (user && token && !validationDone) {
      validateToken()
    }
  }, [user, token, validationDone])

  const validateToken = async () => {
    setValidating(true)
    setError('')

    try {
      console.log('Validating token:', token)
      const result = await validateInviteToken(token)

      if (result.valid && result.groupName) {
        setGroupName(result.groupName)
        setValidationDone(true)
      } else {
        setError(result.error || 'Invalid invite link')
      }
    } catch (err) {
      console.error('Validation error:', err)
      setError('Failed to validate invite')
    } finally {
      setValidating(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!user) return

    setJoining(true)
    setError('')

    try {
      console.log('Joining group...')
      const result = await joinGroupWithToken(
        token,
        user.uid,
        user.displayName || 'Anonymous',
        user.email || '',
        user.photoURL || undefined
      )

      if (result.success && result.groupId) {
        console.log('Successfully joined group:', result.groupId)
        // Clear stored token
        sessionStorage.removeItem('pendingInviteToken')
        // Redirect to group page
        router.push(`/groups/${result.groupId}`)
      } else {
        setError(result.error || 'Failed to join group')
        setJoining(false)
      }
    } catch (err) {
      console.error('Join error:', err)
      setError('An unexpected error occurred')
      setJoining(false)
    }
  }

  // Loading state
  if (authLoading || validating) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-600 text-lg">
            {authLoading ? 'Loading...' : 'Validating invite...'}
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Error state
  if (error && !groupName) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-6">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Invalid Invite
              </h1>
            </div>
            
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success - show join confirmation
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-blue-500 text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Join Group
            </h1>
            <p className="text-slate-600">
              You've been invited to join
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-2">Group Name</p>
              <p className="text-2xl font-bold text-slate-900">{groupName}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleJoinGroup}
              disabled={joining}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {joining ? 'Joining...' : 'Join Group'}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              disabled={joining}
              className="w-full bg-white text-slate-700 py-3 px-4 rounded-lg font-medium border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 pt-6 border-t text-center text-sm text-slate-500">
            <p>Logged in as {user.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
