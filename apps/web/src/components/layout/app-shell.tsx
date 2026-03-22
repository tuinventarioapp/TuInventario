import { Bell, Boxes, ClipboardList, Gauge, HandCoins, LogOut, ReceiptText, Settings, ShieldCheck, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { useRealtimeSync } from '../../hooks/use-realtime-sync'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth-store'
import { Button } from '../ui/button'

const navigation = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/app/items', label: 'Inventario', icon: Boxes },
  { to: '/app/movements', label: 'Movimientos', icon: ClipboardList },
  { to: '/app/loans', label: 'Prestamos', icon: HandCoins },
  { to: '/app/borrowers', label: 'Prestatarios', icon: Users },
  { to: '/app/reports', label: 'Reportes', icon: ReceiptText },
  { to: '/app/users', label: 'Usuarios', icon: ShieldCheck },
  { to: '/app/audit', label: 'Auditoria', icon: Bell },
  { to: '/app/settings', label: 'Configuracion', icon: Settings },
]

export function AppShell() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const user = useAuthStore((state) => state.user)

  useRealtimeSync()

  return (
    <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-border bg-slate-950 px-5 py-6 text-white">
        <div className="mb-8 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-200">TuInventario</p>
          <h1 className="text-2xl font-semibold">Control operativo en tiempo real</h1>
          <p className="text-sm text-slate-300">{user?.organizationName ?? 'Sin organizacion'}</p>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10',
                  isActive && 'bg-white text-slate-950 shadow-panel',
                )
              }
            >
              <Icon className="size-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-3xl bg-white/10 p-4 text-sm text-slate-200">
          <p className="font-medium">{user?.fullName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-300">{user?.role}</p>
          <Button
            className="mt-4 w-full bg-white text-slate-950 hover:bg-slate-100"
            onClick={() => {
              clearSession()
              window.location.href = '/login'
            }}
          >
            <LogOut className="mr-2 size-4" />
            Cerrar sesion
          </Button>
        </div>
      </aside>

      <main className="space-y-6 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
