import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET() {
  try {
    const families = await db.family.findMany({
      include: { students: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(families)
  } catch (error) {
    console.error('Get families error:', error)
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

    const { name, color } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    }

    const family = await db.family.create({
      data: { name, color: color || '#3b82f6' },
    })
    return NextResponse.json(family, { status: 201 })
  } catch (error) {
    console.error('Create family error:', error)
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

    const { id, name, color } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const family = await db.family.update({
      where: { id },
      data: { name, color },
    })
    return NextResponse.json(family)
  } catch (error) {
    console.error('Update family error:', error)
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

    await db.family.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete family error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
