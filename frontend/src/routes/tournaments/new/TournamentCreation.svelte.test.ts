import type { ComponentProps } from "svelte";
import type { PageProps } from "./$types";
import { Tournament } from "$lib/model/Tournament";
import { ValidationError } from "$lib/utils/errors";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TournamentCreation from "./+page.svelte";
import { navigateTo } from "$lib/utils/navigation";

vi.mock("$app/env/public", () => ({
  COBRA_API_SERVER: "http://localhost:3000",
}));

vi.mock("$lib/api/classic", () => ({
  createTournament: vi.fn(),
}));

vi.mock("$lib/utils/navigation", () => ({
  navigateTo: vi.fn(),
}));

describe("TournamentCreation", () => {
  const mockTournamentData = {
    tournament: new Tournament({
      date: "2023-12-25",
      private: false,
      swiss_format: "double_sided",
      allow_self_reporting: false,
      decklist_required: false,
      nrdb_deck_registration: false,
    }),
    options: {
      tournament_types: [{ id: 1, name: "Store Championship" }],
      formats: [{ id: 1, name: "Standard" }],
      card_sets: [{ id: 1, name: "System Gateway" }],
      deckbuilding_restrictions: [{ id: 1, name: "Standard Ban List" }],
      time_zones: [{ id: "UTC", name: "(GMT+00:00) UTC" }],
      official_prize_kits: [{ id: 1, name: "2025 Q1 Game Night Kit" }],
    },
    feature_flags: {
      single_sided_swiss: true,
      nrdb_deck_registration: true,
      allow_self_reporting: true,
      streaming_opt_out: true,
    },
    csrf_token: "fake-csrf-token",
  };

  const createProps = (
    dataPartial: Partial<PageProps["data"]> = {},
  ): ComponentProps<typeof TournamentCreation> => ({
    params: {},
    data: {
      tournamentTypes: [],
      tournamentSettings: mockTournamentData,
      ...dataPartial,
    },
  });

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the tournament creation form", async () => {
    render(TournamentCreation, { props: createProps() });

    await waitFor(() => {
      expect(screen.getByText("Create a tournament")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create/i })).toBeInTheDocument();
  });

  it("shows a loading spinner", () => {
    render(TournamentCreation, {
      props: createProps({
        tournamentSettings: {} as unknown as PageProps["data"]["tournamentSettings"],
      }),
    });

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    expect(screen.queryByLabelText(/tournament name/i)).not.toBeInTheDocument();
  });

  it("successfully creates a tournament", async () => {
    const { createTournament } = await import("$lib/api/classic");
    const mockResponse = {
      id: 123,
      name: "Test Tournament",
      url: "/tournaments/123",
    };
    vi.mocked(createTournament).mockResolvedValue(mockResponse);

    render(TournamentCreation, { props: createProps() });

    await waitFor(() => {
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    // Fill in the form
    const nameInput = screen.getByLabelText(/tournament name/i);
    await fireEvent.input(nameInput, { target: { value: "Test Tournament" } });

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createTournament).toHaveBeenCalledWith(
        "fake-csrf-token",
        expect.objectContaining({
          name: "Test Tournament",
        }),
      );
    });

    // Check that redirect happens
    await waitFor(() => {
      expect(navigateTo).toHaveBeenCalledWith("/tournaments/123");
    });
  });

  it("handles validation errors", async () => {
    const { createTournament } = await import("$lib/api/classic");
    const validationError = new ValidationError({
      name: ["Name is required"],
      date: ["Date must be in the future"],
    });
    vi.mocked(createTournament).mockRejectedValue(validationError);

    render(TournamentCreation, { props: createProps() });

    await waitFor(() => {
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument();
      expect(screen.getByText("Date must be in the future")).toBeInTheDocument();
    });
  });

  it("handles unexpected errors", async () => {
    const { createTournament } = await import("$lib/api/classic");
    vi.mocked(createTournament).mockRejectedValue(new Error("Network error"));

    render(TournamentCreation, { props: createProps() });

    await waitFor(() => {
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    // Submit the form
    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
    });
  });

  it("disables submit button while submitting", async () => {
    const { createTournament } = await import("$lib/api/classic");
    // Make createTournament hang to test loading state
    vi.mocked(createTournament).mockImplementation(
      () =>
        new Promise(() => {
          // This promise intentionally never resolves to test loading state
        }),
    );

    render(TournamentCreation, { props: createProps() });

    await waitFor(() => {
      expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /create/i,
    });
    await fireEvent.click(submitButton);

    // Button should be disabled while submitting
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });
});
