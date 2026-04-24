import { create } from 'zustand'

export type ViewType =
  | 'main'
  | 'family'
  | 'student'
  | 'admin-login'
  | 'super-admin'
  | 'admin-dashboard'

interface AppState {
  currentView: ViewType
  selectedFamilyId: string | null
  selectedStudentId: string | null
  selectedWeekId: string | null
  selectedAcademicYearId: string | null
  selectedMonth: string | null
  authToken: string | null
  authUser: { id: string; username: string; name: string; role: string; adminCriteria?: { id: string; name: string }[] } | null

  setView: (view: ViewType) => void
  selectFamily: (familyId: string) => void
  selectStudent: (studentId: string) => void
  selectWeek: (weekId: string | null) => void
  selectAcademicYear: (yearId: string | null) => void
  selectMonth: (month: string | null) => void
  setAuth: (token: string | null, user: AppState['authUser']) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'main',
  selectedFamilyId: null,
  selectedStudentId: null,
  selectedWeekId: null,
  selectedAcademicYearId: null,
  selectedMonth: null,
  authToken: typeof window !== 'undefined' ? localStorage.getItem('authToken') : null,
  authUser: null,

  setView: (view) => set({ currentView: view }),
  selectFamily: (familyId) => set({ selectedFamilyId: familyId, currentView: 'family' }),
  selectStudent: (studentId) => set({ selectedStudentId: studentId, currentView: 'student' }),
  selectWeek: (weekId) => set({ selectedWeekId: weekId }),
  selectAcademicYear: (yearId) => set({ selectedAcademicYearId: yearId }),
  selectMonth: (month) => set({ selectedMonth: month }),
  setAuth: (token, user) => {
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    set({ authToken: token, authUser: user })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    set({ authToken: null, authUser: null, currentView: 'main' })
  },
}))
