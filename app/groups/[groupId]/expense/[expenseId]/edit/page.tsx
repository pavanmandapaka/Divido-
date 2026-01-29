'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthProvider'
import { getGroupById, Group } from '@/lib/groups'
import { getExpenseById, updateExpense, deleteExpense, EXPENSE_CATEGORIES, Expense } from '@/lib/expenses'
import Link from 'next/link'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function EditExpensePage() {
  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const groupId = params.groupId as string
  const expenseId = params.expenseId as string

  // Data state
  const [group, setGroup] = useState<Group | null>(null)
  const [expense, setExpense] = useState<Expense | null>(null)
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [members, setMembers] = useState<Array<{ userId: string; displayName: string; email: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [splitType, setSplitType] = useState<'equal' | 'exact' | 'percentage' | 'custom'>('equal')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Split input state (for exact/percentage/custom)
  const [splitInputs, setSplitInputs] = useState<{ [userId: string]: string }>({})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && groupId && expenseId) {
      fetchData()
    }
  }, [user, groupId, expenseId])

  const fetchData = async () => {
    if (!user || !groupId || !expenseId || !db) return

    try {
      setLoading(true)
      setError('')

      // Fetch expense first
      const expenseResult = await getExpenseById(expenseId)
      if (!expenseResult.success || !expenseResult.expense) {
        setError(expenseResult.error || 'Expense not found')
        setLoading(false)
        return
      }

      const exp = expenseResult.expense

      setExpense(exp)

      // Fetch group
      const groupResult = await getGroupById(groupId, user.uid)
      if (!groupResult) {
        setError('Group not found or you do not have access')
        setLoading(false)
        return
      }
      setGroup(groupResult.group)
      setRole(groupResult.role)

      // Fetch group members
      const membersRef = collection(db, 'groupMembers')
      const q = query(
        membersRef,
        where('groupId', '==', groupId),
        where('status', '==', 'active')
      )
      const querySnapshot = await getDocs(q)

      const memberList = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          userId: data.userId as string,
          displayName: data.displayName as string || '',
          email: data.email as string || ''
        }
      })
      setMembers(memberList)

      // Populate form with existing expense data
      setAmount(exp.amount.toString())
      setPaidBy(exp.paidBy)
      setSelectedParticipants(exp.participants)
      setSplitType(exp.splitType)
      setCategory(exp.category)
      setNote(exp.note)

      // Format date for input
      const expDate = exp.date.toDate ? exp.date.toDate() : new Date(exp.date as any)
      setDate(expDate.toISOString().split('T')[0])

      // Initialize split inputs from existing split details
      const initialSplitInputs: { [key: string]: string } = {}
      for (const userId of exp.participants) {
        const detail = exp.splitDetails[userId]
        if (exp.splitType === 'exact') {
          initialSplitInputs[userId] = detail?.amount?.toString() || ''
        } else if (exp.splitType === 'percentage') {
          initialSplitInputs[userId] = detail?.percentage?.toString() || ''
        } else if (exp.splitType === 'custom') {
          initialSplitInputs[userId] = detail?.shares?.toString() || ''
        } else {
          initialSplitInputs[userId] = ''
        }
      }
      setSplitInputs(initialSplitInputs)

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load expense details')
    } finally {
      setLoading(false)
    }
  }

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(selectedParticipants.filter(id => id !== userId))
    } else {
      setSelectedParticipants([...selectedParticipants, userId])
    }
  }

  const handleSplitInputChange = (userId: string, value: string) => {
    setSplitInputs(prev => ({
      ...prev,
      [userId]: value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!user || !groupId || !expenseId) return

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (selectedParticipants.length === 0) {
      setError('Please select at least one participant')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Build split input based on type
      let splitInput: { [userId: string]: number } | undefined

      if (splitType !== 'equal') {
        splitInput = {}
        for (const userId of selectedParticipants) {
          const value = parseFloat(splitInputs[userId] || '0')
          if (isNaN(value)) {
            setError(`Invalid ${splitType === 'percentage' ? 'percentage' : 'amount'} for a participant`)
            setSubmitting(false)
            return
          }
          splitInput[userId] = value
        }
      }

      const result = await updateExpense({
        expenseId,
        amount: numAmount,
        paidBy,
        participants: selectedParticipants,
        splitType,
        splitInput,
        category,
        note,
        date: new Date(date),
        updatedBy: user.uid,
        isAdmin: role === 'admin'
      })

      if (result.success) {
        router.push(`/groups/${groupId}`)
      } else {
        setError(result.error || 'Failed to update expense')
        setSubmitting(false)
      }
    } catch (err) {
      console.error('Error updating expense:', err)
      setError('An unexpected error occurred')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user || !expenseId) return

    setDeleting(true)
    setError('')

    try {
      const result = await deleteExpense(expenseId, user.uid, role === 'admin')

      if (result.success) {
        router.push(`/groups/${groupId}`)
      } else {
        setError(result.error || 'Failed to delete expense')
        setDeleting(false)
        setShowDeleteConfirm(false)
      }
    } catch (err) {
      console.error('Error deleting expense:', err)
      setError('An unexpected error occurred')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!user || !group || !expense) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-4">
            {error || 'Unable to load expense'}
          </div>
          <Link href={`/groups/${groupId}`} className="text-blue-600 hover:underline">
            ← Back to Group
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/groups/${groupId}`}
            className="text-blue-600 hover:underline mb-2 inline-block"
          >
            ← Back to {group.name}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Edit Expense</h1>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Expense?</h3>
              <p className="text-slate-600 mb-4">
                Are you sure you want to delete this expense? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-200 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount ({group.currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              disabled={submitting}
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paid By
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            >
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName || member.email}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            >
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={submitting}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What was this expense for?"
              disabled={submitting}
            />
          </div>

          {/* Split Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Split Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['equal', 'exact', 'percentage', 'custom'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    splitType === type
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                  disabled={submitting}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Split Between
            </label>
            <div className="space-y-2">
              {members.map((member) => {
                const isSelected = selectedParticipants.includes(member.userId)

                return (
                  <div key={member.userId} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`participant_${member.userId}`}
                      checked={isSelected}
                      onChange={() => toggleParticipant(member.userId)}
                      className="w-4 h-4 text-blue-600"
                      disabled={submitting}
                    />
                    <label
                      htmlFor={`participant_${member.userId}`}
                      className="flex-1 text-slate-700"
                    >
                      {member.displayName || member.email}
                    </label>

                    {/* Split input for non-equal splits */}
                    {splitType !== 'equal' && isSelected && (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={splitInputs[member.userId] || ''}
                        onChange={(e) => handleSplitInputChange(member.userId, e.target.value)}
                        className="w-24 px-3 py-1 border border-slate-300 rounded text-sm"
                        placeholder={splitType === 'percentage' ? '%' : group.currency}
                        disabled={submitting}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            {splitType === 'percentage' && (
              <p className="text-xs text-slate-500 mt-2">
                Percentages must add up to 100%
              </p>
            )}
            {splitType === 'exact' && (
              <p className="text-xs text-slate-500 mt-2">
                Amounts must add up to the total ({group.currency} {amount || '0'})
              </p>
            )}
            {splitType === 'custom' && (
              <p className="text-xs text-slate-500 mt-2">
                Enter share count for each person (e.g., 1, 2, 1.5)
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting || deleting}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href={`/groups/${groupId}`}
              className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-center"
            >
              Cancel
            </Link>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={submitting || deleting}
              className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg font-medium hover:bg-red-100 disabled:opacity-50"
            >
              Delete Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
