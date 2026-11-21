// Builders for test data. Each returns a complete, valid object with sensible defaults;
// pass overrides for the fields a test cares about:
//
//   const alice = makePlayer({ name: "Alice" });
//   const pairing = makePairing({ player1: alice, player2: makePlayer({ id: 2, name: "Bob" }) });
//   const stage = makeStage({ rounds: [makeRound({ pairings: [pairing] })] });
//
// Existing *TestData.ts files can move to these gradually.
import type { TournamentInfo, TournamentsResponse } from "#lib/api/v1ApiTypes.ts";
import { Identity } from "#lib/model/Identity.ts";
import type { Pairing } from "#lib/model/Pairing.ts";
import { Player } from "#lib/model/Player.ts";
import type { Round, RoundTimer } from "#lib/model/Round.ts";
import type { Stage } from "#lib/model/Stage.ts";
import { Tournament } from "#lib/model/Tournament.ts";

export function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
  return new Tournament({
    id: 1,
    name: "Test Tournament",
    slug: "TEST",
    user_id: 1,
    tournament_organizer: "Tournament Organizer",
    date: "2026-01-01",
    swiss_format: "double_sided",
    ...overrides,
  });
}

export function makeIdentity(overrides: Partial<Identity> = {}): Identity {
  return Object.assign(new Identity(), overrides);
}

export function makePlayer(overrides: Partial<Player> = {}): Player {
  const name = overrides.name ?? "Player 1";
  return Object.assign(new Player(), {
    id: 1,
    name,
    name_with_pronouns: name,
    user_id: 1,
    active: true,
    ...overrides,
  });
}

export function makeRoundTimer(overrides: Partial<RoundTimer> = {}): RoundTimer {
  return {
    show: false,
    running: false,
    paused: false,
    started: false,
    state: { started: false, paused: false, length_minutes: 65 },
    ...overrides,
  };
}

export function makePairing(overrides: Partial<Pairing> = {}): Pairing {
  const tableNumber = overrides.table_number ?? 1;
  return {
    id: 1,
    table_number: tableNumber,
    table_label: `Table ${tableNumber}`,
    policy: { self_report: false },
    player1: makePlayer({ id: 1, name: "Player 1" }),
    player2: makePlayer({ id: 2, name: "Player 2", user_id: 2 }),
    // Unreported pairings come back from the API with null scores.
    score1: null as unknown as number,
    score1_corp: null as unknown as number,
    score1_runner: null as unknown as number,
    score2: null as unknown as number,
    score2_corp: null as unknown as number,
    score2_runner: null as unknown as number,
    score_label: "-",
    intentional_draw: false,
    two_for_one: false,
    self_reports: null,
    reported: false,
    winner_game: null,
    loser_game: null,
    bracket_type: null,
    ui_metadata: { row_highlighted: false },
    ...overrides,
  };
}

export function makeRound(overrides: Partial<Round> = {}): Round {
  return {
    id: 1,
    number: 1,
    completed: false,
    weight: 1,
    pairings: [],
    pairings_reported: 0,
    length_minutes: 65,
    timer: makeRoundTimer(),
    ...overrides,
  };
}

export function makeStage(overrides: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    name: "Swiss",
    format: "swiss",
    is_single_sided: false,
    is_elimination: false,
    view_decks: false,
    rounds: [],
    ...overrides,
  };
}

// JSON:API wrappers for responses from /api/v1/public/tournaments.
export function makeTournamentInfo(overrides: Partial<Tournament> = {}): TournamentInfo {
  const tournament = makeTournament(overrides);
  return { id: String(tournament.id), type: "tournaments", attributes: tournament };
}

export function makeTournamentsResponse(tournaments: Partial<Tournament>[] = []): TournamentsResponse {
  return { data: tournaments.map((t) => makeTournamentInfo(t)) };
}
