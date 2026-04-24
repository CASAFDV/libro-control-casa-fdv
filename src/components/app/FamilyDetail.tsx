'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getScoreColor } from '@/lib/auth'
import GaugeWheel from './GaugeWheel'
import { ArrowLeft, Users, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Family {
  id: string
  name: string
  color: string
  students: { id: string; name: string }[]
}

interface StudentWithGrades {
  studentId: string
  studentName: string
  average: number
  grades: { criteriaId: string; score: number; comment: string }[]
}

interface FamilyRanking {
  familyId: string
  familyName: string
  familyColor: string
  average: number
  students: StudentWithGrades[]
}

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(18,10,50,0.95), rgba(15,25,55,0.95), rgba(10,30,70,0.95))',
  border: '1px solid rgba(100,100,200,0.2)',
}

export default function FamilyDetail() {
  const { selectedFamilyId, selectedWeekId, setView, selectStudent } = useAppStore()
  const [family, setFamily] = useState<Family | null>(null)
  const [ranking, setRanking] = useState<FamilyRanking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedFamilyId) { fetchFamily(); fetchRanking() }
  }, [selectedFamilyId, selectedWeekId])

  const fetchFamily = async () => {
    try {
      const res = await fetch('/api/families')
      const families = await res.json()
      setFamily(families.find((f: Family) => f.id === selectedFamilyId) || null)
    } catch (error) { console.error('Error fetching family:', error) }
  }

  const fetchRanking = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rankings?weekId=${selectedWeekId}`)
      const data = await res.json()
      setRanking((data.families || []).find((f: FamilyRanking) => f.familyId === selectedFamilyId) || null)
    } catch (error) { console.error('Error fetching ranking:', error) }
    finally { setLoading(false) }
  }

  if (!family) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView('main')} style={{ color: 'rgba(255,255,255,0.6)' }} className="hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: family.color, boxShadow: `0 0 20px ${family.color}60` }}
        >
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{family.name}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{family.students.length} estudiante(s)</p>
        </div>
        {ranking && (
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold" style={{ color: getScoreColor(ranking.average), textShadow: `0 0 15px ${getScoreColor(ranking.average)}40` }}>
              {ranking.average.toFixed(1)}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Promedio</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="animate-pulse h-40 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : !ranking || ranking.students.length === 0 ? (
        <Card style={cardStyle}>
          <CardContent className="py-12 text-center">
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>No hay calificaciones para esta semana</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranking.students.map(student => (
            <Card
              key={student.studentId}
              className="cursor-pointer transition-all group"
              style={{
                ...cardStyle,
              }}
              onClick={() => selectStudent(student.studentId)}
            >
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <GaugeWheel score={student.average} size={80} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate" style={{ color: '#ffffff' }}>{student.studentName}</p>
                  <p className="text-2xl font-bold" style={{ color: getScoreColor(student.average) }}>
                    {student.average.toFixed(1)} <span className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>/20</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
