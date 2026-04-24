'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getScoreColor, getScoreLabel } from '@/lib/auth'
import GaugeWheel from './GaugeWheel'
import { ArrowLeft, AlertTriangle, MessageSquare, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface Student {
  id: string
  name: string
  familyId: string
  family: { id: string; name: string; color: string }
}

interface Grade {
  id: string
  criteriaId: string
  criteria: { id: string; name: string }
  score: number
  comment: string
}

interface WeeklyComment {
  id: string
  comment: string
}

interface CriteriaInfo {
  id: string
  name: string
  isActive: boolean
}

export default function StudentDetail() {
  const { selectedStudentId, selectedWeekId, setView, selectFamily } = useAppStore()
  const [student, setStudent] = useState<Student | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [weeklyComment, setWeeklyComment] = useState<WeeklyComment | null>(null)
  const [criteria, setCriteria] = useState<CriteriaInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedStudentId && selectedWeekId) {
      fetchStudentData()
    }
  }, [selectedStudentId, selectedWeekId])

  const fetchStudentData = async () => {
    setLoading(true)
    try {
      // Fetch student info
      const studentsRes = await fetch('/api/students')
      const students = await studentsRes.json()
      const s = students.find((st: Student) => st.id === selectedStudentId)
      setStudent(s || null)

      // Fetch grades
      const gradesRes = await fetch(`/api/grades?studentId=${selectedStudentId}&weekId=${selectedWeekId}`)
      const gradesData = await gradesRes.json()
      setGrades(gradesData)

      // Fetch weekly comment
      const commentRes = await fetch(`/api/weekly-comments?studentId=${selectedStudentId}&weekId=${selectedWeekId}`)
      const commentsData = await commentRes.json()
      setWeeklyComment(commentsData.length > 0 ? commentsData[0] : null)

      // Fetch criteria
      const criteriaRes = await fetch('/api/criteria')
      setCriteria(await criteriaRes.json())
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeCriteria = criteria.filter(c => c.isActive)
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0)
  const maxScore = activeCriteria.length * 20
  const average = activeCriteria.length > 0 ? totalScore / activeCriteria.length : 0

  // Find criteria that needs improvement (lowest scores)
  const criteriaWithScores = activeCriteria.map(c => {
    const grade = grades.find(g => g.criteriaId === c.id)
    return {
      ...c,
      score: grade?.score ?? 0,
      comment: grade?.comment ?? '',
    }
  }).sort((a, b) => a.score - b.score)

  const needsImprovement = criteriaWithScores.filter(c => c.score < 16.5)

  if (!student) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectFamily(student.familyId)}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a {student.family.name}
        </Button>
      </div>

      {/* Student Header */}
      <Card className="metallic-card overflow-hidden">
        <div className="h-2" style={{ background: student.family.color }} />
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <GaugeWheel score={average} size={140} />
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold text-white">{student.name}</h2>
              <p className="text-white/50 text-sm mt-1">
                {student.family.name} · {needsImprovement.length > 0 ? `${needsImprovement.length} criterio(s) por mejorar` : '¡Excelente desempeño!'}
              </p>
              <div className="mt-3">
                <span className="text-4xl font-bold" style={{ color: getScoreColor(average), textShadow: `0 0 20px ${getScoreColor(average)}40` }}>
                  {average.toFixed(1)}
                </span>
                <span className="text-white/30 text-lg ml-1">/20</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ background: getScoreColor(average) }} />
                <span className="text-sm" style={{ color: getScoreColor(average) }}>
                  {getScoreLabel(average)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse h-24 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Criteria Grades */}
          <Card className="metallic-card">
            <CardHeader>
              <CardTitle className="text-white text-lg">Calificaciones por Criterio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criteriaWithScores.map(c => {
                const pct = (c.score / 20) * 100
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{c.name}</span>
                      <span className="font-bold text-sm" style={{ color: getScoreColor(c.score) }}>
                        {c.score.toFixed(1)} /20
                      </span>
                    </div>
                    <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${getScoreColor(c.score)}80, ${getScoreColor(c.score)})`,
                          boxShadow: `0 0 8px ${getScoreColor(c.score)}60`,
                        }}
                      />
                    </div>
                    {c.comment && (
                      <p className="text-xs text-white/40 pl-2 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        {c.comment}
                      </p>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Weekly Comment */}
          {weeklyComment?.comment && (
            <Card className="metallic-card">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-yellow-400" />
                  Comentario General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70 whitespace-pre-wrap">{weeklyComment.comment}</p>
              </CardContent>
            </Card>
          )}

          {/* Criteria to Improve */}
          {needsImprovement.length > 0 && (
            <Card className="metallic-card border-red-500/20">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-400" />
                  Criterios a Mejorar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {needsImprovement.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/80 font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-white/40">
                        Puntuación actual: <span style={{ color: getScoreColor(c.score) }}>{c.score.toFixed(1)}</span>
                        · Faltan {(16.5 - c.score).toFixed(1)} puntos para azul
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
