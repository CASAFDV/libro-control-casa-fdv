'use client'

import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { User, LogOut, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Header() {
  const { authUser, setAuth, logout, setView } = useAppStore()
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
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'linear-gradient(135deg, #8b0000 0%, #dc143c 20%, #ffd700 40%, #1e90ff 60%, #dc143c 80%, #8b0000 100%)',
          backgroundSize: '300% 300%',
          animation: 'shimmer 4s ease-in-out infinite',
          borderColor: 'rgba(255,255,255,0.15)',
          boxShadow: '0 4px 20px rgba(220,20,60,0.3), 0 4px 20px rgba(30,144,255,0.2)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('main')}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #8b0000, #dc143c, #ff4500, #dc143c, #8b0000)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
                boxShadow: '0 0 15px rgba(220,20,60,0.5)',
              }}
            >
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <div>
              <h1
                className="text-xl md:text-2xl font-bold tracking-wide"
                style={{
                  color: '#ffffff',
                  textShadow: '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3), 2px 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                LIBRO CONTROL CASA FDV
              </h1>
              <p className="text-xs hidden sm:block" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Sistema de Control de Notas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {authUser && (
              <div className="hidden sm:flex items-center gap-2 mr-2">
                <span
                  className="text-xs px-2 py-1 rounded"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}
                >
                  {authUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '📋 Admin'}: {authUser.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  style={{ color: 'rgba(255,255,255,0.7)' }}
                  className="hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            <button
              onClick={() => setShowLogin(!showLogin)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
              title={authUser ? 'Panel de administración' : 'Iniciar sesión'}
            >
              <User className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.85)' }} />
            </button>
            {authUser && (
              <button
                onClick={() => setView(authUser.role === 'SUPER_ADMIN' ? 'super-admin' : 'admin-dashboard')}
                className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
                title="Panel"
              >
                <span className="text-xs" style={{ color: 'white' }}>⚙</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLogin && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setShowLogin(false)}
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(18,10,50,0.98), rgba(15,25,55,0.98), rgba(10,30,70,0.98))',
              border: '1px solid rgba(100,100,200,0.3)',
              maxWidth: '28rem',
              width: 'calc(100% - 2rem)',
              margin: '0 auto',
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle style={{ color: '#ffffff' }}>
                {authUser ? 'Sesión Activa' : 'Iniciar Sesión'}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowLogin(false)} style={{ color: 'rgba(255,255,255,0.6)' }}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {authUser ? (
                <div className="space-y-4">
                  <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                    Conectado como <strong style={{ color: '#ffffff' }}>{authUser.name}</strong>
                  </p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Rol: {authUser.role === 'SUPER_ADMIN' ? 'Super Administrador' : 'Administrador'}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setShowLogin(false)
                        setView(authUser.role === 'SUPER_ADMIN' ? 'super-admin' : 'admin-dashboard')
                      }}
                      className="flex-1 text-white border-0"
                      style={{
                        background: 'linear-gradient(135deg, #8b0000, #dc143c, #ff4500)',
                        boxShadow: '0 0 10px rgba(220,20,60,0.4)',
                      }}
                    >
                      Ir al Panel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { logout(); setShowLogin(false) }}
                      style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm mb-1 block" style={{ color: 'rgba(255,255,255,0.6)' }}>Usuario</label>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                      placeholder="Ingrese su usuario"
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block" style={{ color: 'rgba(255,255,255,0.6)' }}>Contraseña</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                        placeholder="Ingrese su contraseña"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {error && <p style={{ color: '#ff6b6b' }} className="text-sm">{error}</p>}
                  <Button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full text-white border-0 font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #8b0000, #dc143c, #ff4500)',
                      boxShadow: '0 0 10px rgba(220,20,60,0.4)',
                    }}
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
