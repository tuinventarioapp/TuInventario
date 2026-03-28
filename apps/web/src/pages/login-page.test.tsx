import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from './login-page'

describe('LoginPage', () => {
  it('renders login form fields', () => {
    const { container } = render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByText('Accede a tu operacion')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('')
    expect(container.querySelector('input[type="password"]')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Iniciar sesion' })).toBeInTheDocument()
  })
})
