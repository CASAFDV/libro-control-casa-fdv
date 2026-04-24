import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const token = await createToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    })

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
