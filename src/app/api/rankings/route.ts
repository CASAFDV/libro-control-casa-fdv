import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weekId = searchParams.get('weekId')
    const month = searchParams.get('month')
    const academicYearId = searchParams.get('academicYearId')

    // Get active criteria
    const activeCriteria = await db.criteria.findMany({
      where: { isActive: true },
      select: { id: true },
    })
    const activeCriteriaIds = activeCriteria.map(c => c.id)
    const activeCriteriaCount = activeCriteriaIds.length

    if (activeCriteriaCount === 0) {
      return NextResponse.json({ families: [], students: [] })
    }

    // Build week filter
    let weekFilter: { id: string }[] | { month: string }[] = []
    if (weekId) {
      weekFilter = [{ id: weekId }]
    } else if (month && academicYearId) {
      weekFilter = [{ month }] as { month: string }[]
    }

    // Get all families with students
    const families = await db.family.findMany({
      include: { students: true },
      orderBy: { name: 'asc' },
    })

    const familyRankings = []

    for (const family of families) {
      const studentAverages = []

      for (const student of family.students) {
        let grades
        if (weekId) {
          grades = await db.grade.findMany({
            where: {
              studentId: student.id,
              weekId,
              criteriaId: { in: activeCriteriaIds },
            },
          })
        } else if (month && academicYearId) {
          // Get all weeks in the month for this academic year
          const weeksInMonth = await db.week.findMany({
            where: { academicYearId, month },
            select: { id: true },
          })
          const weekIds = weeksInMonth.map(w => w.id)

          grades = await db.grade.findMany({
            where: {
              studentId: student.id,
              weekId: { in: weekIds },
              criteriaId: { in: activeCriteriaIds },
            },
          })
        } else {
          grades = []
        }

        if (grades.length > 0) {
          // Calculate weekly average
          if (weekId) {
            const avg = grades.reduce((sum, g) => sum + g.score, 0) / activeCriteriaCount
            studentAverages.push({
              studentId: student.id,
              studentName: student.name,
              average: Math.round(avg * 100) / 100,
              grades: grades.map(g => ({
                criteriaId: g.criteriaId,
                score: g.score,
                comment: g.comment,
              })),
            })
          } else {
            // Monthly: average of weekly averages
            const weekIds = [...new Set(grades.map(g => g.weekId))]
            const weeklyAvgs = weekIds.map(wid => {
              const weekGrades = grades.filter(g => g.weekId === wid)
              return weekGrades.reduce((sum, g) => sum + g.score, 0) / activeCriteriaCount
            })
            const avg = weeklyAvgs.reduce((sum, a) => sum + a, 0) / weeklyAvgs.length
            studentAverages.push({
              studentId: student.id,
              studentName: student.name,
              average: Math.round(avg * 100) / 100,
              weeklyAverages: weeklyAvgs.map((a, i) => ({
                weekId: weekIds[i],
                average: Math.round(a * 100) / 100,
              })),
            })
          }
        }
      }

      if (studentAverages.length > 0) {
        const familyAverage = studentAverages.reduce((sum, s) => sum + s.average, 0) / studentAverages.length
        familyRankings.push({
          familyId: family.id,
          familyName: family.name,
          familyColor: family.color,
          average: Math.round(familyAverage * 100) / 100,
          students: studentAverages.sort((a, b) => b.average - a.average),
        })
      }
    }

    // Sort by average descending
    familyRankings.sort((a, b) => b.average - a.average)

    // Add rank
    familyRankings.forEach((f, i) => {
      f.rank = i + 1
    })

    return NextResponse.json({ families: familyRankings })
  } catch (error) {
    console.error('Get rankings error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
