import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth'

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

    const users = await db.user.findMany({
      include: {
        adminCriteria: { include: { criteria: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(users.map(u => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      adminCriteria: u.adminCriteria.map(ac => ({
        criteriaId: ac.criteriaId,
        criteriaName: ac.criteria.name,
      })),
      createdAt: u.createdAt,
    })))
  } catch (error) {
    console.error('Get users error:', error)
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

    const { username, password, name, role, criteriaIds } = await req.json()
    if (!username || !password || !name || !role) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role,
        ...(role === 'ADMIN' && criteriaIds?.length
          ? {
              adminCriteria: {
                create: criteriaIds.map((criteriaId: string) => ({ criteriaId })),
              },
            }
          : {}),
      },
      include: { adminCriteria: true },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      adminCriteria: user.adminCriteria.map(ac => ({ criteriaId: ac.criteriaId })),
    }, { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
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

    const { id, username, password, name, role, criteriaIds } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: { username?: string; password?: string; name?: string; role?: string } = {}
    if (username) data.username = username
    if (password) data.password = await hashPassword(password)
    if (name) data.name = name
    if (role) data.role = role

    // Update admin criteria if provided
    if (criteriaIds !== undefined) {
      await db.adminCriteria.deleteMany({ where: { adminId: id } })
      if (criteriaIds.length > 0) {
        await db.adminCriteria.createMany({
          data: criteriaIds.map((criteriaId: string) => ({ adminId: id, criteriaId })),
        })
      }
    }

    const user = await db.user.update({
      where: { id },
      data,
      include: { adminCriteria: true },
    })

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      adminCriteria: user.adminCriteria.map(ac => ({ criteriaId: ac.criteriaId })),
    })
  } catch (error) {
    console.error('Update user error:', error)
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

    // Prevent deleting self
    if (id === payload.userId) {
      return NextResponse.json({ error: 'No puede eliminarse a sí mismo' }, { status: 400 })
    }

    await db.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
