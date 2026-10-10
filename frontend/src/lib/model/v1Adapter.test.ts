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

  describe('adaptIdentityNames', () => {
    it('sorts and partitions identities into corp and runner identity names', () => {
      const identities = [
        {
          id: '1',
          type: 'identities',
          attributes: {
            name: 'Jinteki: Personal Evolution',
            autocomplete: 'Jinteki: Restoring Humanity',
            faction: 'jinteki',
            nrdb_code: '01067',
            side: 'corp',
          },
        },
        {
          id: '2',
          type: 'identities',
          attributes: {
            name: 'Haas-Bioroid: Precision Design',
            autocomplete: 'Haas-Bioroid: Precision Design',
            faction: 'haas-bioroid',
            nrdb_code: '30030',
            side: 'corp',
          },
        },
        {
          id: '3',
          type: 'identities',
          attributes: {
            name: 'Zahya Sadeghi: Versatile Smuggler',
            autocomplete: 'Zahya Sadeghi: Versatile Smuggler',
            faction: 'shaper',
            nrdb_code: '34001',
            side: 'runner',
          },
        },
        {
          id: '4',
          type: 'identities',
          attributes: {
            name: 'Topan: Ormas Leader',
            autocomplete: 'Topan: Ormas Leader',
            faction: 'anarch',
            nrdb_code: '34002',
            side: 'runner',
          },
        },
      ];

      const result = v1Adapter.adaptIdentityNames(identities);

      expect(result).toEqual({
        corp: [
          { label: 'Haas-Bioroid: Precision Design', value: 'Haas-Bioroid: Precision Design' },
          { label: 'Jinteki: Restoring Humanity', value: 'Jinteki: Personal Evolution' },
        ],
        runner: [
          { label: 'Topan: Ormas Leader', value: 'Topan: Ormas Leader' },
          { label: 'Zahya Sadeghi: Versatile Smuggler', value: 'Zahya Sadeghi: Versatile Smuggler' },
        ],
      });
    });
  });
});
