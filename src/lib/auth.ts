import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'libro-control-casa-fdv-secret-key-2026'
const SECRET = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: { userId: string; username: string; role: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { userId: string; username: string; role: string }
  } catch {
    return null
  }
}

export function getScoreColor(score: number): string {
  if (score < 9.5) return '#1a1a1a'       // Negro
  if (score < 12.5) return '#dc2626'       // Rojo
  if (score < 16.5) return '#eab308'       // Amarillo
  if (score < 17.5) return '#3b82f6'       // Azul
  return '#22c55e'                          // Verde
}

export function getScoreLabel(score: number): string {
  if (score < 9.5) return 'Negro'
  if (score < 12.5) return 'Rojo'
  if (score < 16.5) return 'Amarillo'
  if (score < 17.5) return 'Azul'
  return 'Verde'
}
