'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { getGroupById, Group, createGroupInvite } from '@/lib/groups'
import Link from 'next/link'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  
  const [group, setGroup] = useState<Group | null>(null)
  const [role, setRole] = useState<'admin' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const groupId = params.groupId as string

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && groupId) {
      fetchGroup()
    }
  }, [user, groupId])

  const fetchGroup = async () => {
    if (!user || !groupId) return

    console.log('Fetching group:', groupId, 'for user:', user.uid)

    try {
      setLoading(true)
      setError('')
      
      const result = await getGroupById(groupId, user.uid)
      
      console.log('Group fetch result:', result)
      
      if (!result) {
        setError('Group not found or you do not have access')
        setLoading(false)
        return
      }

      setGroup(result.group)
      setRole(result.role)
    } catch (err) {
      console.error('Error fetching group:', err)
      setError('Failed to load group details')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvite = async () => {
    if (!user || !groupId) return

    setGeneratingInvite(true)
    setError('')

    try {
      const result = await createGroupInvite(groupId, user.uid)
      
      if (result.success && result.token) {
        const link = `${window.location.origin}/join/${result.token}`
        setInviteLink(link)
      } else {
        setError(result.error || 'Failed to generate invite link')
      }
    } catch (err) {
      console.error('Error generating invite:', err)
      setError('Failed to generate invite link')
    } finally {
      setGeneratingInvite(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
            {error || 'Group not found'}
          </div>
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link 
          href="/dashboard"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to Dashboard
        </Link>

        {/* Group Details Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-slate-900">
              {group.name}
            </h1>
            {role === 'admin' && (
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                Admin
              </span>
            )}
          </div>

          {/* Group Information */}
          <div className="space-y-6">
            {group.description && (
              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-slate-700">{group.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Currency
                </h2>
                <p className="text-2xl font-semibold text-slate-900">
                  {group.currency}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Your Role
                </h2>
                <p className="text-2xl font-semibold text-slate-900 capitalize">
                  {role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Members
                </h2>
                <p className="text-xl font-semibold text-slate-900">
                  {group.memberCount}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Total Expenses
                </h2>
                <p className="text-xl font-semibold text-slate-900">
                  {group.currency} {group.totalExpenses.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Section - Only for Admins */}
        {role === 'admin' && (
          <div className="bg-white rounded-lg shadow-md p-8 mt-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              Invite Members
            </h2>
            
            {!inviteLink ? (
              <div>
                <p className="text-slate-600 mb-4">
                  Generate an invite link to add new members to this group
                </p>
                <button
                  onClick={handleGenerateInvite}
                  disabled={generatingInvite}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {generatingInvite ? 'Generating...' : 'Generate Invite Link'}
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-600 mb-3">
                  Share this link with people you want to invite:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  This link expires in 7 days
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
