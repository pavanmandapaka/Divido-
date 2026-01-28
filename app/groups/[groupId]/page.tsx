'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { getGroupById, Group } from '@/lib/groups'
import Link from 'next/link'

export default function GroupDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  
  const [group, setGroup] = useState<Group | null>(null)
  const [role, setRole] = useState<'admin' | 'member' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
      </div>
    </div>
  )
}
