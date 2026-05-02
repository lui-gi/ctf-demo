import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClosingCeremony } from '@/routes/ClosingCeremony';
import { CALYPSO_LETTER_LINES } from '@/closing-ceremony/letter';
import { strings } from '@/theme/strings';

/**
 * Mock the socket module so we can flip the voyage `frozen` flag per test
 * without standing up a live socket.io server in jsdom. The hook contract
 * is a thin `{ frozen, loading }` object — we mirror it here.
 */
let mockFrozen = false;
vi.mock('@/ws/socket', () => ({
  useVoyageState: (): { frozen: boolean; loading: boolean } => ({
    frozen: mockFrozen,
    loading: false,
  }),
}));

// Mock the Charts API so RevealedCeremony doesn't make a real network call.
vi.mock('@/api/charts', () => ({
  chartsApi: {
    snapshot: vi.fn(async () => ({
      rows: [
        { rank: 1, crew_id: 'c1', crew_name: 'Black Pearl', score: 4200, last_solve_at: null, solves: 12 },
        { rank: 2, crew_id: 'c2', crew_name: 'Flying Dutchman', score: 3900, last_solve_at: null, solves: 11 },
        { rank: 3, crew_id: 'c3', crew_name: 'Queen Anne\'s Revenge', score: 3500, last_solve_at: null, solves: 10 },
      ],
      frozen: true,
      generated_at: new Date().toISOString(),
    })),
  },
}));

function renderCeremony(): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/voyage/closing']}>
      <ClosingCeremony />
    </MemoryRouter>,
  );
}

describe('ClosingCeremony — frozen', () => {
  beforeEach(() => {
    mockFrozen = true;
  });
  afterEach(() => {
    mockFrozen = false;
  });

  it('renders the locked Calypso letter verbatim', async () => {
    renderCeremony();

    // Salutation
    expect(await screen.findByText(/My drowned heart, my Davy,/)).toBeInTheDocument();

    // Long-form middle paragraph
    expect(
      screen.getByText(/I have walked your decks while you slept, Davy/),
    ).toBeInTheDocument();

    // The locked-edit line: "powder magazine" (NOT "powder room")
    const magazineNode = screen.getByText(/powder magazine/);
    expect(magazineNode).toBeInTheDocument();
    expect(screen.queryByText(/powder room/)).not.toBeInTheDocument();

    // Hidden-in-three-places paragraph
    expect(
      screen.getByText(/inside a sealed box, inside a song, inside the sound of itself breaking/),
    ).toBeInTheDocument();

    // Closing line of the letter
    expect(
      screen.getByText('I will love you until the tides forget.'),
    ).toBeInTheDocument();
  });

  it('renders the themed final line below the letter', async () => {
    renderCeremony();
    expect(
      await screen.findByText(strings.closingCeremony.finalLine),
    ).toBeInTheDocument();
    // sanity: the literal copy is what the strings table claims
    expect(strings.closingCeremony.finalLine).toBe(
      '— And so the Tides did forget. The Charts close. Pirate King is crowned.',
    );
  });

  it('renders the placement reveal headers from the strings table', async () => {
    renderCeremony();
    expect(await screen.findByText(strings.closingCeremony.pirateKing)).toBeInTheDocument();
    expect(screen.getByText(strings.closingCeremony.emperorYonko)).toBeInTheDocument();
    expect(screen.getByText(strings.closingCeremony.warlordOfTheSea)).toBeInTheDocument();
    // Crews from the mocked snapshot
    await waitFor(() => {
      expect(screen.getByText('Black Pearl')).toBeInTheDocument();
    });
    expect(screen.getByText('Flying Dutchman')).toBeInTheDocument();
    expect(screen.getByText("Queen Anne's Revenge")).toBeInTheDocument();
  });

  it('renders the themed letter-intro line from the strings table', async () => {
    renderCeremony();
    expect(
      await screen.findByText(strings.closingCeremony.letterIntro),
    ).toBeInTheDocument();
    expect(strings.closingCeremony.letterIntro).toBe(
      "Calypso's letter, recovered after the Voyage:",
    );
  });
});

describe('ClosingCeremony — not yet frozen', () => {
  beforeEach(() => {
    mockFrozen = false;
  });

  it('renders the placeholder, NOT the letter', () => {
    renderCeremony();
    expect(screen.getByText(strings.closingCeremony.notYet)).toBeInTheDocument();
    expect(screen.queryByText(/My drowned heart, my Davy,/)).not.toBeInTheDocument();
    expect(screen.queryByText(/I will love you until the tides forget\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/powder magazine/)).not.toBeInTheDocument();
  });
});

describe('CALYPSO_LETTER_LINES — locked source-of-truth', () => {
  it('contains the locked "powder magazine" wording, not "powder room"', () => {
    const all = CALYPSO_LETTER_LINES.join('\n');
    expect(all).toContain('powder magazine');
    expect(all).not.toContain('powder room');
  });

  it('ends with the flag-bearing final line of the letter', () => {
    const last = CALYPSO_LETTER_LINES[CALYPSO_LETTER_LINES.length - 1];
    expect(last).toBe('I will love you until the tides forget.');
  });

  it('opens with the salutation', () => {
    expect(CALYPSO_LETTER_LINES[0]).toBe('My drowned heart, my Davy,');
  });
});
