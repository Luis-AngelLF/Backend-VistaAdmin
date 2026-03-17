import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/components/auth/login-form'
import '@testing-library/jest-dom'
import * as actions from '@/lib/auth/actions'

// Mock useActionState
jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useActionState: () => [{ message: null }, jest.fn()],
}))

// Mock useFormStatus
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    useFormStatus: () => ({ pending: false }),
}))

// Mock SignaturePad
jest.mock('@/components/auth/signature-pad', () => ({
    SignaturePad: ({ ref }: { ref: any }) => <canvas data-testid="signature-pad" ref={ref} />
}))

// Mock Server Actions
jest.mock('@/lib/auth/actions', () => ({
    login: jest.fn(),
    verifyUser: jest.fn(),
}))

describe('LoginForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders step 1 initially', () => {
        render(<LoginForm />)
        expect(screen.getByText('Inciar Sesión')).toBeInTheDocument()
        expect(screen.getByLabelText('Número de Cédula')).toBeInTheDocument()

        // Step 2 container should have 'hidden' class
        const step2Container = screen.getByText('Por favor, firme en el recuadro inferior.').closest('.space-y-4')
        expect(step2Container).toHaveClass('hidden')
    })

    it('navigates to step 2 when valid cedula is entered and user exists', async () => {
        (actions.verifyUser as jest.Mock).mockResolvedValue({ exists: true, role: 'voter' })

        render(<LoginForm />)

        const input = screen.getByLabelText('Número de Cédula')
        fireEvent.change(input, { target: { value: '11111111' } })

        const continueBtn = screen.getByText('Continuar')
        fireEvent.click(continueBtn)

        await waitFor(() => {
            const step2Container = screen.getByText('Por favor, firme en el recuadro inferior.').closest('.space-y-4')
            expect(step2Container).not.toHaveClass('hidden')
            expect(step2Container).toHaveClass('block')
        })
    })

    it('shows error if user does not exist', async () => {
        (actions.verifyUser as jest.Mock).mockResolvedValue({ exists: false, message: 'Usuario no encontrado.' })

        render(<LoginForm />)

        const input = screen.getByLabelText('Número de Cédula')
        fireEvent.change(input, { target: { value: '00000000' } })

        const continueBtn = screen.getByText('Continuar')
        fireEvent.click(continueBtn)

        await waitFor(() => {
            expect(screen.getByText('Usuario no encontrado.')).toBeInTheDocument()
        })

        // Should stay on step 1 (step 2 container remains hidden)
        const step2Container = screen.getByText('Por favor, firme en el recuadro inferior.').closest('.space-y-4')
        expect(step2Container).toHaveClass('hidden')
    })

    it('shows error if cedula is too short', async () => {
        render(<LoginForm />)

        const input = screen.getByLabelText('Número de Cédula')
        fireEvent.change(input, { target: { value: '123' } })

        const continueBtn = screen.getByText('Continuar')
        fireEvent.click(continueBtn)

        await waitFor(() => {
            expect(screen.getByText('Cédula demasiado corta.')).toBeInTheDocument()
        })
    })

    it('shows error if cedula is empty', () => {
        render(<LoginForm />)
        const continueBtn = screen.getByText('Continuar')
        expect(continueBtn).toBeDisabled()
    })
})
