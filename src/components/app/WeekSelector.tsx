'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Week {
  id: string
  weekNumber: number
  startDate: string
  label: string
  month: string
}

interface AcademicYear {
  id: string
  name: string
  isActive: boolean
  weeks: Week[]
}

const selectStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }

export default function WeekSelector() {
  const { selectedWeekId, selectWeek, selectedAcademicYearId, selectAcademicYear } = useAppStore()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchYears() }, [])

  const fetchYears = async () => {
    try {
      const res = await fetch('/api/years')
      const data = await res.json()
      setYears(data)
      const activeYear = data.find((y: AcademicYear) => y.isActive)
      if (activeYear && !selectedAcademicYearId) {
        selectAcademicYear(activeYear.id)
        if (activeYear.weeks.length > 0) {
          const now = new Date()
          const currentWeek = activeYear.weeks.find((w: Week) => {
            const weekDate = new Date(w.startDate)
            const nextWeek = new Date(weekDate)
            nextWeek.setDate(nextWeek.getDate() + 7)
            return now >= weekDate && now < nextWeek
          })
          if (currentWeek && !selectedWeekId) selectWeek(currentWeek.id)
          else if (!selectedWeekId && activeYear.weeks.length > 0) selectWeek(activeYear.weeks[activeYear.weeks.length - 1].id)
        }
      }
    } catch (error) { console.error('Error fetching years:', error) }
    finally { setLoading(false) }
  }

  const currentYear = years.find(y => y.id === selectedAcademicYearId)
  const weeks = currentYear?.weeks || []
  const monthsMap = new Map<string, Week[]>()
  weeks.forEach(w => {
    if (!monthsMap.has(w.month)) monthsMap.set(w.month, [])
    monthsMap.get(w.month)!.push(w)
  })

  if (loading) return <div className="animate-pulse h-10 rounded-lg w-64" style={{ background: 'rgba(255,255,255,0.05)' }} />

  if (years.length === 0) {
    return <div className="text-sm" style={{ color: 'rgba(255,215,0,0.7)' }}>No hay años académicos configurados.</div>
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select
        value={selectedAcademicYearId || ''}
        onValueChange={(val) => { selectAcademicYear(val); selectWeek(null) }}
      >
        <SelectTrigger className="w-40 text-sm" style={selectStyle}>
          <SelectValue placeholder="Año académico" />
        </SelectTrigger>
        <SelectContent style={{ background: '#0a0a2e', border: '1px solid rgba(100,100,200,0.3)' }}>
          {years.map(y => (
            <SelectItem key={y.id} value={y.id} style={{ color: '#ffffff' }}>{y.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedWeekId || ''} onValueChange={(val) => selectWeek(val)}>
        <SelectTrigger className="w-56 text-sm" style={selectStyle}>
          <SelectValue placeholder="Seleccionar semana" />
        </SelectTrigger>
        <SelectContent style={{ background: '#0a0a2e', border: '1px solid rgba(100,100,200,0.3)', maxHeight: '320px' }}>
          {Array.from(monthsMap.entries()).map(([month, monthWeeks]) => (
            <div key={month}>
              <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,215,0,0.8)', background: 'rgba(255,255,255,0.05)' }}>
                {month}
              </div>
              {monthWeeks.map(w => (
                <SelectItem key={w.id} value={w.id} className="text-sm" style={{ color: '#ffffff' }}>
                  Semana {w.weekNumber}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
