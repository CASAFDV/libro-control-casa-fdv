'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { getScoreColor, getScoreLabel } from '@/lib/auth'
import GaugeWheel from './GaugeWheel'
import { ArrowLeft, AlertTriangle, MessageSquare, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(18,10,50,0.95), rgba(15,25,55,0.95), rgba(10,30,70,0.95))',
  border: '1px solid rgba(100,100,200,0.2)',
}

export default function StudentDetail() {
  const { selectedStudentId, selectedWeekId, setView, selectFamily } = useAppStore()
  const [student, setStudent] = useState<Student | null>(null)
  const [grades, setGrades] = useState<Grade[]>([])
  const [weeklyComment, setWeeklyComment] = useState<WeeklyComment | null>(null)
  const [criteria, setCriteria] = useState<CriteriaInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (selectedStudentId && selectedWeekId) fetchStudentData()
  }, [selectedStudentId, selectedWeekId])

  const fetchStudentData = async () => {
    setLoading(true)
    try {
      const [studentsRes, gradesRes, commentsRes, criteriaRes] = await Promise.all([
        fetch('/api/students'),
        fetch(`/api/grades?studentId=${selectedStudentId}&weekId=${selectedWeekId}`),
        fetch(`/api/weekly-comments?studentId=${selectedStudentId}&weekId=${selectedWeekId}`),
        fetch('/api/criteria'),
      ])
      const students = await studentsRes.json()
      setStudent(students.find((s: Student) => s.id === selectedStudentId) || null)
      setGrades(await gradesRes.json())
      const commentsData = await commentsRes.json()
      setWeeklyComment(commentsData.length > 0 ? commentsData[0] : null)
      setCriteria(await criteriaRes.json())
    } catch (error) { console.error('Error fetching student data:', error) }
    finally { setLoading(false) }
  }

  const activeCriteria = criteria.filter(c => c.isActive)
  const totalScore = grades.reduce((sum, g) => sum + g.score, 0)
  const average = activeCriteria.length > 0 ? totalScore / activeCriteria.length : 0

  const criteriaWithScores = activeCriteria.map(c => {
    const grade = grades.find(g => g.criteriaId === c.id)
    return { ...c, score: grade?.score ?? 0, comment: grade?.comment ?? '' }
  }).sort((a, b) => a.score - b.score)

  const needsImprovement = criteriaWithScores.filter(c => c.score < 16.5)

  if (!student) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => selectFamily(student.familyId)} style={{ color: 'rgba(255,255,255,0.6)' }} className="hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a {student.family.name}
        </Button>
      </div>

      {/* Student Header Card */}
      <Card style={{ ...cardStyle, overflow: 'hidden' }}>
        <div className="h-2" style={{ background: student.family.color }} />
        <CardContent className="pt-6 pb-4">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <GaugeWheel score={average} size={140} />
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-bold" style={{ color: '#ffffff' }}>{student.name}</h2>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {student.family.name} · {needsImprovement.length > 0 ? `${needsImprovement.length} criterio(s) por mejorar` : '¡Excelente desempeño!'}
              </p>
              <div className="mt-3">
                <span className="text-4xl font-bold" style={{ color: getScoreColor(average), textShadow: `0 0 20px ${getScoreColor(average)}40` }}>
                  {average.toFixed(1)}
                </span>
                <span className="text-lg ml-1" style={{ color: 'rgba(255,255,255,0.3)' }}>/20</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-3 h-3 rounded-full" style={{ background: getScoreColor(average) }} />
                <span className="text-sm" style={{ color: getScoreColor(average) }}>{getScoreLabel(average)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="animate-pulse h-24 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />)}
        </div>
      ) : (
        <>
          {/* Criteria Grades */}
          <Card style={cardStyle}>
            <CardHeader>
              <CardTitle style={{ color: '#ffffff' }} className="text-lg">Calificaciones por Criterio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {criteriaWithScores.map(c => {
                const pct = (c.score / 20) * 100
                const color = getScoreColor(c.score)
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.name}</span>
                      <span className="font-bold text-sm" style={{ color }}>{c.score.toFixed(1)} /20</span>
                    </div>
                    <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${color}80, ${color})`,
                          boxShadow: `0 0 8px ${color}60`,
                        }}
                      />
                    </div>
                    {c.comment && (
                      <p className="text-xs pl-2 flex items-start gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
            <Card style={cardStyle}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <MessageSquare className="h-5 w-5" style={{ color: '#ffd700' }} />
                  Comentario General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>{weeklyComment.comment}</p>
              </CardContent>
            </Card>
          )}

          {/* Criteria to Improve */}
          {needsImprovement.length > 0 && (
            <Card style={{ ...cardStyle, borderColor: 'rgba(220,20,60,0.3)' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#ffffff' }}>
                  <TrendingDown className="h-5 w-5" style={{ color: '#dc143c' }} />
                  Criterios a Mejorar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {needsImprovement.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(220,20,60,0.05)', border: '1px solid rgba(220,20,60,0.15)' }}>
                    <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: '#dc143c' }} />
                    <div className="flex-1">
                      <p className="font-medium text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{c.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
