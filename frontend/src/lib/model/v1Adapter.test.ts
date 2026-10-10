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

  describe('adaptPlayer', () => {
    it('throws error for an invalid ID', () => {
      const playerInfo = {
        id: 'bad-id',
        type: 'players',
        attributes: {
          tournament_id: 1,
          user_id: 10,
          name: 'Evie',
          pronouns: null,
          active: true,
          seed: null,
          fixed_table_number: null,
          manual_seed: null,
          first_round_bye: false,
          include_in_stream: false,
          registration_locked: false,
        },
      };

      expect(() => v1Adapter.adaptPlayer(playerInfo)).toThrow();
    });

    it('adapts a player and formats name with pronouns', () => {
      const playerInfo = {
        id: '42',
        type: 'players',
        attributes: {
          tournament_id: 1,
          user_id: 10,
          name: 'Evie',
          pronouns: 'she/her',
          active: true,
          seed: null,
          fixed_table_number: 5,
          manual_seed: null,
          first_round_bye: false,
          include_in_stream: true,
          registration_locked: true,
        },
      };

      const player = v1Adapter.adaptPlayer(playerInfo);

      expect(player.id).toBe(42);
      expect(player.name).toBe('Evie');
      expect(player.pronouns).toBe('she/her');
      expect(player.name_with_pronouns).toBe('Evie (she/her)');
      expect(player.user_id).toBe(10);
      expect(player.fixed_table_number).toBe(5);
      expect(player.include_in_stream).toBe(true);
      expect(player.registration_locked).toBe(true);
      expect(player.active).toBe(true);
    });

    it('resolves corp and runner identities from included resources', () => {
      const playerInfo = {
        id: '42',
        type: 'players',
        attributes: {
          tournament_id: 1,
          user_id: 10,
          name: 'plural',
          pronouns: null,
          active: true,
          seed: null,
          fixed_table_number: null,
          manual_seed: null,
          first_round_bye: false,
          include_in_stream: false,
          registration_locked: false,
          corp_identity_id: 101,
          runner_identity_id: 102,
        },
      };

      const included = [
        {
          id: '101',
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
          id: '102',
          type: 'identities',
          attributes: {
            name: 'Zahya Sadeghi: Versatile Smuggler',
            autocomplete: 'Zahya Sadeghi: Versatile Smuggler',
            faction: 'criminal',
            nrdb_code: '34001',
            side: 'runner',
          },
        },
      ];

      const player = v1Adapter.adaptPlayer(playerInfo, included);

      expect(player.corp_id.name).toBe('Haas-Bioroid: Precision Design');
      expect(player.corp_id.faction).toBe('haas-bioroid');
      expect(player.runner_id.name).toBe('Zahya Sadeghi: Versatile Smuggler');
      expect(player.runner_id.faction).toBe('criminal');
      expect(player.name_with_pronouns).toBe('plural');
    });
  });
});
