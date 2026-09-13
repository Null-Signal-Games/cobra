import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import DangerZonePage from "./+page.svelte";
import { Tournament } from "$lib/model/Tournament";
import type { Stage } from "$lib/model/Stage";
import { deleteStage, deleteTournament } from "../../api_helper";
import { goto, invalidateAll } from "$app/navigation";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

vi.mock("../../api_helper", () => ({
  deleteTournament: vi.fn(),
  deleteStage: vi.fn(),
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
  invalidateAll: vi.fn(),
}));

describe("Danger Zone Page", () => {
  const user = userEvent.setup();

  const mockTournament = new Tournament();
  mockTournament.id = 1;
  mockTournament.name = "World Championship 2026";

  const mockSwissStage: Stage = {
    id: 101,
    name: "Single Sided Swiss",
    format: "single_sided_swiss",
    is_single_sided: true,
    is_elimination: false,
    view_decks: false,
    rounds: [],
  };

  const mockElimStage: Stage = {
    id: 102,
    name: "Single Elim",
    format: "single_elim",
    is_single_sided: true,
    is_elimination: true,
    view_decks: false,
    rounds: [],
  };

  const mockData = {
    tournamentData: {
      tournament: mockTournament,
      csrf_token: "test-csrf-token",
    },
    stages: [mockSwissStage, mockElimStage],
  };

  function renderPage() {
    return render(DangerZonePage, {
      params: { tournamentId: "1" },
      // @ts-expect-error PageProps includes additional layout properties
      data: mockData,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    globalMessages.errors = [];
    globalMessages.infos = [];
    globalMessages.warnings = [];
  });

  afterEach(() => {
    cleanup();
  });

  it("renders tournament deletion and all stage deletion sections with disabled buttons", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Delete Entire Tournament" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Delete Single Sided Swiss Stage" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Delete Single Elim Stage" })).toBeInTheDocument();

    const deleteTournamentBtn = screen.getByRole("button", {
      name: "Delete Tournament",
    });
    const deleteSwissBtn = screen.getByRole("button", {
      name: "Delete Single Sided Swiss Stage",
    });
    const deleteElimBtn = screen.getByRole("button", {
      name: "Delete Single Elim Stage",
    });

    expect(deleteTournamentBtn).toBeDisabled();
    expect(deleteSwissBtn).toBeDisabled();
    expect(deleteElimBtn).toBeDisabled();
  });

  it("enables tournament delete button only when tournament name matches exactly", async () => {
    renderPage();

    const tournamentInput = document.getElementById("tournament_name") as HTMLInputElement;
    const deleteTournamentBtn = screen.getByRole("button", {
      name: "Delete Tournament",
    });

    expect(deleteTournamentBtn).toBeDisabled();

    await user.type(tournamentInput, "Wrong Name");
    expect(deleteTournamentBtn).toBeDisabled();

    await user.clear(tournamentInput);
    await user.type(tournamentInput, "World Championship 2026");
    expect(deleteTournamentBtn).toBeEnabled();

    await user.clear(tournamentInput);
    expect(deleteTournamentBtn).toBeDisabled();
  });

  it("prompts for confirmation and deletes tournament on confirm", async () => {
    vi.mocked(deleteTournament).mockResolvedValue(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    const tournamentInput = document.getElementById("tournament_name") as HTMLInputElement;
    const deleteTournamentBtn = screen.getByRole("button", {
      name: "Delete Tournament",
    });

    await user.type(tournamentInput, "World Championship 2026");
    await user.click(deleteTournamentBtn);

    expect(confirmSpy).toHaveBeenCalledWith("Are you absolutely sure? This cannot be reversed.");
    expect(deleteTournament).toHaveBeenCalledWith(1, "test-csrf-token");
    expect(goto).toHaveBeenCalledWith("/tournaments");
  });

  it("does not delete tournament if confirmation is cancelled", async () => {
    vi.mocked(deleteTournament).mockResolvedValue(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();

    const tournamentInput = document.getElementById("tournament_name") as HTMLInputElement;
    const deleteTournamentBtn = screen.getByRole("button", {
      name: "Delete Tournament",
    });

    await user.type(tournamentInput, "World Championship 2026");
    await user.click(deleteTournamentBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteTournament).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
  });

  it("does not redirect if deleteTournament returns false", async () => {
    vi.mocked(deleteTournament).mockResolvedValue(false);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    const tournamentInput = document.getElementById("tournament_name") as HTMLInputElement;
    const deleteTournamentBtn = screen.getByRole("button", {
      name: "Delete Tournament",
    });

    await user.type(tournamentInput, "World Championship 2026");
    await user.click(deleteTournamentBtn);

    expect(deleteTournament).toHaveBeenCalledWith(1, "test-csrf-token");
    expect(goto).not.toHaveBeenCalled();
  });

  it("deletes stage on confirmation, invalidates data, and shows success message", async () => {
    vi.mocked(deleteStage).mockResolvedValue(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    const swissInput = document.getElementById("tournament_stage_name_101") as HTMLInputElement;
    const deleteSwissBtn = screen.getByRole("button", {
      name: "Delete Single Sided Swiss Stage",
    });

    expect(deleteSwissBtn).toBeDisabled();

    await user.type(swissInput, "World Championship 2026");
    expect(deleteSwissBtn).toBeEnabled();

    await user.click(deleteSwissBtn);

    expect(confirmSpy).toHaveBeenCalledWith("Are you absolutely sure? This cannot be reversed.");
    expect(deleteStage).toHaveBeenCalledWith(1, 101, "test-csrf-token");
    expect(invalidateAll).toHaveBeenCalledOnce();
    expect(globalMessages.infos).toContain("Stage deleted.");
  });

  it("does not delete stage if confirmation is cancelled", async () => {
    vi.mocked(deleteStage).mockResolvedValue(true);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    renderPage();

    const swissInput = document.getElementById("tournament_stage_name_101") as HTMLInputElement;
    const deleteSwissBtn = screen.getByRole("button", {
      name: "Delete Single Sided Swiss Stage",
    });

    await user.type(swissInput, "World Championship 2026");
    await user.click(deleteSwissBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(deleteStage).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it("does not invalidate or show info message if deleteStage returns false", async () => {
    vi.mocked(deleteStage).mockResolvedValue(false);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderPage();

    const elimInput = document.getElementById("tournament_stage_name_102") as HTMLInputElement;
    const deleteElimBtn = screen.getByRole("button", {
      name: "Delete Single Elim Stage",
    });

    await user.type(elimInput, "World Championship 2026");
    await user.click(deleteElimBtn);

    expect(deleteStage).toHaveBeenCalledWith(1, 102, "test-csrf-token");
    expect(invalidateAll).not.toHaveBeenCalled();
    expect(globalMessages.infos).toHaveLength(0);
  });
});
