import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const weekId = searchParams.get('weekId')
    const familyId = searchParams.get('familyId')

    const where: Record<string, string> = {}
    if (studentId) where.studentId = studentId
    if (weekId) where.weekId = weekId

    if (familyId) {
      const students = await db.student.findMany({
        where: { familyId },
        select: { id: true },
      })
      const studentIds = students.map(s => s.id)
      const grades = await db.grade.findMany({
        where: {
          ...where,
          studentId: { in: studentIds },
        },
        include: {
          student: true,
          criteria: true,
          week: true,
        },
      })
      return NextResponse.json(grades)
    }

    const grades = await db.grade.findMany({
      where,
      include: {
        student: true,
        criteria: true,
        week: true,
      },
    })
    return NextResponse.json(grades)
  } catch (error) {
    console.error('Get grades error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { grades } = await req.json()
    // grades: Array of { studentId, criteriaId, weekId, score, comment }

    if (!Array.isArray(grades)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    }

    // Verify admin has permission for criteria
    if (payload.role === 'ADMIN') {
      const adminCriteria = await db.adminCriteria.findMany({
        where: { adminId: payload.userId },
        select: { criteriaId: true },
      })
      const allowedIds = new Set(adminCriteria.map(ac => ac.criteriaId))

      for (const g of grades) {
        if (!allowedIds.has(g.criteriaId)) {
          return NextResponse.json({ error: `Sin permiso para criterio: ${g.criteriaId}` }, { status: 403 })
        }
      }
    }

    // Upsert grades
    const results = []
    for (const g of grades) {
      const grade = await db.grade.upsert({
        where: {
          studentId_criteriaId_weekId: {
            studentId: g.studentId,
            criteriaId: g.criteriaId,
            weekId: g.weekId,
          },
        },
        update: {
          score: Math.min(20, Math.max(0, g.score)),
          comment: g.comment || '',
          gradedBy: payload.userId,
        },
        create: {
          studentId: g.studentId,
          criteriaId: g.criteriaId,
          weekId: g.weekId,
          score: Math.min(20, Math.max(0, g.score)),
          comment: g.comment || '',
          gradedBy: payload.userId,
        },
        include: { criteria: true, student: true },
      })
      results.push(grade)
    }

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error('Create grades error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { id, score, comment } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Verify admin has permission
    if (payload.role === 'ADMIN') {
      const grade = await db.grade.findUnique({ where: { id } })
      if (!grade) {
        return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
      }
      const adminCriteria = await db.adminCriteria.findMany({
        where: { adminId: payload.userId, criteriaId: grade.criteriaId },
      })
      if (adminCriteria.length === 0) {
        return NextResponse.json({ error: 'Sin permiso para este criterio' }, { status: 403 })
      }
    }

    const data: { score?: number; comment?: string; gradedBy?: string } = { gradedBy: payload.userId }
    if (score !== undefined) data.score = Math.min(20, Math.max(0, score))
    if (comment !== undefined) data.comment = comment

    const updated = await db.grade.update({
      where: { id },
      data,
      include: { criteria: true, student: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update grade error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
