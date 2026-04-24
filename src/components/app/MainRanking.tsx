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

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(18,10,50,0.95), rgba(15,25,55,0.95), rgba(10,30,70,0.95))',
  border: '1px solid rgba(100,100,200,0.2)',
}

export default function MainRanking() {
  const { selectedWeekId, selectFamily, selectedAcademicYearId } = useAppStore()
  const [rankings, setRankings] = useState<FamilyRanking[]>([])
  const [monthlyRankings, setMonthlyRankings] = useState<FamilyRanking[]>([])
  const [loading, setLoading] = useState(false)
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => { fetchYears() }, [])

  const fetchYears = async () => {
    const res = await fetch('/api/years')
    setYears(await res.json())
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

  useEffect(() => { fetchWeeklyRankings() }, [fetchWeeklyRankings])
  useEffect(() => { fetchMonthlyRankings() }, [fetchMonthlyRankings])

  const currentYear = years.find(y => y.id === selectedAcademicYearId)
  const months = [...new Set(currentYear?.weeks.map(w => w.month) || [])]

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6" style={{ color: '#ffd700', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.6))' }} />
    if (rank === 2) return <Medal className="h-6 w-6" style={{ color: '#c0c0c0', filter: 'drop-shadow(0 0 6px rgba(192,192,192,0.5))' }} />
    if (rank === 3) return <Award className="h-6 w-6" style={{ color: '#cd7f32', filter: 'drop-shadow(0 0 6px rgba(205,127,50,0.5))' }} />
    return <span className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>#{rank}</span>
  }

  const getPodiumStyle = (rank: number): React.CSSProperties => {
    if (rank === 1) return { background: 'linear-gradient(135deg, #b8860b, #ffd700, #ffed4a, #ffd700, #b8860b)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite', boxShadow: '0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)' }
    if (rank === 2) return { background: 'linear-gradient(135deg, #00008b, #1e90ff, #00bfff, #1e90ff, #00008b)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite', boxShadow: '0 0 15px rgba(30,144,255,0.5), 0 0 30px rgba(30,144,255,0.2)' }
    if (rank === 3) return { background: 'linear-gradient(135deg, #8b0000, #dc143c, #ff4500, #dc143c, #8b0000)', backgroundSize: '200% 200%', animation: 'shimmer 3s ease-in-out infinite', boxShadow: '0 0 15px rgba(220,20,60,0.5), 0 0 30px rgba(220,20,60,0.2)' }
    return {}
  }

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
            <Trophy className="h-5 w-5" style={{ color: '#ffd700', filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.5))' }} />
            Rankings
          </h2>
        </div>
        <WeekSelector />
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <TabsTrigger
            value="weekly"
            className="data-[state=active]:text-white"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Ranking Semanal
          </TabsTrigger>
          <TabsTrigger
            value="monthly"
            className="data-[state=active]:text-white"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Ranking Mensual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse h-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
              ))}
            </div>
          ) : rankings.length === 0 ? (
            <Card style={cardStyle}>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay datos para esta semana</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Seleccione una semana con calificaciones registradas</p>
              </CardContent>
            </Card>
          ) : (
            <div className="mb-8">
              <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-center" style={{ color: 'rgba(255,215,0,0.7)' }}>
                Podio Semanal
              </h3>
              {/* Top 3 Podium */}
              <div className="flex items-end justify-center gap-3 mb-6">
                {rankings.slice(0, 3).map((family, idx) => {
                  const positions = [1, 0, 2]
                  const position = positions[idx]
                  const height = position === 0 ? '160px' : position === 1 ? '128px' : '96px'
                  return (
                    <div key={family.familyId} className="flex flex-col items-center">
                      <div className="mb-2">{getMedalIcon(position + 1)}</div>
                      <div
                        className="rounded-t-xl cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-end pb-4"
                        style={{
                          ...getPodiumStyle(position + 1),
                          height,
                          width: '120px',
                          minWidth: '100px',
                        }}
                        onClick={() => selectFamily(family.familyId)}
                      >
                        <span className="font-bold text-lg" style={{ color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                          {family.average.toFixed(1)}
                        </span>
                        <span className="text-xs font-medium mt-1 text-center px-2" style={{ color: 'rgba(255,255,255,0.85)' }}>
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
                    className="cursor-pointer transition-all group"
                    style={{
                      ...cardStyle,
                    }}
                    onClick={() => selectFamily(family.familyId)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: family.familyColor, boxShadow: `0 0 10px ${family.familyColor}60` }}
                        >
                          {family.rank}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#ffffff' }}>{family.familyName}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{family.students.length} estudiante(s)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: getScoreColor(family.average) }}>
                            {family.average.toFixed(1)}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}> /20</span>
                        </div>
                        <ChevronRight className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
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
                className="px-3 py-1.5 rounded-lg text-sm transition-all"
                style={{
                  background: selectedMonth === month
                    ? 'linear-gradient(135deg, #00008b, #1e90ff, #00bfff, #1e90ff, #00008b)'
                    : 'rgba(255,255,255,0.05)',
                  color: selectedMonth === month ? '#ffffff' : 'rgba(255,255,255,0.6)',
                  boxShadow: selectedMonth === month ? '0 0 10px rgba(30,144,255,0.4)' : 'none',
                  border: selectedMonth === month ? '1px solid rgba(30,144,255,0.3)' : '1px solid transparent',
                }}
              >
                {month}
              </button>
            ))}
          </div>

          {!selectedMonth ? (
            <Card style={cardStyle}>
              <CardContent className="py-12 text-center">
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>Seleccione un mes para ver el ranking</p>
              </CardContent>
            </Card>
          ) : monthlyRankings.length === 0 ? (
            <Card style={cardStyle}>
              <CardContent className="py-12 text-center">
                <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay datos para este mes</p>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-center" style={{ color: 'rgba(30,144,255,0.7)' }}>
                Familia Más Consagrada - {selectedMonth}
              </h3>
              {/* Top 3 Monthly */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {monthlyRankings.slice(0, 3).map((family, idx) => (
                  <Card
                    key={family.familyId}
                    style={{
                      ...cardStyle,
                      ...(idx === 0 ? { border: '2px solid rgba(255,215,0,0.4)', boxShadow: '0 0 20px rgba(255,215,0,0.15)' } : {}),
                    }}
                  >
                    <CardContent className="py-6 text-center">
                      <div className="flex justify-center mb-3">{getMedalIcon(idx + 1)}</div>
                      <p className="font-bold text-lg" style={{ color: '#ffffff' }}>{family.familyName}</p>
                      <p className="text-2xl font-bold mt-2" style={{ color: getScoreColor(family.average), textShadow: `0 0 15px ${getScoreColor(family.average)}40` }}>
                        {family.average.toFixed(1)}
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>puntos promedio</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Full monthly list */}
              <div className="space-y-2">
                {monthlyRankings.map(family => (
                  <Card
                    key={family.familyId}
                    className="cursor-pointer transition-all"
                    style={cardStyle}
                    onClick={() => selectFamily(family.familyId)}
                  >
                    <CardContent className="py-3 px-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: family.familyColor }}
                        >
                          {family.rank}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ color: '#ffffff' }}>{family.familyName}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{family.students.length} estudiante(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(family.average) }}>
                          {family.average.toFixed(1)}
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}> /20</span>
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
