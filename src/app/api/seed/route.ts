import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST() {
  try {
    // Check if super admin already exists
    const existingAdmin = await db.user.findFirst({ where: { role: 'SUPER_ADMIN' } })
    if (existingAdmin) {
      return NextResponse.json({ error: 'Ya existe un super administrador' }, { status: 400 })
    }

    // Create super admin
    const hashedPassword = await hashPassword('admin123')
    const superAdmin = await db.user.create({
      data: {
        username: 'superadmin',
        password: hashedPassword,
        name: 'Super Administrador',
        role: 'SUPER_ADMIN',
      },
    })

    // Create default criteria
    const defaultCriteria = [
      'Asistencia',
      'Puntualidad',
      'Mayordomía',
      'Presentación I',
      'Presentación II',
      'Conducta',
      'Consagración',
      'ONG',
      'Iglesia',
    ]

    const criteria = []
    for (let i = 0; i < defaultCriteria.length; i++) {
      const c = await db.criteria.create({
        data: { name: defaultCriteria[i], isActive: true, order: i },
      })
      criteria.push(c)
    }

    // Create default academic year 2026-2027
    const startDate = new Date('2026-04-05') // First Sunday of April 2026
    const endDate = new Date('2027-04-25')   // Last Sunday of April 2027
    const year = await db.academicYear.create({
      data: {
        name: '2026-2027',
        startDate,
        endDate,
        isActive: true,
      },
    })

    // Generate weeks
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const current = new Date(startDate)
    let weekNumber = 1
    const weeksData = []

    while (current <= endDate) {
      const monthLabel = `${months[current.getMonth()]} ${current.getFullYear()}`
      weeksData.push({
        academicYearId: year.id,
        weekNumber,
        startDate: new Date(current),
        label: `Semana ${weekNumber} - ${monthLabel}`,
        month: monthLabel,
      })
      weekNumber++
      current.setDate(current.getDate() + 7)
    }

    if (weeksData.length > 0) {
      await db.week.createMany({ data: weeksData })
    }

    // Create sample families
    const sampleFamilies = [
      { name: 'Familia Alfa', color: '#dc2626' },
      { name: 'Familia Beta', color: '#eab308' },
      { name: 'Familia Gamma', color: '#3b82f6' },
    ]

    for (const f of sampleFamilies) {
      await db.family.create({ data: f })
    }

    return NextResponse.json({
      message: 'Base de datos inicializada correctamente',
      superAdmin: { username: 'superadmin', password: 'admin123' },
      criteria: criteria.length,
      weeks: weeksData.length,
    }, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
