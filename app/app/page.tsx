'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Header from '../components/Header'
import StatsCards from '../components/StatsCards'
import MatchCard from '../components/MatchCard'
import type { Match } from '../types/match'

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('match_datetime', { ascending: true })

      if (error) {
        console.error('Error loading matches:', error)
      } else {
        setMatches(data || [])
      }

      setLoading(false)
    }

    fetchMatches()
  }, [])

  return (
    <main className="min-h-screen bg-neutral-100 p-4 text-neutral-900">
      <div className="mx-auto max-w-md">
        <Header
          title="World Cup Challenge"
          subtitle="Follow the matches, spot PUMA teams and prepare your predictions."
        />

        <StatsCards />

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Upcoming matches</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
              Demo
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading matches...</p>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}