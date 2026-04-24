'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import Header from '@/components/app/Header'
import MainRanking from '@/components/app/MainRanking'
import FamilyDetail from '@/components/app/FamilyDetail'
import StudentDetail from '@/components/app/StudentDetail'
import SuperAdminDashboard from '@/components/app/SuperAdminDashboard'
import AdminDashboard from '@/components/app/AdminDashboard'

export default function Home() {
  const { currentView, authToken, setAuth } = useAppStore()

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const user = await res.json()
            setAuth(token, user)
          } else {
            localStorage.removeItem('authToken')
            setAuth(null, null)
          }
        } catch {
          localStorage.removeItem('authToken')
          setAuth(null, null)
        }
      }
    }
    checkAuth()
  }, [])

  // Initialize seed data if no families exist
  useEffect(() => {
    const initializeIfEmpty = async () => {
      try {
        const res = await fetch('/api/families')
        const families = await res.json()
        if (families.length === 0) {
          // Auto-seed
          const seedRes = await fetch('/api/seed', { method: 'POST' })
          if (seedRes.ok) {
            console.log('Database seeded successfully')
          }
        }
      } catch (error) {
        console.error('Error checking initial data:', error)
      }
    }
    initializeIfEmpty()
  }, [])

  const renderView = () => {
    switch (currentView) {
      case 'family':
        return <FamilyDetail />
      case 'student':
        return <StudentDetail />
      case 'super-admin':
        return <SuperAdminDashboard />
      case 'admin-dashboard':
        return <AdminDashboard />
      case 'main':
      default:
        return <MainRanking />
    }
  }

  return (
    <div className="min-h-screen metallic-bg">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderView()}
      </main>
      <footer className="mt-auto py-4 text-center text-xs text-white/20 border-t border-white/5">
        LIBRO CONTROL CASA FDV © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
