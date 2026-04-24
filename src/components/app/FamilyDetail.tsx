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

export default function FamilyDetail() {
  const { selectedFamilyId, selectedWeekId, setView, selectStudent } = useAppStore()
  const [family, setFamily] = useState<Family | null>(null)
  const [ranking, setRanking] = useState<FamilyRanking | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedFamilyId) {
      fetchFamily()
      fetchRanking()
    }
  }, [selectedFamilyId, selectedWeekId])

  const fetchFamily = async () => {
    try {
      const res = await fetch('/api/families')
      const families = await res.json()
      const f = families.find((fam: Family) => fam.id === selectedFamilyId)
      setFamily(f || null)
    } catch (error) {
      console.error('Error fetching family:', error)
    }
  }

  const fetchRanking = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/rankings?weekId=${selectedWeekId}`)
      const data = await res.json()
      const familyRank = (data.families || []).find((f: FamilyRanking) => f.familyId === selectedFamilyId)
      setRanking(familyRank || null)
    } catch (error) {
      console.error('Error fetching ranking:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!family) return null

  return (
    <div className="space-y-4">
      {/* Back button and header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('main')}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
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
          <h2 className="text-2xl font-bold text-white">{family.name}</h2>
          <p className="text-sm text-white/40">{family.students.length} estudiante(s)</p>
        </div>
        {ranking && (
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold" style={{ color: getScoreColor(ranking.average) }}>
              {ranking.average.toFixed(1)}
            </p>
            <p className="text-xs text-white/40">Promedio</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-40 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : !ranking || ranking.students.length === 0 ? (
        <Card className="metallic-card">
          <CardContent className="py-12 text-center">
            <p className="text-white/50">No hay calificaciones para esta semana</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranking.students.map(student => (
            <Card
              key={student.studentId}
              className="metallic-card cursor-pointer hover:bg-white/5 transition-all group"
              onClick={() => selectStudent(student.studentId)}
            >
              <CardContent className="py-4 px-5 flex items-center gap-4">
                <GaugeWheel score={student.average} size={80} showLabel={false} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white group-hover:text-yellow-300 transition-colors truncate">
                    {student.studentName}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: getScoreColor(student.average) }}>
                    {student.average.toFixed(1)} <span className="text-sm text-white/30">/20</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-white/30 group-hover:text-white/60 transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
