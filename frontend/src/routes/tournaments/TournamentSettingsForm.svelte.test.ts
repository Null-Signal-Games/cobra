import { render, screen, fireEvent, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";
import TournamentSettingsForm from "./TournamentSettingsForm.svelte";
import { Tournament, type TournamentOptions } from "#lib/model/Tournament.ts";

// Svelecte keeps a hidden native <select> in sync with the chosen option's id.
function selectedValue(name: string) {
  return document.querySelector<HTMLSelectElement>(`select[name="${name}"]`)?.value;
}

// Type into a Svelecte's search box and choose the first match.
async function pick(label: string, search: string) {
  screen.getByLabelText(label).focus();
  await userEvent.keyboard(`${search}{Enter}`);
}

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
      { id: "UTC", name: "UTC" },
      { id: "America/Chicago", name: "America/Chicago" },
      { id: "America/New_York", name: "America/New York" },
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

    expect(selectedValue("swiss_format")).toBe("single_sided");
    expect(selectedValue("tournament_type_id")).toBe("1");
    expect(selectedValue("card_set_id")).toBe("vantage_point");
    expect(selectedValue("format_id")).toBe("1");
    expect(selectedValue("deckbuilding_restriction_id")).toBe("standard_balance_update_26_08");
    expect(selectedValue("official_prize_kit_id")).toBe("1");
    expect(screen.getByText("Store Championship")).toBeInTheDocument();
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

    await pick("Play Format", "Startup");
    await pick("Tournament Type", "Regional");
    await pick("Legal Cardpool Up To", "System Gateway");

    const submitButton = screen.getByRole("button", { name: /save/i });
    await fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledOnce();
    const submitted = mockOnSubmit.mock.calls[0][0] as Tournament;
    expect(submitted.format_id).toBe(2);
    expect(submitted.tournament_type_id).toBe(2);
    expect(submitted.card_set_id).toBe("system_gateway");
  });

  it("shows the selected time zone and submits a newly picked one", async () => {
    const tournament = new Tournament({ name: "Test Tournament", time_zone: "America/New_York" });
    const mockOnSubmit = vi.fn();

    render(TournamentSettingsForm, {
      props: { tournament, options, onSubmitCallback: mockOnSubmit },
    });

    expect(screen.getByText("America/New York")).toBeInTheDocument();

    await pick("Time zone", "Chicago");

    await fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mockOnSubmit).toHaveBeenCalledOnce();
    const submitted = mockOnSubmit.mock.calls[0][0] as Tournament;
    expect(submitted.time_zone).toBe("America/Chicago");
  });

  describe("browser time zone default", () => {
    function mockBrowserTimeZone(timeZone: string) {
      const resolved = Intl.DateTimeFormat().resolvedOptions();
      vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
        ...resolved,
        timeZone,
      });
    }

    afterEach(() => vi.restoreAllMocks());

    async function renderedTimeZone(tournament: Tournament) {
      render(TournamentSettingsForm, { props: { tournament, options } });
      await tick();
      return selectedValue("time_zone");
    }

    it("defaults an unset time zone to the browser's time zone if there is a match", async () => {
      mockBrowserTimeZone("America/Chicago");
      expect(await renderedTimeZone(new Tournament({ name: "T" }))).toBe("America/Chicago");
    });

    it("leaves an unset time zone empty when the browser's time zone is not a match", async () => {
      mockBrowserTimeZone("Europe/Warsaw");
      expect(await renderedTimeZone(new Tournament({ name: "T" }))).toBeFalsy();
    });

    it("keeps an existing time zone", async () => {
      mockBrowserTimeZone("America/Chicago");
      expect(await renderedTimeZone(new Tournament({ name: "T", time_zone: "UTC" }))).toBe("UTC");
    });
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

    expect(screen.getByLabelText("Swiss format")).toBeDisabled();
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
