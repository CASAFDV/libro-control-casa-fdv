'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { User, LogOut, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Header() {
  const { authUser, setAuth, logout, currentView, setView } = useAppStore()
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }
      setAuth(data.token, data.user)
      setShowLogin(false)
      setUsername('')
      setPassword('')
      if (data.user.role === 'SUPER_ADMIN') {
        setView('super-admin')
      } else {
        setView('admin-dashboard')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 metallic-header border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('main')}>
            <div className="w-10 h-10 rounded-full metallic-red flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide"
                  style={{ textShadow: '0 0 20px rgba(255,215,0,0.5), 2px 2px 4px rgba(0,0,0,0.5)' }}>
                LIBRO CONTROL CASA FDV
              </h1>
              <p className="text-xs text-white/60 hidden sm:block">Sistema de Control de Notas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <span className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                  {authUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '📋 Admin'}: {authUser.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
              title={authUser ? 'Panel de administración' : 'Iniciar sesión'}
            >
              <User className="h-4 w-4 text-white/80" />
            </button>
            {authUser && (
              <button
                onClick={() => setView(authUser.role === 'SUPER_ADMIN' ? 'super-admin' : 'admin-dashboard')}
                className="sm:hidden w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all border border-white/20"
                title="Panel"
              >
                <span className="text-xs text-white">⚙</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <Card className="w-full max-w-md mx-4 metallic-card border-white/20" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-lg">
                {authUser ? 'Sesión Activa' : 'Iniciar Sesión'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowLogin(false)} className="text-white/60 hover:text-white">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {authUser ? (
                <div className="space-y-4">
                  <p className="text-white/70">Conectado como <strong className="text-white">{authUser.name}</strong></p>
                  <p className="text-xs text-white/50">Rol: {authUser.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowLogin(false)
                        setView(authUser.role === 'SUPER_ADMIN' ? 'super-admin' : 'admin-dashboard')
                      }}
                      className="flex-1 metallic-red text-white border-0"
                    >
                      Ir al Panel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        logout()
                        setShowLogin(false)
                      }}
                      className="border-white/20 text-white/70 hover:text-white"
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Usuario</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/30"
                      placeholder="Ingrese su usuario"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Contraseña</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-10"
                        placeholder="Ingrese su contraseña"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full metallic-red text-white border-0 font-semibold"
                  >
                    {loading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
