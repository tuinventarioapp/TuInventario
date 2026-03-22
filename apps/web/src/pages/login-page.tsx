import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { api } from '../lib/api'
import { useAuthStore } from '../store/auth-store'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'

const schema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(8, 'Minimo 8 caracteres'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'demo@tuinventario.local', password: 'Demo12345!' },
  })

  const mutation = useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      setSession(response)
      navigate('/app/dashboard')
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-white/95">
        <div className="mb-6 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-700">TuInventario</p>
          <h1 className="text-3xl font-semibold text-slate-950">Accede a tu operacion</h1>
          <p className="text-sm text-slate-600">Usa el usuario demo o entra con tu propia cuenta.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Correo</label>
            <Input {...register('email')} />
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Contrasena</label>
            <Input type="password" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>

          {mutation.isError && <p className="text-sm text-red-600">{mutation.error.message}</p>}

          <Button className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Entrando...' : 'Iniciar sesion'}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link className="text-sky-700 hover:underline" to="/register">Crear cuenta</Link>
          <Link className="text-slate-600 hover:underline" to="/forgot-password">Olvide mi contrasena</Link>
        </div>
      </Card>
    </div>
  )
}
