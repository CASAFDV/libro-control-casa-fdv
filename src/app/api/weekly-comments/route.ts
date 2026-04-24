import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const weekId = searchParams.get('weekId')

    const where: Record<string, string> = {}
    if (studentId) where.studentId = studentId
    if (weekId) where.weekId = weekId

    const comments = await db.weeklyComment.findMany({
      where,
      include: { student: true, week: true },
    })
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Get weekly comments error:', error)
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

    const { studentId, weekId, comment } = await req.json()
    if (!studentId || !weekId) {
      return NextResponse.json({ error: 'studentId y weekId requeridos' }, { status: 400 })
    }

    const weeklyComment = await db.weeklyComment.upsert({
      where: {
        studentId_weekId: { studentId, weekId },
      },
      update: {
        comment: comment || '',
        createdBy: payload.userId,
      },
      create: {
        studentId,
        weekId,
        comment: comment || '',
        createdBy: payload.userId,
      },
    })

    return NextResponse.json(weeklyComment, { status: 201 })
  } catch (error) {
    console.error('Create weekly comment error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
