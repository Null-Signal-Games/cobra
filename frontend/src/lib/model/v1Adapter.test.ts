import { describe, expect, it } from 'vitest';
import type { TournamentInfo } from '../api/v1ApiTypes';
import { Tournament } from '../model/Tournament';
import { v1Adapter } from './v1Adapter';

describe('v1Adapter', () => {
  it('throws error for an invalid ID', () => {
    const tournament: TournamentInfo = {
      id: 'not-an-integer',
      attributes: new Tournament({
      }),
    };

    expect(() => v1Adapter.adaptTournament(tournament)).toThrow();
  });

  it('accepts a valid TournamentInfo payload with required fields', () => {
    const tournament: TournamentInfo = {
      id: '123',
      attributes: new Tournament({
        name: 'Example',
        description: 'A tournament description',
        created_at: '2024-01-01T00:00:00.000Z',
        date: '2024-01-10T00:00:00.000Z',
        tournament_starts: '2024-01-10T00:00:00.000Z',
        registration_starts: '2024-01-08T00:00:00.000Z',
        organizer_contact: 'organizer@example.com',
      }),
    };

    expect(v1Adapter.adaptTournament(tournament)).toMatchObject({
      id: 123,
      name: 'Example',
      description: 'A tournament description',
      created_at: '2024-01-01T00:00:00.000Z',
      date: '2024-01-10T00:00:00.000Z',
      tournament_starts: '2024-01-10T00:00:00.000Z',
      registration_starts: '2024-01-08T00:00:00.000Z',
      organizer_contact: 'organizer@example.com',
    });
  });

  it('allows TournamentInfo fields to be omitted when defaults are valid', () => {
    const tournament: TournamentInfo = {
      id: '456',
      attributes: new Tournament({
      }),
    };

    expect(v1Adapter.adaptTournament(tournament)).toMatchObject({
      id: 456,
      name: '',
      description: null,
      created_at: '',
      date: '',
      tournament_starts: null,
      registration_starts: null,
      organizer_contact: null,
    });
  });
});
