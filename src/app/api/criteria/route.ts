import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const criteria = await db.criteria.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(criteria)
  } catch (error) {
    console.error('Get criteria error:', error)
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

    const { name, isActive, order } = await req.json()

    // Check max 12 criteria
    const activeCount = await db.criteria.count({ where: { isActive: true } })
    if (isActive !== false && activeCount >= 12) {
      return NextResponse.json({ error: 'Máximo 12 criterios activos' }, { status: 400 })
    }

    const maxOrder = await db.criteria.aggregate({ _max: { order: true } })
    const nextOrder = order ?? (maxOrder._max.order ?? -1) + 1

    const criteria = await db.criteria.create({
      data: { name, isActive: isActive ?? true, order: nextOrder },
    })
    return NextResponse.json(criteria, { status: 201 })
  } catch (error) {
    console.error('Create criteria error:', error)
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

    const { id, name, isActive, order } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    // Check max 12 if activating
    if (isActive === true) {
      const current = await db.criteria.findUnique({ where: { id } })
      if (current && !current.isActive) {
        const activeCount = await db.criteria.count({ where: { isActive: true } })
        if (activeCount >= 12) {
          return NextResponse.json({ error: 'Máximo 12 criterios activos' }, { status: 400 })
        }
      }
    }

    const data: { name?: string; isActive?: boolean; order?: number } = {}
    if (name !== undefined) data.name = name
    if (isActive !== undefined) data.isActive = isActive
    if (order !== undefined) data.order = order

    const criteria = await db.criteria.update({
      where: { id },
      data,
    })
    return NextResponse.json(criteria)
  } catch (error) {
    console.error('Update criteria error:', error)
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

    await db.criteria.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete criteria error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
