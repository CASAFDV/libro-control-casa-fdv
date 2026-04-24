'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ArrowLeft, Users, Plus, Pencil, Trash2, UserPlus, BookOpen, Calendar, Shield, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Family { id: string; name: string; color: string; students: { id: string; name: string }[] }
interface Student { id: string; name: string; familyId: string; family: { id: string; name: string } }
interface Criteria { id: string; name: string; isActive: boolean; order: number }
interface AdminUser { id: string; username: string; name: string; role: string; adminCriteria: { criteriaId: string; criteriaName: string }[] }
interface AcademicYear { id: string; name: string; startDate: string; endDate: string; isActive: boolean; weeks: { id: string; weekNumber: number; label: string }[] }

export default function SuperAdminDashboard() {
  const { authToken, setView } = useAppStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('families')

  const headers = { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' }

  // Families
  const [families, setFamilies] = useState<Family[]>([])
  const [familyDialog, setFamilyDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; family?: Family }>({ open: false, mode: 'create' })
  const [familyName, setFamilyName] = useState('')
  const [familyColor, setFamilyColor] = useState('#dc2626')

  // Students
  const [students, setStudents] = useState<Student[]>([])
  const [studentDialog, setStudentDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; student?: Student }>({ open: false, mode: 'create' })
  const [studentName, setStudentName] = useState('')
  const [studentFamilyId, setStudentFamilyId] = useState('')

  // Criteria
  const [criteria, setCriteria] = useState<Criteria[]>([])
  const [criteriaDialog, setCriteriaDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; criteria?: Criteria }>({ open: false, mode: 'create' })
  const [criteriaName, setCriteriaName] = useState('')

  // Users/Admins
  const [users, setUsers] = useState<AdminUser[]>([])
  const [userDialog, setUserDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; user?: AdminUser }>({ open: false, mode: 'create' })
  const [userForm, setUserForm] = useState({ username: '', password: '', name: '', role: 'ADMIN', criteriaIds: [] as string[] })

  // Years
  const [years, setYears] = useState<AcademicYear[]>([])
  const [yearDialog, setYearDialog] = useState<{ open: boolean; mode: 'create' | 'edit'; year?: AcademicYear }>({ open: false, mode: 'create' })
  const [yearForm, setYearForm] = useState({ name: '', startDate: '', endDate: '' })

  const loadData = useCallback(async () => {
    try {
      const [familiesRes, studentsRes, criteriaRes, usersRes, yearsRes] = await Promise.all([
        fetch('/api/families'),
        fetch('/api/students'),
        fetch('/api/criteria'),
        fetch('/api/users', { headers }),
        fetch('/api/years'),
      ])
      setFamilies(await familiesRes.json())
      setStudents(await studentsRes.json())
      setCriteria(await criteriaRes.json())
      setUsers(await usersRes.json())
      setYears(await yearsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }, [authToken])

  useEffect(() => {
    if (authToken) loadData()
  }, [authToken, loadData])

  // FAMILY ACTIONS
  const saveFamily = async () => {
    try {
      const url = familyDialog.mode === 'create' ? '/api/families' : '/api/families'
      const method = familyDialog.mode === 'create' ? 'POST' : 'PUT'
      const body = familyDialog.mode === 'edit' && familyDialog.family
        ? { id: familyDialog.family.id, name: familyName, color: familyColor }
        : { name: familyName, color: familyColor }
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Error al guardar familia')
      toast({ title: familyDialog.mode === 'create' ? 'Familia creada' : 'Familia actualizada' })
      setFamilyDialog({ open: false, mode: 'create' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const deleteFamily = async (id: string) => {
    if (!confirm('¿Eliminar esta familia y todos sus estudiantes?')) return
    try {
      await fetch(`/api/families?id=${id}`, { method: 'DELETE', headers })
      toast({ title: 'Familia eliminada' })
      loadData()
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  // STUDENT ACTIONS
  const saveStudent = async () => {
    try {
      const body = studentDialog.mode === 'edit' && studentDialog.student
        ? { id: studentDialog.student.id, name: studentName, familyId: studentFamilyId }
        : { name: studentName, familyId: studentFamilyId }
      const method = studentDialog.mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch('/api/students', { method, headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Error al guardar estudiante')
      toast({ title: studentDialog.mode === 'create' ? 'Estudiante creado' : 'Estudiante actualizado' })
      setStudentDialog({ open: false, mode: 'create' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const deleteStudent = async (id: string) => {
    if (!confirm('¿Eliminar este estudiante?')) return
    try {
      await fetch(`/api/students?id=${id}`, { method: 'DELETE', headers })
      toast({ title: 'Estudiante eliminado' })
      loadData()
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  // CRITERIA ACTIONS
  const saveCriteria = async () => {
    try {
      const body = criteriaDialog.mode === 'edit' && criteriaDialog.criteria
        ? { id: criteriaDialog.criteria.id, name: criteriaName }
        : { name: criteriaName }
      const method = criteriaDialog.mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch('/api/criteria', { method, headers, body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast({ title: criteriaDialog.mode === 'create' ? 'Criterio creado' : 'Criterio actualizado' })
      setCriteriaDialog({ open: false, mode: 'create' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const toggleCriteria = async (c: Criteria) => {
    try {
      const res = await fetch('/api/criteria', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const deleteCriteria = async (id: string) => {
    if (!confirm('¿Eliminar este criterio? Se eliminarán todas las notas asociadas.')) return
    try {
      await fetch(`/api/criteria?id=${id}`, { method: 'DELETE', headers })
      toast({ title: 'Criterio eliminado' })
      loadData()
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  // USER ACTIONS
  const saveUser = async () => {
    try {
      const body = userDialog.mode === 'edit' && userDialog.user
        ? { id: userDialog.user.id, ...userForm, criteriaIds: userForm.role === 'ADMIN' ? userForm.criteriaIds : [] }
        : { ...userForm, criteriaIds: userForm.role === 'ADMIN' ? userForm.criteriaIds : [] }
      const method = userDialog.mode === 'create' ? 'POST' : 'PUT'
      const res = await fetch('/api/users', { method, headers, body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      toast({ title: userDialog.mode === 'create' ? 'Usuario creado' : 'Usuario actualizado' })
      setUserDialog({ open: false, mode: 'create' })
      setUserForm({ username: '', password: '', name: '', role: 'ADMIN', criteriaIds: [] })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('¿Eliminar este usuario?')) return
    try {
      await fetch(`/api/users?id=${id}`, { method: 'DELETE', headers })
      toast({ title: 'Usuario eliminado' })
      loadData()
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  // YEAR ACTIONS
  const saveYear = async () => {
    try {
      const method = yearDialog.mode === 'create' ? 'POST' : 'PUT'
      const body = yearDialog.mode === 'edit' && yearDialog.year
        ? { id: yearDialog.year.id, name: yearForm.name }
        : yearForm
      const res = await fetch('/api/years', { method, headers, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Error al guardar año')
      toast({ title: yearDialog.mode === 'create' ? 'Año creado con semanas' : 'Año actualizado' })
      setYearDialog({ open: false, mode: 'create' })
      setYearForm({ name: '', startDate: '', endDate: '' })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const deleteYear = async (id: string) => {
    if (!confirm('¿Eliminar este año y todas sus semanas y notas?')) return
    try {
      await fetch(`/api/years?id=${id}`, { method: 'DELETE', headers })
      toast({ title: 'Año eliminado' })
      loadData()
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' })
    }
  }

  const toggleYear = async (y: AcademicYear) => {
    try {
      await fetch('/api/years', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id: y.id, isActive: !y.isActive }),
      })
      loadData()
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    }
  }

  const activeCriteria = criteria.filter(c => c.isActive)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView('main')} className="text-white/60 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-400" />
            Panel Super Administrador
          </h2>
        </div>
        <Button
          onClick={async () => {
            if (!confirm('¿Inicializar la base de datos? Esto creará el super admin y datos por defecto.')) return
            const res = await fetch('/api/seed', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
              toast({ title: 'Base de datos inicializada', description: `Usuario: ${data.superAdmin.username} / ${data.superAdmin.password}` })
              loadData()
            } else {
              toast({ title: 'Error', description: data.error, variant: 'destructive' })
            }
          }}
          className="metallic-yellow text-black border-0 text-sm"
          size="sm"
        >
          Inicializar BD
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="families" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60 text-xs">
            <Users className="h-3 w-3 mr-1" />Familias
          </TabsTrigger>
          <TabsTrigger value="students" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60 text-xs">
            <UserPlus className="h-3 w-3 mr-1" />Estudiantes
          </TabsTrigger>
          <TabsTrigger value="criteria" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60 text-xs">
            <BookOpen className="h-3 w-3 mr-1" />Criterios
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60 text-xs">
            <Shield className="h-3 w-3 mr-1" />Admins
          </TabsTrigger>
          <TabsTrigger value="years" className="data-[state=active]:metallic-red data-[state=active]:text-white text-white/60 text-xs">
            <Calendar className="h-3 w-3 mr-1" />Años
          </TabsTrigger>
        </TabsList>

        {/* FAMILIES TAB */}
        <TabsContent value="families">
          <Card className="metallic-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Familias</CardTitle>
              <Dialog open={familyDialog.open} onOpenChange={(open) => setFamilyDialog({ open, mode: 'create' })}>
                <DialogTrigger asChild>
                  <Button size="sm" className="metallic-red text-white border-0"><Plus className="h-4 w-4 mr-1" />Nueva</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a2e] border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>{familyDialog.mode === 'create' ? 'Nueva Familia' : 'Editar Familia'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/70">Nombre</Label>
                      <Input value={familyName} onChange={e => setFamilyName(e.target.value)} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={familyColor} onChange={e => setFamilyColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <Input value={familyColor} onChange={e => setFamilyColor(e.target.value)} className="bg-white/5 border-white/20 text-white flex-1" />
                      </div>
                    </div>
                    <Button onClick={saveFamily} className="w-full metallic-red text-white border-0">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {families.length === 0 ? (
                <p className="text-white/40 text-center py-8">No hay familias. Cree una o inicialice la BD.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {families.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full" style={{ background: f.color }} />
                        <div>
                          <p className="text-white font-medium">{f.name}</p>
                          <p className="text-xs text-white/40">{f.students.length} estudiante(s)</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-yellow-400" onClick={() => {
                          setFamilyName(f.name)
                          setFamilyColor(f.color)
                          setFamilyDialog({ open: true, mode: 'edit', family: f })
                        }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400" onClick={() => deleteFamily(f.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STUDENTS TAB */}
        <TabsContent value="students">
          <Card className="metallic-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Estudiantes</CardTitle>
              <Dialog open={studentDialog.open} onOpenChange={(open) => setStudentDialog({ open, mode: 'create' })}>
                <DialogTrigger asChild>
                  <Button size="sm" className="metallic-red text-white border-0"><Plus className="h-4 w-4 mr-1" />Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a2e] border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>{studentDialog.mode === 'create' ? 'Nuevo Estudiante' : 'Editar Estudiante'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/70">Nombre</Label>
                      <Input value={studentName} onChange={e => setStudentName(e.target.value)} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Familia</Label>
                      <Select value={studentFamilyId} onValueChange={setStudentFamilyId}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue placeholder="Seleccionar familia" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a0a2e] border-white/20">
                          {families.map(f => (
                            <SelectItem key={f.id} value={f.id} className="text-white focus:bg-white/10">{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveStudent} className="w-full metallic-red text-white border-0">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {families.length === 0 ? (
                <p className="text-white/40 text-center py-8">Primero debe crear familias.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {families.map(f => (
                    <div key={f.id}>
                      <h4 className="text-sm font-semibold text-white/60 mb-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: f.color }} />
                        {f.name}
                      </h4>
                      {students.filter(s => s.familyId === f.id).map(s => (
                        <div key={s.id} className="flex items-center justify-between py-2 px-3 ml-4 rounded-lg hover:bg-white/5 transition-all">
                          <span className="text-white/80">{s.name}</span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-white/50 hover:text-yellow-400 h-7 w-7 p-0" onClick={() => {
                              setStudentName(s.name)
                              setStudentFamilyId(s.familyId)
                              setStudentDialog({ open: true, mode: 'edit', student: s })
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400 h-7 w-7 p-0" onClick={() => deleteStudent(s.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CRITERIA TAB */}
        <TabsContent value="criteria">
          <Card className="metallic-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Criterios de Evaluación ({activeCriteria.length}/12 activos)</CardTitle>
              <Dialog open={criteriaDialog.open} onOpenChange={(open) => setCriteriaDialog({ open, mode: 'create' })}>
                <DialogTrigger asChild>
                  <Button size="sm" className="metallic-red text-white border-0" disabled={activeCriteria.length >= 12}>
                    <Plus className="h-4 w-4 mr-1" />Nuevo
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a2e] border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>{criteriaDialog.mode === 'create' ? 'Nuevo Criterio' : 'Editar Criterio'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/70">Nombre</Label>
                      <Input value={criteriaName} onChange={e => setCriteriaName(e.target.value)} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <Button onClick={saveCriteria} className="w-full metallic-red text-white border-0">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {criteria.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={() => toggleCriteria(c)}
                      />
                      <span className={c.isActive ? 'text-white' : 'text-white/40'}>{c.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-yellow-400 h-7 w-7 p-0" onClick={() => {
                        setCriteriaName(c.name)
                        setCriteriaDialog({ open: true, mode: 'edit', criteria: c })
                      }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400 h-7 w-7 p-0" onClick={() => deleteCriteria(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <Card className="metallic-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Administradores</CardTitle>
              <Dialog open={userDialog.open} onOpenChange={(open) => { setUserDialog({ open, mode: 'create' }); setUserForm({ username: '', password: '', name: '', role: 'ADMIN', criteriaIds: [] }) }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="metallic-red text-white border-0"><Plus className="h-4 w-4 mr-1" />Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a2e] border-white/20 text-white max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{userDialog.mode === 'create' ? 'Nuevo Administrador' : 'Editar Administrador'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/70">Nombre completo</Label>
                      <Input value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Usuario</Label>
                      <Input value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">{userDialog.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (dejar vacío para no cambiar)'}</Label>
                      <Input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Rol</Label>
                      <Select value={userForm.role} onValueChange={(val) => setUserForm({...userForm, role: val, criteriaIds: val === 'SUPER_ADMIN' ? [] : userForm.criteriaIds})}>
                        <SelectTrigger className="bg-white/5 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a0a2e] border-white/20">
                          <SelectItem value="ADMIN" className="text-white focus:bg-white/10">Administrador</SelectItem>
                          <SelectItem value="SUPER_ADMIN" className="text-white focus:bg-white/10">Super Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {userForm.role === 'ADMIN' && (
                      <div>
                        <Label className="text-white/70">Criterios que puede calificar</Label>
                        <div className="space-y-2 mt-2">
                          {criteria.filter(c => c.isActive).map(c => (
                            <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={userForm.criteriaIds.includes(c.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setUserForm({...userForm, criteriaIds: [...userForm.criteriaIds, c.id]})
                                  } else {
                                    setUserForm({...userForm, criteriaIds: userForm.criteriaIds.filter(id => id !== c.id)})
                                  }
                                }}
                                className="rounded border-white/30"
                              />
                              <span className="text-white/70 text-sm">{c.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button onClick={saveUser} className="w-full metallic-red text-white border-0">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-xs text-white/40">@{u.username} · {u.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '📋 Admin'}</p>
                      {u.role === 'ADMIN' && u.adminCriteria.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {u.adminCriteria.map(ac => (
                            <span key={ac.criteriaId} className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded">
                              {ac.criteriaName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-yellow-400" onClick={() => {
                        setUserForm({
                          username: u.username,
                          password: '',
                          name: u.name,
                          role: u.role,
                          criteriaIds: u.adminCriteria.map(ac => ac.criteriaId),
                        })
                        setUserDialog({ open: true, mode: 'edit', user: u })
                      }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400" onClick={() => deleteUser(u.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* YEARS TAB */}
        <TabsContent value="years">
          <Card className="metallic-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Años Académicos</CardTitle>
              <Dialog open={yearDialog.open} onOpenChange={(open) => setYearDialog({ open, mode: 'create' })}>
                <DialogTrigger asChild>
                  <Button size="sm" className="metallic-red text-white border-0"><Plus className="h-4 w-4 mr-1" />Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a2e] border-white/20 text-white">
                  <DialogHeader>
                    <DialogTitle>{yearDialog.mode === 'create' ? 'Nuevo Año Académico' : 'Editar Año'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label className="text-white/70">Nombre (ej: 2026-2027)</Label>
                      <Input value={yearForm.name} onChange={e => setYearForm({...yearForm, name: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                    </div>
                    {yearDialog.mode === 'create' && (
                      <>
                        <div>
                          <Label className="text-white/70">Fecha inicio (las semanas comienzan en domingo)</Label>
                          <Input type="date" value={yearForm.startDate} onChange={e => setYearForm({...yearForm, startDate: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                        </div>
                        <div>
                          <Label className="text-white/70">Fecha fin</Label>
                          <Input type="date" value={yearForm.endDate} onChange={e => setYearForm({...yearForm, endDate: e.target.value})} className="bg-white/5 border-white/20 text-white" />
                        </div>
                      </>
                    )}
                    <Button onClick={saveYear} className="w-full metallic-red text-white border-0">Guardar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {years.map(y => (
                  <div key={y.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{y.name}</p>
                        {y.isActive && <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Activo</span>}
                      </div>
                      <p className="text-xs text-white/40">{y.weeks.length} semanas</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      <Switch checked={y.isActive} onCheckedChange={() => toggleYear(y)} />
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-yellow-400 h-7 w-7 p-0" onClick={() => {
                        setYearForm({ name: y.name, startDate: '', endDate: '' })
                        setYearDialog({ open: true, mode: 'edit', year: y })
                      }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white/50 hover:text-red-400 h-7 w-7 p-0" onClick={() => deleteYear(y.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
