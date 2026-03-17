import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BallotGrid } from '@/components/voting/ballot-grid'
import { submitVote } from '@/lib/voting/actions'
import '@testing-library/jest-dom'

// Mock Server Action
jest.mock('@/lib/voting/actions', () => ({
    submitVote: jest.fn(),
}))

// Mock Next/Image
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ fill, ...props }: any) => <img {...props} />,
}))

// Create global mocks for Web Worker, window.ethereum, and session storage
class MockWorker {
    onmessage: any;
    onerror: any;
    postMessage(msg: any) {
        setTimeout(() => {
            if (this.onmessage) {
                this.onmessage({
                    data: {
                        msgId: msg.msgId,
                        type: 'SUCCESS',
                        data: {
                            proof: { pi_a: ['1', '2'], pi_b: [['1', '2'], ['3', '4']], pi_c: ['1', '2'] },
                            publicSignals: ['0', '1', '2', '3', '4', '5', '6', '7']
                        }
                    }
                })
            }
        }, 10)
    }
    terminate() { }
}
(global as any).Worker = MockWorker;

// JSDOM has its own sessionStorage, so we spy on the prototype
Object.defineProperty(window, 'sessionStorage', {
    value: {
        getItem: jest.fn((key) => {
            if (key === 'voter_zk_secret') return 'fake-secret'
            return null
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    },
    writable: true
});

Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true
});

Object.defineProperty(window, 'ethereum', {
    value: {},
    writable: true
});

jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                not: () => ({
                    order: jest.fn().mockResolvedValue({
                        data: [{ zk_commitment: '123' }],
                        error: null
                    })
                })
            })
        })
    })
}));

jest.mock('ethers', () => ({
    ethers: {
        BrowserProvider: jest.fn().mockImplementation(() => ({
            getSigner: jest.fn().mockResolvedValue({})
        })),
        Contract: jest.fn().mockImplementation(() => ({
            verifyAndCast: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) })
        }))
    }
}));


const mockCandidates = [
    { id: '1', names: 'C1', surnames: 'S1', party: 'P1', photo_url: '/c1.jpg' },
    { id: '2', names: 'C2', surnames: 'S2', party: 'P2', photo_url: '/c2.jpg' },
    { id: '3', names: 'C3', surnames: 'S3', party: 'P3', photo_url: '/c3.jpg' },
    { id: '4', names: 'C4', surnames: 'S4', party: 'P4', photo_url: '/c4.jpg' },
    { id: '5', names: 'C5', surnames: 'S5', party: 'P5', photo_url: '/c5.jpg' },
    { id: '6', names: 'C6', surnames: 'S6', party: 'P6', photo_url: '/c6.jpg' },
]

describe('BallotGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation((...args) => {
            throw new Error('CONSOLE.ERROR CALLED: ' + args.join(' '));
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders candidates correctly', () => {
        render(<BallotGrid candidates={mockCandidates} />)
        expect(screen.getByText('C1 S1')).toBeInTheDocument()
        expect(screen.getByText('P1')).toBeInTheDocument()
        expect(screen.getAllByRole('img')).toHaveLength(6)
    })

    it('allows selecting up to 5 candidates', () => {
        render(<BallotGrid candidates={mockCandidates} />)

        // Select 5
        for (let i = 0; i < 5; i++) {
            fireEvent.click(screen.getByText(`${mockCandidates[i].names} ${mockCandidates[i].surnames}`))
        }

        expect(screen.getByText('Selección: 5 / 5')).toBeInTheDocument()
    })

    it('prevents selecting more than 5', () => {
        render(<BallotGrid candidates={mockCandidates} />)

        // Select 5
        for (let i = 0; i < 5; i++) {
            fireEvent.click(screen.getByText(`${mockCandidates[i].names} ${mockCandidates[i].surnames}`))
        }

        // Try selecting 6th
        fireEvent.click(screen.getByText('C6 S6'))

        // Should still be 5
        expect(screen.getByText('Selección: 5 / 5')).toBeInTheDocument()
    })

    it('opens review modal and submits vote', async () => {
        (submitVote as jest.Mock).mockResolvedValue({ message: 'success: Vote submitted successfully.' })

        render(<BallotGrid candidates={mockCandidates} />)

        // Select 1
        fireEvent.click(screen.getByText('C1 S1'))

        // Click Review
        fireEvent.click(screen.getByText('Revisar y Votar'))

        // Check Modal Content
        expect(screen.getByText('Confirmar Voto')).toBeInTheDocument()
        expect(screen.getByText('Se disponen a emitir votos por los siguientes candidatos. Esta acción es irreversible.')).toBeInTheDocument()

        // Confirm
        const confirmBtn = screen.getByText('Confirmar y Enviar Voto')
        fireEvent.click(confirmBtn)

        await waitFor(() => {
            expect(submitVote).toHaveBeenCalledWith(
                ['1'],
                expect.any(Object),
                expect.any(Array)
            )
        })

        // Check Success State
        expect(screen.getByText('¡Voto Registrado!')).toBeInTheDocument()
    })
})
