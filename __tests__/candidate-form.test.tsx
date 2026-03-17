import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CandidateForm } from '@/components/voting/candidate-form'
import { addCandidate } from '@/lib/voting/actions'
import '@testing-library/jest-dom'

// Mock Server Action
jest.mock('@/lib/voting/actions', () => ({
    addCandidate: jest.fn(),
}))

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

// Mock Next/Image
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ fill, ...props }: any) => <img {...props} />,
}))

describe('CandidateForm', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders form fields correctly', () => {
        render(<CandidateForm />)
        expect(screen.getByLabelText('Nombres')).toBeInTheDocument()
        expect(screen.getByLabelText('Apellidos')).toBeInTheDocument()
        expect(screen.getByLabelText('Partido / Movimiento')).toBeInTheDocument()
        expect(screen.getByLabelText('Fotografía Oficial')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Agregar Candidato' })).toBeInTheDocument()
    })

    it('updates image preview when file is selected', async () => {
        render(<CandidateForm />)
        const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' })
        const input = screen.getByLabelText('Fotografía Oficial')

        // CreateObjectUrl mock
        global.URL.createObjectURL = jest.fn(() => 'mock-url')

        fireEvent.change(input, { target: { files: [file] } })

        await waitFor(() => {
            expect(screen.getByRole('img')).toBeInTheDocument()
        })
    })
})
