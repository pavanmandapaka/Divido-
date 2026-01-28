'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { createGroup } from '@/lib/groups'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
]

export default function CreateGroupPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to create a group')
      return
    }

    setLoading(true)
    setError('')

    console.log('Starting group creation...')
    console.log('User:', user.uid, user.email)

    try {
      // Add timeout to detect hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - taking too long')), 10000)
      );

      const createPromise = createGroup({
        name,
        description,
        currency,
        createdBy: user.uid,
        creatorDisplayName: user.displayName || 'Anonymous',
        creatorEmail: user.email || '',
        creatorPhotoURL: user.photoURL || undefined,
      });

      const result = await Promise.race([createPromise, timeoutPromise]) as any;

      console.log('Group creation result:', result)

      if (result.success && result.groupId) {
        console.log('Redirecting to group:', result.groupId)
        // Redirect directly to the new group page for immediate feedback
        router.push(`/groups/${result.groupId}`)
      } else {
        console.error('Group creation failed:', result.error)
        setError(result.error || 'Failed to create group')
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Group creation error:', err)
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">Please log in to create a group</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Group
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group Name */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Weekend Trip"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label 
                htmlFor="description" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Shared expenses for our beach vacation"
                disabled={loading}
              />
            </div>

            {/* Currency */}
            <div>
              <label 
                htmlFor="currency" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
