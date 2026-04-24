import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const years = await db.academicYear.findMany({
      include: { weeks: { orderBy: { weekNumber: 'asc' } } },
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(years)
  } catch (error) {
    console.error('Get years error:', error)
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
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { name, startDate, endDate } = await req.json()
    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const year = await db.academicYear.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
    })

    // Generate weeks from startDate to endDate, every Sunday
    const start = new Date(startDate)
    const end = new Date(endDate)
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    // Find first Sunday on or after start
    const current = new Date(start)
    while (current.getDay() !== 0) {
      current.setDate(current.getDate() + 1)
    }

    let weekNumber = 1
    const weeks = []
    while (current <= end) {
      const monthLabel = `${months[current.getMonth()]} ${current.getFullYear()}`
      weeks.push({
        academicYearId: year.id,
        weekNumber,
        startDate: new Date(current),
        label: `Semana ${weekNumber} - ${monthLabel}`,
        month: monthLabel,
      })
      weekNumber++
      current.setDate(current.getDate() + 7)
    }

    if (weeks.length > 0) {
      await db.week.createMany({ data: weeks })
    }

    const result = await db.academicYear.findUnique({
      where: { id: year.id },
      include: { weeks: { orderBy: { weekNumber: 'asc' } } },
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create year error:', error)
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
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const { id, name, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: { name?: string; isActive?: boolean } = {}
    if (name !== undefined) data.name = name
    if (isActive !== undefined) data.isActive = isActive

    const year = await db.academicYear.update({
      where: { id },
      data,
    })
    return NextResponse.json(year)
  } catch (error) {
    console.error('Update year error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await db.academicYear.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete year error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
