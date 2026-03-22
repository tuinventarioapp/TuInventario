import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { LoginPage } from './login-page'

describe('LoginPage', () => {
  it('renders login form fields', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Accede a tu operacion')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin@admin.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument()
  })
})
