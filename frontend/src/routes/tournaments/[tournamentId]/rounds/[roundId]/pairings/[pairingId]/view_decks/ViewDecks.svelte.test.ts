import {
  cleanup,
  queryByRole,
  queryByTestId,
  queryByTitle,
  render,
  screen
} from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import ViewDecksPage from "./+page.svelte";
import type { PageProps } from "./$types";
import { Tournament, TournamentPolicies } from "$lib/model/Tournament";
import type { Player } from "$lib/model/Player";
import { Identity } from "$lib/model/Identity";
import { Deck } from "$lib/model/Deck";

const MockPlayerAlice: Player = {
  id: 1,
  name: "Alice",
  pronouns: "she/her",
  name_with_pronouns: "Alice (she/her)",
  side: null,
  user_id: 1,
  side_label: null,
  corp_id: new Identity(),
  runner_id: new Identity(),
  registration_locked: false,
  include_in_stream: false,
  active: null,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

const MockPlayerAliceCorpDeck: Deck = {
  details: {
    id: 1,
    player_id: MockPlayerAlice.id,
    side_id: "corp",
    name: "Alice's A Teia",
    identity_title: "A Teia: IP Recovery",
    min_deck_size: 45,
    max_influence: 15,
    nrdb_uuid: "11111111-1111-1111-1111-111111111111",
    identity_nrdb_card_id: "a_teia_ip_recovery",
    created_at: "2026-06-13T00:00:00.000Z",
    updated_at: "2026-06-13T00:00:00.000Z",
    identity_nrdb_printing_id: "34039",
    user_id: MockPlayerAlice.user_id,
    faction_id: "jinteki",
    mine: false,
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
};

const MockPlayerBob: Player = {
  id: 2,
  name: "Bob",
  pronouns: "he/him",
  name_with_pronouns: "Bob (he/him)",
  side: null,
  user_id: 2,
  side_label: null,
  corp_id: new Identity(),
  runner_id: new Identity(),
  registration_locked: false,
  include_in_stream: false,
  active: null,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

const MockPlayerBobRunnerDeck: Deck = {
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
};

const MockPageData: PageProps["data"] = {
  tournamentTypes: [],
  tournamentData: {
    tournament: new Tournament({ id: 1 }),
    csrf_token: ""
  },
  timer: {
    show: false,
    running: false,
    paused: false,
    started: false,
    state: {
      started: false,
      paused: false,
      finish_time: undefined,
      remaining_seconds: undefined,
      length_minutes: undefined
    }
  },
  player: null,
  policy: new TournamentPolicies(),
  stages: [],
  stageName: "",
  tableLabel: "",
  corpPlayer: MockPlayerAlice,
  corpPlayerDeck: MockPlayerAliceCorpDeck,
  runnerPlayer: MockPlayerBob,
  runnerPlayerDeck: MockPlayerBobRunnerDeck,
};

describe("View Player Decks", () => {
  function renderViewDecks(player: Player | null) {
    const props = {
      params: {
        tournamentId: "1",
        roundId: "1",
        pairingId: "1",
      },
      data: MockPageData
    };
    props.data.corpPlayerDeck.details.mine = player?.id === MockPlayerAlice.id;
    props.data.runnerPlayerDeck.details.mine = player?.id === MockPlayerBob.id;

    render(ViewDecksPage, { props: props });
  }

  function verifyReadOnly(table: HTMLElement) {
    expect(table).toBeInTheDocument();
    expect(queryByTestId(table, "new_card_row")).not.toBeInTheDocument();
    expect(queryByRole(table, "button", { name: "Edit" })).not.toBeInTheDocument();
    expect(queryByRole(table, "button", { name: "Remove" })).not.toBeInTheDocument();
    expect(queryByRole(table, "button", { name: "Add" })).not.toBeInTheDocument();
    expect(queryByTitle(table, "Edit Deck")).not.toBeInTheDocument();
  }

  afterEach(() => {
    cleanup();
  });

  describe("as non-player", () => {
    beforeEach(() => {
      renderViewDecks(null);
    });

    it("displays read-only deck lists with no edit links", () => {
      const corpDeckTable = screen.getByLabelText("corp deck");
      expect(corpDeckTable).toBeInTheDocument();
      expect(queryByTitle(corpDeckTable, "Edit Deck")).not.toBeInTheDocument();
      verifyReadOnly(screen.getByLabelText("corp deck list"));

      const runnerDeckTable = screen.getByLabelText("runner deck");
      expect(runnerDeckTable).toBeInTheDocument();
      expect(queryByTitle(runnerDeckTable, "Edit Deck")).not.toBeInTheDocument();
      verifyReadOnly(screen.getByLabelText("runner deck list"));
    });
  });

  describe("as deck owner", () => {
    beforeEach(() => {
      renderViewDecks(MockPlayerAlice);
    });

    it("displays read-only deck lists with edit link only on owner's deck", () => {
      const corpDeckTable = screen.getByLabelText("corp deck");
      expect(corpDeckTable).toBeInTheDocument();
      expect(queryByTitle(corpDeckTable, "Edit Deck")).toBeInTheDocument();
      verifyReadOnly(screen.getByLabelText("corp deck list"));

      const runnerDeckTable = screen.getByLabelText("runner deck");
      expect(runnerDeckTable).toBeInTheDocument();
      expect(queryByTitle(runnerDeckTable, "Edit Deck")).not.toBeInTheDocument();
      verifyReadOnly(screen.getByLabelText("runner deck list"));
    });
  });
});
