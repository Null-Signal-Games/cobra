import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import type { Player } from "#lib/model/Player.ts";
import type { Round as RoundModel } from "#lib/model/Round.ts";
import type { Stage } from "#lib/model/Stage.ts";
import {
  makeBye,
  makePairing,
  makePlayer,
  makeRound,
  makeStage,
  makeTournament,
} from "#lib/testing/fixtures.ts";
import { authStore } from "#lib/utils/auth.svelte.ts";
import Round from "./Round.svelte";

vi.mock("$app/env/public", () => ({ CLIENT_COBRA_API_ENDPOINT: "http://localhost:3000" }));

describe("Organizer round", () => {
  beforeEach(() => {
    vi.spyOn(authStore, "checkAuth").mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function renderRound(
    round: RoundModel,
    stage: Stage = makeStage(),
    allowStreamingOptOut = false,
  ) {
    return render(Round, {
      props: {
        tournament: makeTournament({ allow_streaming_opt_out: allowStreamingOptOut }),
        stage,
        round,
        startExpanded: true,
        changePlayerSideCallback: vi.fn(),
        updateTimerCallback: vi.fn(),
        completeCallback: vi.fn(),
      },
    });
  }

  function roundWith(player1: Player, player2: Player, overrides: Partial<RoundModel> = {}) {
    return makeRound({ pairings: [makePairing({ player1, player2 })], ...overrides });
  }

  describe("round controls", () => {
    it("shows the timer form and Complete button while the round is open", () => {
      const { container } = renderRound(makeRound());

      expect(container.querySelector(".round-timer-form")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Complete/ })).toBeInTheDocument();
    });

    it("hides the timer form and Complete button once the round is completed", () => {
      const { container } = renderRound(makeRound({ completed: true }));

      expect(container.querySelector(".round-timer-form")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Complete/ })).not.toBeInTheDocument();
    });
  });

  describe("bye", () => {
    it("shows (Bye) when streaming opt-out is on", () => {
      renderRound(roundWith(makePlayer({ name: "plural" }), makeBye()), makeStage(), true);

      expect(screen.getByText("(Bye)")).toBeInTheDocument();
      expect(screen.getByText("plural")).toBeInTheDocument();
    });

    it("offers no side buttons for a bye in an elimination stage", () => {
      renderRound(
        roundWith(makePlayer({ name: "plural" }), makeBye()),
        makeStage({ is_single_sided: true, is_elimination: true }),
      );

      expect(screen.getByText("plural")).toBeInTheDocument();
      expect(screen.getByText("(Bye)")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /change plural to/ })).not.toBeInTheDocument();
    });
  });

  describe("double elimination", () => {
    const stage = makeStage({ format: "double_elim", is_single_sided: true, is_elimination: true });
    const plural = makePlayer({ id: 1, name: "plural" });
    const spiderbro = makePlayer({ id: 2, name: "spiderbro", user_id: 2 });

    it("offers Corp and Runner side buttons for each player", () => {
      renderRound(roundWith(plural, spiderbro), stage);

      for (const name of ["plural", "spiderbro"]) {
        expect(screen.getByRole("button", { name: `change ${name} to corp` })).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: `change ${name} to runner` }),
        ).toBeInTheDocument();
      }
    });

    it("offers winner presets once sides are chosen", () => {
      renderRound(
        roundWith(
          makePlayer({ id: 1, name: "plural", side: "corp" }),
          makePlayer({ id: 2, name: "spiderbro", user_id: 2, side: "runner" }),
        ),
        stage,
      );

      expect(screen.getByRole("button", { name: "3-0" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "0-3" })).toBeInTheDocument();
    });
  });
});
