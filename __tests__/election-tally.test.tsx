import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ElectionTally } from '@/components/admin/election-tally'
import { calculateTally } from '@/lib/voting/tally'
import '@testing-library/jest-dom'

// Mock Server Action
jest.mock('@/lib/voting/tally', () => ({
    calculateTally: jest.fn(),
}))

// Mock ethers
const mockState = jest.fn().mockResolvedValue(0);
const mockStartVoting = jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) });
const mockCloseElection = jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) });

jest.mock('ethers', () => ({
    ethers: {
        BrowserProvider: jest.fn().mockImplementation(() => ({
            getSigner: jest.fn().mockResolvedValue({})
        })),
        Contract: jest.fn().mockImplementation(() => ({
            state: mockState,
            startVoting: mockStartVoting,
            closeElection: mockCloseElection
        }))
    }
}));

Object.defineProperty(window, 'ethereum', {
    value: {},
    writable: true
});

Object.defineProperty(window, 'alert', {
    value: jest.fn(),
    writable: true
});

describe('ElectionTally', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
        // Default state to 0 (Registration)
        mockState.mockResolvedValue(0)
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders initial state and starts election', async () => {
        render(<ElectionTally />)

        // Wait for state to load
        await waitFor(() => {
            expect(screen.getByText('Congelar Padrón e Iniciar Elección')).toBeInTheDocument()
        })

        const startBtn = screen.getByText('Congelar Padrón e Iniciar Elección')
        fireEvent.click(startBtn)

        await waitFor(() => {
            expect(mockStartVoting).toHaveBeenCalled()
            expect(window.alert).toHaveBeenCalledWith('Election Started! Merkle snapshot frozen.')
        })
    })

    it('renders voting state and closes election to tally', async () => {
        // Set state to 1 (Voting)
        mockState.mockResolvedValue(1)

            ; (calculateTally as jest.Mock).mockResolvedValue({
                tally: [
                    { candidate_id: '1', candidate_name: 'C1 S1', party: 'P1', votes: 10 }
                ],
                totalVotes: 10
            })

        render(<ElectionTally />)

        await waitFor(() => {
            expect(screen.getByText('Cerrar y Descifrar (Tally)')).toBeInTheDocument()
        })

        const tallyBtn = screen.getByText('Cerrar y Descifrar (Tally)')
        fireEvent.click(tallyBtn)

        await waitFor(() => {
            expect(mockCloseElection).toHaveBeenCalled()
            expect(calculateTally).toHaveBeenCalled()
            // Check results rendered
            expect(screen.getByText('Resultados Consolidados')).toBeInTheDocument()
            expect(screen.getByText('C1 S1 (P1)')).toBeInTheDocument()
            expect(screen.getByText('10 votos')).toBeInTheDocument()
        })
    })
})
