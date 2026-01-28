'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import Navbar from '@/components/Navbar'
import { getUserGroups, Group } from '@/lib/groups'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [groups, setGroups] = useState<Array<{ group: Group; role: 'admin' | 'member' }>>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchGroups()
    }
  }, [user, searchParams])

  const fetchGroups = async () => {
    if (!user) return
    
    try {
      setLoadingGroups(true)
      setError('')
      const userGroups = await getUserGroups(user.uid)
      setGroups(userGroups)
    } catch (err) {
      console.error('Error fetching groups:', err)
      setError('Failed to load groups')
    } finally {
      setLoadingGroups(false)
    }
  }

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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Welcome, {user.displayName || 'User'}
              </h1>
              <p className="text-slate-600 mt-2">{user.email}</p>
            </div>
            <Link 
              href="/groups/create"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Group
            </Link>
          </div>
          
          {/* Groups Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Your Groups</h2>
            
            {loadingGroups ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-slate-600">Loading groups...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            ) : groups.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-slate-600 mb-4">You don't have any groups yet</p>
                <Link 
                  href="/groups/create"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Your First Group
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {groups.map(({ group, role }) => (
                  <Link
                    key={group.groupId}
                    href={`/groups/${group.groupId}`}
                    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow block"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-900 mb-1">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-slate-600 text-sm mb-3">
                            {group.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-slate-500">
                          <span>Currency: <strong>{group.currency}</strong></span>
                          <span>Role: <strong className="capitalize">{role}</strong></span>
                          <span>Members: <strong>{group.memberCount}</strong></span>
                        </div>
                      </div>
                      {role === 'admin' && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

}
