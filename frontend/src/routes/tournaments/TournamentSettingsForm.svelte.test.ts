/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { render, screen, fireEvent, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, afterEach } from "vitest";
import TournamentSettingsForm from "./TournamentSettingsForm.svelte";
import { Tournament, type TournamentOptions } from "$lib/model/Tournament";

describe("TournamentSettingsForm dropdowns", () => {
  afterEach(cleanup);

  const options: TournamentOptions = {
    tournament_types: [
      { id: 1, name: "Store Championship" },
      { id: 2, name: "Regional Championship" },
    ],
    formats: [
      { id: 1, name: "Standard" },
      { id: 2, name: "Startup" },
    ],
    card_sets: [
      { id: "vantage_point", name: "Vantage Point" },
      { id: "system_gateway", name: "System Gateway" },
    ],
    deckbuilding_restrictions: [{ id: "standard_balance_update_26_08", name: "Standard Ban List" }],
    time_zones: [
      { id: "UTC", name: "(GMT+00:00) UTC" },
      {
        id: "America/New_York",
        name: "(GMT-05:00) Eastern Time (US & Canada)",
      },
    ],
    official_prize_kits: [{ id: 1, name: "2025 Q1 Game Night Kit" }],
  };

  it("renders with initial dropdown values selected", () => {
    const tournament = new Tournament({
      name: "Test Tournament",
      swiss_format: "single_sided",
      tournament_type_id: 1,
      format_id: 1,
      card_set_id: "vantage_point",
      deckbuilding_restriction_id: "standard_balance_update_26_08",
      official_prize_kit_id: 1,
      time_zone: "UTC",
    });

    render(TournamentSettingsForm, {
      props: {
        tournament,
        options,
      },
    });

    const swissFormatSelect = screen.getByLabelText<HTMLSelectElement>("Swiss format");
    expect(swissFormatSelect.value).toBe("single_sided");

    const tournamentTypeSelect = screen.getByLabelText("Tournament Type") as HTMLSelectElement;
    expect(tournamentTypeSelect.value).toBe("1");

    const cardSetSelect = screen.getByLabelText("Legal Cardpool Up To") as HTMLSelectElement;
    expect(cardSetSelect.value).toBe("vantage_point");

    const formatSelect = screen.getByLabelText("Play Format") as HTMLSelectElement;
    expect(formatSelect.value).toBe("1");

    const restrictionSelect = screen.getByLabelText(
      "Deckbuilding Restriction",
    ) as HTMLSelectElement;
    expect(restrictionSelect.value).toBe("standard_balance_update_26_08");

    const prizeKitSelect = screen.getByLabelText("Official Prize Kit") as HTMLSelectElement;
    expect(prizeKitSelect.value).toBe("1");
  });

  it("calls onSubmitCallback with updated dropdown values", async () => {
    const tournament = new Tournament({
      name: "Test Tournament",
      swiss_format: "single_sided",
      tournament_type_id: 1,
      format_id: 1,
      card_set_id: "vantage_point",
      deckbuilding_restriction_id: "standard_balance_update_26_08",
      official_prize_kit_id: 1,
      time_zone: "UTC",
    });

    const mockOnSubmit = vi.fn();

    render(TournamentSettingsForm, {
      props: {
        tournament,
        options,
        onSubmitCallback: mockOnSubmit,
      },
    });

    const formatSelect = screen.getByLabelText("Play Format") as HTMLSelectElement;
    await fireEvent.change(formatSelect, { target: { value: "2" } });

    const tournamentTypeSelect = screen.getByLabelText("Tournament Type") as HTMLSelectElement;
    await fireEvent.change(tournamentTypeSelect, { target: { value: "2" } });

    const cardSetSelect = screen.getByLabelText("Legal Cardpool Up To") as HTMLSelectElement;
    await fireEvent.change(cardSetSelect, { target: { value: "system_gateway" } });

    const submitButton = screen.getByRole("button", { name: /save/i });
    await fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledOnce();
    const submitted = mockOnSubmit.mock.calls[0][0] as Tournament;
    expect(submitted.format_id).toBe(2);
    expect(submitted.tournament_type_id).toBe(2);
    expect(submitted.card_set_id).toBe("system_gateway");
  });

  it("disables swiss_format dropdown when canChangeSwissFormat is false", () => {
    const tournament = new Tournament({
      name: "Test Tournament",
      swiss_format: "single_sided",
    });

    render(TournamentSettingsForm, {
      props: {
        tournament,
        options,
        canChangeSwissFormat: false,
      },
    });

    const swissFormatSelect = screen.getByLabelText("Swiss format") as HTMLSelectElement;
    expect(swissFormatSelect).toBeDisabled();
    expect(
      screen.getByText("Swiss format cannot be changed once rounds exist."),
    ).toBeInTheDocument();
  });

  it("does not render ABR buttons without callbacks", () => {
    const tournament = new Tournament({ name: "Test Tournament", abr_code: "abc123" });

    render(TournamentSettingsForm, { props: { tournament, options } });

    expect(screen.queryByRole("button", { name: /upload to always be running/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /download as json/i })).toBeNull();
    expect(screen.queryByText(/uploaded to abr with code/i)).toBeNull();
  });

  it("renders ABR buttons and calls their callbacks with the tournament", async () => {
    const tournament = new Tournament({ name: "Test Tournament", abr_code: "abc123" });
    const mockUpload = vi.fn().mockResolvedValue(true);
    const mockDownload = vi.fn().mockResolvedValue(true);

    render(TournamentSettingsForm, {
      props: {
        tournament,
        options,
        onUploadToAbr: mockUpload,
        onDownloadJson: mockDownload,
      },
    });

    expect(screen.getByText("Uploaded to ABR with code abc123")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: /upload to always be running/i }));
    expect(mockUpload).toHaveBeenCalledWith(tournament);

    await fireEvent.click(screen.getByRole("button", { name: /download as json/i }));
    expect(mockDownload).toHaveBeenCalledWith(tournament);
  });
});
