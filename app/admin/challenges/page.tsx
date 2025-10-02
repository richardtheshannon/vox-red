'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Challenge {
  id: string
  title: string
  subtitle?: string | null
  duration: number
  startDate: Date | string | null
  endDate: Date | string | null
  currentDay: number
  totalExercises: number
  overallPercentage: number
  totalCompletions: number
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchChallenges()
  }, [])

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/challenges/active')
      if (response.ok) {
        const data = await response.json()
        setChallenges(data.challenges || [])
      }
    } catch (error) {
      console.error('Error fetching challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (challenge: Challenge) => {
    if (!challenge.startDate || !challenge.endDate) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white">Not Configured</span>
    }

    const now = new Date()
    const start = new Date(challenge.startDate)
    const end = new Date(challenge.endDate)

    if (now < start) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500 text-white">Upcoming</span>
    } else if (now > end) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-500 text-white">Completed</span>
    } else {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-500 text-white">Active</span>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Challenge Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Manage 30/60/90 day challenges and track progress
              </p>
            </div>
            <Link
              href="/admin/articles"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Articles
            </Link>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Active Challenges
            </h2>
          </div>

          {challenges.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No active challenges found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {challenges.map((challenge) => (
                <div key={challenge.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(challenge)}
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {challenge.title}
                        </h3>
                      </div>
                      {challenge.subtitle && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {challenge.subtitle}
                        </p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Duration</span>
                          <p className="text-sm font-medium">{challenge.duration} days</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Current Day</span>
                          <p className="text-sm font-medium">{challenge.currentDay}/{challenge.duration}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Exercises</span>
                          <p className="text-sm font-medium">{challenge.totalExercises}</p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Overall Progress</span>
                          <p className="text-sm font-medium">{challenge.overallPercentage}%</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${challenge.overallPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Link
                        href={`/admin/articles?edit=${challenge.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Challenge Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
            Creating Challenges
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-400 mb-4">
            To create a new challenge:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-400">
            <li>Go to the Articles page and create a new article</li>
            <li>Set the article type to &quot;challenge&quot;</li>
            <li>Check the &quot;Is Challenge&quot; checkbox</li>
            <li>Set the challenge duration (30, 60, or 90 days)</li>
            <li>Set the start and end dates</li>
            <li>Add sub-articles as challenge exercises</li>
          </ol>
        </div>
      </div>
    </div>
  )
}