'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { getScoreColor } from '@/lib/auth'
import WeekSelector from './WeekSelector'
import { Trophy, Users, ChevronRight, Medal, Crown, Award } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FamilyRanking {
  familyId: string
  familyName: string
  familyColor: string
  average: number
  rank: number
  students: {
    studentId: string
    studentName: string
    average: number
  }[]
}

interface AcademicYear {
  id: string
  name: string
  weeks: { id: string; month: string; weekNumber: number }[]
}

export default function MainRanking() {
  const { selectedWeekId, selectFamily, selectedAcademicYearId } = useAppStore()
  const [rankings, setRankings] = useState<FamilyRanking[]>([])
  const [monthlyRankings, setMonthlyRankings] = useState<FamilyRanking[]>([])
  const [loading, setLoading] = useState(false)
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    fetchYears()
  }, [])

  const fetchYears = async () => {
    const res = await fetch('/api/years')
    const data = await res.json()
    setYears(data)
  }

  const fetchWeeklyRankings = useCallback(async () => {
    if (!selectedWeekId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/rankings?weekId=${selectedWeekId}`)
      const data = await res.json()
      setRankings(data.families || [])
    } catch (error) {
      console.error('Error fetching rankings:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedWeekId])

  const fetchMonthlyRankings = useCallback(async () => {
    if (!selectedMonth || !selectedAcademicYearId) return
    try {
      const res = await fetch(`/api/rankings?month=${encodeURIComponent(selectedMonth)}&academicYearId=${selectedAcademicYearId}`)
      const data = await res.json()
      setMonthlyRankings(data.families || [])
    } catch (error) {
      console.error('Error fetching monthly rankings:', error)
    }
  }, [selectedMonth, selectedAcademicYearId])

  useEffect(() => {
    fetchWeeklyRankings()
  }, [fetchWeeklyRankings])

  useEffect(() => {
    fetchMonthlyRankings()
  }, [fetchMonthlyRankings])

  const currentYear = years.find(y => y.id === selectedAcademicYearId)
  const months = [...new Set(currentYear?.weeks.map(w => w.month) || [])]

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="text-lg font-bold text-white/50">#{rank}</span>
  }

  const getPodiumGlow = (rank: number) => {
    if (rank === 1) return 'glow-yellow metallic-yellow'
    if (rank === 2) return 'glow-blue'
    if (rank === 3) return 'glow-red'
    return ''
  }

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Rankings
          </h2>
        </div>
        <WeekSelector />
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="weekly" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60">
            Ranking Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:metallic-blue data-[state=active]:text-white text-white/60">
            Ranking Mensual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-48 bg-white/5 rounded-xl" />
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <Card className="metallic-card">
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/50">No hay datos para esta semana</p>
                <p className="text-xs text-white/30 mt-1">Seleccione una semana con calificaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            /* Top 3 Podium */
            <div className="mb-8">
              <h3 className="text-sm font-medium text-yellow-400/70 uppercase tracking-wider mb-4 text-center">
                Podio Semanal
              </h3>
              <div className="flex items-end justify-center gap-3 mb-6">
                {rankings.slice(0, 3).map((family, idx) => {
                  const positions = [1, 0, 2] // 2nd, 1st, 3rd
                  const position = positions[idx]
                  const height = position === 0 ? 'h-40' : position === 1 ? 'h-32' : 'h-24'
                  return (
                    <div key={family.familyId} className="flex flex-col items-center">
                      <div className="mb-2">{getMedalIcon(position + 1)}</div>
                      <div
                        className={`${height} w-28 md:w-36 rounded-t-xl ${getPodiumGlow(position + 1)} 
                          flex flex-col items-center justify-end pb-4 cursor-pointer transition-all hover:scale-105`}
                        onClick={() => selectFamily(family.familyId)}
                      >
                        <span className="text-white font-bold text-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {family.average.toFixed(1)}
                        </span>
                        <span className="text-white/80 text-xs font-medium mt-1 text-center px-2">
                          {family.familyName}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Full Ranking List */}
              <div className="space-y-2">
                {rankings.map(family => (
                  <Card
                    key={family.familyId}
                    className="metallic-card cursor-pointer hover:bg-white/5 transition-all group"
                    onClick={() => selectFamily(family.familyId)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                             style={{ background: family.familyColor, boxShadow: `0 0 10px ${family.familyColor}60` }}>
                          {family.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-white group-hover:text-yellow-300 transition-colors">
                            {family.familyName}
                          </p>
                          <p className="text-xs text-white/40">{family.students.length} estudiante(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: getScoreColor(family.average) }}>
                            {family.average.toFixed(1)}
                          </span>
                          <span className="text-xs text-white/30"> /20</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="monthly" className="mt-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {months.map(month => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedMonth === month
                    ? 'metallic-blue text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {month}
              </button>
            ))}
          </div>

          {!selectedMonth ? (
            <Card className="metallic-card">
              <CardContent className="py-12 text-center">
                <p className="text-white/50">Seleccione un mes para ver el ranking</p>
              </CardContent>
            </Card>
          ) : monthlyRankings.length === 0 ? (
            <Card className="metallic-card">
              <CardContent className="py-12 text-center">
                <p className="text-white/50">No hay datos para este mes</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-blue-400/70 uppercase tracking-wider mb-4 text-center">
                Familia Más Consagrada - {selectedMonth}
              </h3>
              {/* Top 3 Monthly */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {monthlyRankings.slice(0, 3).map((family, idx) => (
                  <Card key={family.familyId} className={`metallic-card ${idx === 0 ? 'ring-2 ring-yellow-400/50' : ''}`}>
                    <CardContent className="py-6 text-center">
                      <div className="flex justify-center mb-3">{getMedalIcon(idx + 1)}</div>
                      <p className="font-bold text-white text-lg">{family.familyName}</p>
                      <p className="text-2xl font-bold mt-2" style={{ color: getScoreColor(family.average) }}>
                        {family.average.toFixed(1)}
                      </p>
                      <p className="text-xs text-white/40 mt-1">puntos promedio</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Full monthly list */}
              <div className="space-y-2">
                {monthlyRankings.map(family => (
                  <Card
                    key={family.familyId}
                    className="metallic-card cursor-pointer hover:bg-white/5 transition-all group"
                    onClick={() => selectFamily(family.familyId)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                             style={{ background: family.familyColor }}>
                          {family.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{family.familyName}</p>
                          <p className="text-xs text-white/40">{family.students.length} estudiante(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(family.average) }}>
                          {family.average.toFixed(1)}
                        </span>
                        <span className="text-xs text-white/30"> /20</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
