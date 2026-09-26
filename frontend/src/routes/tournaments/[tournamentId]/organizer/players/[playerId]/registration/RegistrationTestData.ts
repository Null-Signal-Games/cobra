import type { Deck } from "$lib/model/Deck";
import { Identity } from "$lib/model/Identity";
import type { Player } from "$lib/model/Player";
import { Tournament } from "$lib/model/Tournament";
import type { Printing } from "$lib/utils/api_types";

export const MockTournament = new Tournament({
  id: 1,
  name: "Mock Tournament",
  slug: "ABC1",
  user_id: 1,
  tournament_organizer: "Alice",
  date: "2026-04-21",
  registration_starts: "2026-04-21T10:00:00",
  tournament_starts: "2026-04-21T11:00:00",
  description: "This is a test tournament.",
  official_prize_kit_id: 1,
  official_prize_kit_name: "2026 Test Tournament Kit",
  self_registration: true,
  all_players_unlocked: true,
  any_player_unlocked: true,
  allow_streaming_opt_out: true,
  swiss_format: "single_sided",
  registration_closed: false,
  active_player_count: 17,
  dropped_player_count: 1,
});

export const MockPlayerAlice: Player = {
  id: 1,
  name: "Alice",
  name_with_pronouns: "",
  side: "corp",
  user_id: 1,
  side_label: null,
  corp_id: new Identity(),
  runner_id: new Identity(),
  include_in_stream: false,
  active: null,
  pronouns: "",
  registration_locked: false,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

export const MockPlayerBob: Player = {
  id: 2,
  name: "Bob",
  pronouns: "he/him",
  name_with_pronouns: "Bob (he/him)",
  side: null,
  user_id: 2,
  side_label: null,
  corp_id: {
    name: "BANGUN: When Disaster Strikes",
    faction: "weyland-consortium",
  },
  runner_id: {
    name: "Barry “Baz” Wong: Tri-Maf Veteran",
    faction: "criminal",
  },
  registration_locked: false,
  include_in_stream: false,
  active: null,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

// export const MockPlayerBobNrdbDecks: NrdbDeck[] = [
//   {
//     id: 1,
//     uuid: "11111111-1111-1111-1111-111111111111",
//     date_creation: "2026-06-13T00:00:00+00:00",
//     date_update: "2026-06-13T00:00:00+00:00",
//     name: "Bob's BANGUN",
//     description: "Bob's Bangun deck",
//     mwl_code: "",
//     tags: "",
//     cards: [
//       { id: "35068", count: 1 },
//       { id: "30075", count: 3 },
//     ],
//   },
//   {
//     id: 2,
//     uuid: "22222222-2222-2222-2222-222222222222",
//     date_creation: "2026-06-13T00:00:00+00:00",
//     date_update: "2026-06-13T00:00:00+00:00",
//     name: "Bob's Baz",
//     description: "Bob's Baz deck",
//     mwl_code: "",
//     tags: "",
//     cards: [
//       { id: "35012", count: 1 },
//       { id: "30030", count: 3 },
//     ],
//   },
// ];

export const MockPlayerBobDecks: Deck[] = [
  {
    details: {
      id: 1,
      player_id: MockPlayerBob.id,
      side_id: "corp",
      name: "Bob's BANGUN",
      identity_title: "BANGUN: When Disaster Strikes",
      min_deck_size: 45,
      max_influence: 15,
      nrdb_uuid: "11111111-1111-1111-1111-111111111111",
      identity_nrdb_card_id: "bangun_when_disaster_strikes",
      created_at: "2026-06-13T00:00:00.000Z",
      updated_at: "2026-06-13T00:00:00.000Z",
      identity_nrdb_printing_id: "35068",
      user_id: MockPlayerBob.user_id,
      faction_id: "weyland_consortium",
      mine: true,
      player_name: null,
    },
    cards: [
      {
        id: 1,
        deck_id: 1,
        title: "Hedge Fund",
        quantity: 3,
        influence: 0,
        nrdb_card_id: "hedge_fund",
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
        nrdb_printing_id: "30075",
        card_type_id: "operation",
        faction_id: "neutral_corp",
        influence_cost: 0,
      },
    ],
  },
  {
    details: {
      id: 2,
      player_id: MockPlayerBob.id,
      side_id: "runner",
      name: "Bob's Baz",
      identity_title: "Barry “Baz” Wong: Tri-Maf Veteran",
      min_deck_size: 45,
      max_influence: 15,
      nrdb_uuid: "22222222-2222-2222-2222-222222222222",
      identity_nrdb_card_id: "barry_baz_wong_tri_maf_veteran",
      created_at: "2026-06-13T00:00:00.000Z",
      updated_at: "2026-06-13T00:00:00.000Z",
      identity_nrdb_printing_id: "35012",
      user_id: MockPlayerBob.user_id,
      faction_id: "criminal",
      mine: true,
      player_name: null,
    },
    cards: [
      {
        id: 2,
        deck_id: 2,
        title: "Sure Gamble",
        quantity: 3,
        influence: 0,
        nrdb_card_id: "sure_gamble",
        created_at: "2026-06-13T00:00:00.000Z",
        updated_at: "2026-06-13T00:00:00.000Z",
        nrdb_printing_id: "30030",
        card_type_id: "event",
        faction_id: "neutral_runner",
        influence_cost: 0,
      },
    ],
  },
];

export const MockBetaBuildPrinting: Printing = {
  id: "36019",
  type: "printings",
  attributes: {
    card_id: "beta_build",
    title: "Beta Build",
    card_type_id: "event",
    side_id: "runner",
    faction_id: "shaper",
    influence_cost: 3,
    influence_limit: null,
    minimum_deck_size: null,
  },
};

export const MockSureGamblePrinting: Printing = {
  id: "30030",
  type: "printings",
  attributes: {
    card_id: "sure_gamble",
    title: "Sure Gamble",
    card_type_id: "event",
    side_id: "runner",
    faction_id: "neutral_runner",
    influence_cost: 0,
    influence_limit: null,
    minimum_deck_size: null,
  },
};

export const MockBazPrinting: Printing = {
  id: "35012",
  type: "printings",
  attributes: {
    card_id: "barry_baz_wong_tri_maf_veteran",
    title: "Barry “Baz” Wong: Tri-Maf Veteran",
    card_type_id: "runner_identity",
    side_id: "runner",
    faction_id: "criminal",
    influence_cost: null,
    influence_limit: 15,
    minimum_deck_size: 45,
  },
};

export const MockZahyaPrinting: Printing = {
  id: "30010",
  type: "printings",
  attributes: {
    card_id: "zahya_sadeghi_versatile_smuggler",
    title: "Zahya Sadeghi: Versatile Smuggler",
    card_type_id: "runner_identity",
    side_id: "runner",
    faction_id: "criminal",
    influence_cost: null,
    influence_limit: 15,
    minimum_deck_size: 40,
  },
};

// export const MockPrintings = new Map<string, Printing>([
//   [
//     "35068",
//     {
//       id: "35068",
//       type: "printings",
//       attributes: {
//         card_id: "bangun_when_disaster_strikes",
//         title: "BANGUN: When Disaster Strikes",
//         card_type_id: "corp_identity",
//         side_id: "corp",
//         faction_id: "weyland_consortium",
//         influence_cost: null,
//         influence_limit: 15,
//         minimum_deck_size: 45,
//       },
//     },
//   ],
//   [
//     "30075",
//     {
//       id: "30075",
//       type: "printings",
//       attributes: {
//         card_id: "hedge_fund",
//         title: "Hedge Fund",
//         card_type_id: "operation",
//         side_id: "corp",
//         faction_id: "neutral_corp",
//         influence_cost: 0,
//         influence_limit: null,
//         minimum_deck_size: null,
//       },
//     },
//   ],
//   [MockBazPrinting.id, MockBazPrinting],
//   [MockSureGamblePrinting.id, MockSureGamblePrinting],
//   [MockBetaBuildPrinting.id, MockBetaBuildPrinting],
// ]);
