import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
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

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        adminCriteria: { include: { criteria: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      adminCriteria: user.adminCriteria.map(ac => ({
        id: ac.criteriaId,
        name: ac.criteria.name,
      })),
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
