import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET /api/backup — Export all data as JSON (SUPER_ADMIN only)
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const [users, families, students, criteria, academicYears, weeks, grades, weeklyComments] = await Promise.all([
      db.user.findMany({ include: { adminCriteria: true } }),
      db.family.findMany({ include: { students: true } }),
      db.student.findMany(),
      db.criteria.findMany(),
      db.academicYear.findMany(),
      db.week.findMany(),
      db.grade.findMany(),
      db.weeklyComment.findMany(),
    ])

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        users: users.map(u => ({ ...u, password: u.password })), // keep hashed passwords
        families: families.map(f => ({ ...f, students: undefined })),
        students,
        criteria,
        academicYears,
        weeks,
        grades,
        weeklyComments,
      }
    }

    return NextResponse.json(backup)
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// POST /api/backup — Import data from JSON backup (SUPER_ADMIN only)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.version || !body.data) {
      return NextResponse.json({ error: 'Formato de backup inválido' }, { status: 400 })
    }

    const { data } = body
    const results = { users: 0, families: 0, students: 0, criteria: 0, academicYears: 0, weeks: 0, grades: 0, weeklyComments: 0 }

    // Restore in order (respecting foreign keys)
    // 1. Criteria
    if (data.criteria) {
      for (const item of data.criteria) {
        await db.criteria.upsert({
          where: { id: item.id },
          update: { name: item.name, isActive: item.isActive, order: item.order },
          create: { id: item.id, name: item.name, isActive: item.isActive, order: item.order },
        })
        results.criteria++
      }
    }

    // 2. Families
    if (data.families) {
      for (const item of data.families) {
        await db.family.upsert({
          where: { id: item.id },
          update: { name: item.name, color: item.color },
          create: { id: item.id, name: item.name, color: item.color },
        })
        results.families++
      }
    }

    // 3. Students
    if (data.students) {
      for (const item of data.students) {
        await db.student.upsert({
          where: { id: item.id },
          update: { name: item.name, familyId: item.familyId },
          create: { id: item.id, name: item.name, familyId: item.familyId },
        })
        results.students++
      }
    }

    // 4. Academic Years
    if (data.academicYears) {
      for (const item of data.academicYears) {
        await db.academicYear.upsert({
          where: { id: item.id },
          update: { name: item.name, startDate: new Date(item.startDate), endDate: new Date(item.endDate), isActive: item.isActive },
          create: { id: item.id, name: item.name, startDate: new Date(item.startDate), endDate: new Date(item.endDate), isActive: item.isActive },
        })
        results.academicYears++
      }
    }

    // 5. Weeks
    if (data.weeks) {
      for (const item of data.weeks) {
        await db.week.upsert({
          where: { id: item.id },
          update: { academicYearId: item.academicYearId, weekNumber: item.weekNumber, startDate: new Date(item.startDate), label: item.label, month: item.month },
          create: { id: item.id, academicYearId: item.academicYearId, weekNumber: item.weekNumber, startDate: new Date(item.startDate), label: item.label, month: item.month },
        })
        results.weeks++
      }
    }

    // 6. Users
    if (data.users) {
      for (const item of data.users) {
        await db.user.upsert({
          where: { id: item.id },
          update: { username: item.username, password: item.password, name: item.name, role: item.role },
          create: { id: item.id, username: item.username, password: item.password, name: item.name, role: item.role },
        })
        results.users++
      }
    }

    // 7. Grades
    if (data.grades) {
      for (const item of data.grades) {
        await db.grade.upsert({
          where: { id: item.id },
          update: { studentId: item.studentId, criteriaId: item.criteriaId, weekId: item.weekId, score: item.score, comment: item.comment || '', gradedBy: item.gradedBy },
          create: { id: item.id, studentId: item.studentId, criteriaId: item.criteriaId, weekId: item.weekId, score: item.score, comment: item.comment || '', gradedBy: item.gradedBy },
        })
        results.grades++
      }
    }

    // 8. Weekly Comments
    if (data.weeklyComments) {
      for (const item of data.weeklyComments) {
        await db.weeklyComment.upsert({
          where: { id: item.id },
          update: { studentId: item.studentId, weekId: item.weekId, comment: item.comment, createdBy: item.createdBy },
          create: { id: item.id, studentId: item.studentId, weekId: item.weekId, comment: item.comment, createdBy: item.createdBy },
        })
        results.weeklyComments++
      }
    }

    return NextResponse.json({ message: 'Backup restaurado correctamente', results })
  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
