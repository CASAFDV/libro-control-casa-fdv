'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Family { id: string; name: string; color: string; students: { id: string; name: string }[] }
interface Criteria { id: string; name: string; isActive: boolean }
interface Week { id: string; weekNumber: number; label: string; month: string }
interface AcademicYear { id: string; name: string; isActive: boolean; weeks: Week[] }

interface GradeEntry {
  studentId: string
  criteriaId: string
  weekId: string
  score: number
  comment: string
}

export default function AdminDashboard() {
  const { authToken, authUser, setView } = useAppStore()
  const { toast } = useToast()
  const headers = { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }

  const [families, setFamilies] = useState<Family[]>([])
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('')
  const [grades, setGrades] = useState<Record<string, Record<string, { score: number; comment: string }>>>({})
  const [generalComments, setGeneralComments] = useState<Record<string, string>>({})
  const [existingGrades, setExistingGrades] = useState<any[]>([])
  const [existingComments, setExistingComments] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  // Get allowed criteria for this admin
  const allowedCriteriaIds = authUser?.role === 'SUPER_ADMIN'
    ? criteria.filter(c => c.isActive).map(c => c.id)
    : (authUser?.adminCriteria?.map(ac => ac.id) || [])

  const allowedCriteria = criteria.filter(c => allowedCriteriaIds.includes(c.id) && c.isActive)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [familiesRes, criteriaRes, yearsRes] = await Promise.all([
        fetch('/api/families'),
        fetch('/api/criteria'),
        fetch('/api/years'),
      ])
      const familiesData = await familiesRes.json()
      const criteriaData = await criteriaRes.json()
      const yearsData = await yearsRes.json()

      setFamilies(familiesData)
      setCriteria(criteriaData)
      setYears(yearsData)

      // Auto-select active year
      const activeYear = yearsData.find((y: AcademicYear) => y.isActive)
      if (activeYear) {
        setSelectedYearId(activeYear.id)
        if (activeYear.weeks.length > 0) {
          setSelectedWeekId(activeYear.weeks[activeYear.weeks.length - 1].id)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadWeekGrades = useCallback(async () => {
    if (!selectedWeekId || !selectedFamilyId) return
    try {
      const [gradesRes, commentsRes] = await Promise.all([
        fetch(`/api/grades?weekId=${selectedWeekId}`),
        fetch(`/api/weekly-comments?weekId=${selectedWeekId}`),
      ])
      const gradesData = await gradesRes.json()
      const commentsData = await commentsRes.json()
      setExistingGrades(gradesData)
      setExistingComments(commentsData)

      // Build grades map
      const familyStudents = families.find(f => f.id === selectedFamilyId)?.students || []
      const newGrades: Record<string, Record<string, { score: number; comment: string }>> = {}
      const newComments: Record<string, string> = {}

      for (const student of familyStudents) {
        newGrades[student.id] = {}
        for (const c of allowedCriteria) {
          const existing = gradesData.find((g: any) => g.studentId === student.id && g.criteriaId === c.id)
          newGrades[student.id][c.id] = {
            score: existing?.score ?? 0,
            comment: existing?.comment ?? '',
          }
        }
        const existingComment = commentsData.find((c: any) => c.studentId === student.id)
        newComments[student.id] = existingComment?.comment ?? ''
      }

      setGrades(newGrades)
      setGeneralComments(newComments)
    } catch (error) {
      console.error('Error loading grades:', error)
    }
  }, [selectedWeekId, selectedFamilyId, families, allowedCriteria])

  useEffect(() => {
    loadWeekGrades()
  }, [loadWeekGrades])

  const handleScoreChange = (studentId: string, criteriaId: string, score: number) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criteriaId]: { ...prev[studentId]?.[criteriaId], score: Math.min(20, Math.max(0, score)) },
      },
    }))
  }

  const handleCommentChange = (studentId: string, criteriaId: string, comment: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [criteriaId]: { ...prev[studentId]?.[criteriaId], comment },
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const familyStudents = families.find(f => f.id === selectedFamilyId)?.students || []
      const gradesToSave: GradeEntry[] = []

      for (const student of familyStudents) {
        for (const c of allowedCriteria) {
          const g = grades[student.id]?.[c.id]
          if (g) {
            gradesToSave.push({
              studentId: student.id,
              criteriaId: c.id,
              weekId: selectedWeekId,
              score: g.score,
              comment: g.comment,
            })
          }
        }
        // Save general comment
        const comment = generalComments[student.id]
        if (comment !== undefined) {
          await fetch('/api/weekly-comments', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              studentId: student.id,
              weekId: selectedWeekId,
              comment,
            }),
          })
        }
      }

      if (gradesToSave.length > 0) {
        const res = await fetch('/api/grades', {
          method: 'POST',
          headers,
          body: JSON.stringify({ grades: gradesToSave }),
        })
        if (!res.ok) throw new Error('Error al guardar notas')
      }

      toast({ title: 'Notas guardadas correctamente' })
      loadWeekGrades()
    } catch (error: any) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const currentYear = years.find(y => y.id === selectedYearId)
  const weeks = currentYear?.weeks || []
  const monthsMap = new Map<string, Week[]>()
  weeks.forEach(w => {
    if (!monthsMap.has(w.month)) monthsMap.set(w.month, [])
    monthsMap.get(w.month)!.push(w)
  })

  const familyStudents = families.find(f => f.id === selectedFamilyId)?.students || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView('main')} className="text-white/60 hover:text-white hover:bg-white/10">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Button>
        <h2 className="text-xl font-bold text-white">
          Panel de {authUser?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Administrador'}
        </h2>
      </div>

      {/* Selection controls */}
      <Card className="metallic-card">
        <CardContent className="py-4 flex flex-wrap gap-4 items-end">
          <div>
            <Label className="text-white/70 text-sm">Año Académico</Label>
            <Select value={selectedYearId} onValueChange={(val) => { setSelectedYearId(val); setSelectedWeekId('') }}>
              <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white text-sm mt-1">
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a2e] border-white/20">
                {years.map(y => (
                  <SelectItem key={y.id} value={y.id} className="text-white focus:bg-white/10">{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm">Semana</Label>
            <Select value={selectedWeekId} onValueChange={setSelectedWeekId}>
              <SelectTrigger className="w-56 bg-white/5 border-white/20 text-white text-sm mt-1">
                <SelectValue placeholder="Seleccionar semana" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a2e] border-white/20 max-h-60">
                {Array.from(monthsMap.entries()).map(([month, monthWeeks]) => (
                  <div key={month}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-yellow-400/80 uppercase tracking-wider bg-white/5">{month}</div>
                    {monthWeeks.map(w => (
                      <SelectItem key={w.id} value={w.id} className="text-white focus:bg-white/10 text-sm">
                        Semana {w.weekNumber}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-sm">Familia</Label>
            <Select value={selectedFamilyId} onValueChange={setSelectedFamilyId}>
              <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white text-sm mt-1">
                <SelectValue placeholder="Seleccionar familia" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a2e] border-white/20">
                {families.map(f => (
                  <SelectItem key={f.id} value={f.id} className="text-white focus:bg-white/10">{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFamilyId && selectedWeekId && (
            <Button onClick={handleSave} disabled={saving} className="metallic-red text-white border-0 ml-auto">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Notas'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Grade entry table */}
      {selectedFamilyId && selectedWeekId && allowedCriteria.length > 0 ? (
        <Card className="metallic-card">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Calificaciones - {families.find(f => f.id === selectedFamilyId)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 py-2 px-2 font-medium">Estudiante</th>
                    {allowedCriteria.map(c => (
                      <th key={c.id} className="text-center text-white/60 py-2 px-2 font-medium min-w-[100px]">
                        {c.name}
                      </th>
                    ))}
                    <th className="text-center text-yellow-400/70 py-2 px-2 font-medium w-10">
                      <MessageSquare className="h-4 w-4 mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {familyStudents.map(student => (
                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-3 px-2 text-white/80 font-medium whitespace-nowrap">{student.name}</td>
                      {allowedCriteria.map(c => (
                        <td key={c.id} className="py-2 px-1">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={grades[student.id]?.[c.id]?.score ?? 0}
                              onChange={(e) => handleScoreChange(student.id, c.id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8 text-center bg-white/5 border-white/20 text-white text-sm mx-auto"
                            />
                            <Input
                              placeholder="Comentario"
                              value={grades[student.id]?.[c.id]?.comment ?? ''}
                              onChange={(e) => handleCommentChange(student.id, c.id, e.target.value)}
                              className="w-full h-6 text-[10px] bg-white/5 border-white/10 text-white/60 mx-auto"
                            />
                          </div>
                        </td>
                      ))}
                      <td className="py-2 px-1">
                        <Textarea
                          placeholder="Comentario general..."
                          value={generalComments[student.id] ?? ''}
                          onChange={(e) => setGeneralComments(prev => ({...prev, [student.id]: e.target.value}))}
                          className="w-32 h-16 text-xs bg-white/5 border-white/10 text-white/60"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : selectedFamilyId && selectedWeekId ? (
        <Card className="metallic-card">
          <CardContent className="py-12 text-center">
            <p className="text-white/50">No tiene criterios asignados para calificar</p>
            <p className="text-xs text-white/30 mt-1">Contacte al Super Administrador</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="metallic-card">
          <CardContent className="py-12 text-center">
            <p className="text-white/50">Seleccione año, semana y familia para comenzar</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
