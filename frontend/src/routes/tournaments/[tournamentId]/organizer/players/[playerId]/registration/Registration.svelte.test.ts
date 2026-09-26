import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  cleanup,
  getByLabelText,
  getByRole,
  getByTestId,
  getByText,
  queryByDisplayValue,
  queryByText,
  render,
  screen,
  waitFor,
} from "@testing-library/svelte";
import Registration from "./+page.svelte";
import { Deck } from "$lib/model/Deck";
import type { PageProps } from "./$types";
import {
  MockBazPrinting,
  MockBetaBuildPrinting,
  MockPlayerAlice,
  MockPlayerBob,
  MockPlayerBobDecks,
  MockSureGamblePrinting,
  MockTournament,
  MockZahyaPrinting,
} from "./RegistrationTestData";
import { Identity } from "$lib/model/Identity";
import { savePlayer } from "../../../../../api_helper";

vi.mock('$app/env/public', () => {
  return {
    COBRA_API_SERVER: "http://localhost:3000"
  };
});

vi.mock("../../../../../api_helper", () => ({
  loadDecks: vi.fn(),
  loadTournament: vi.fn(),
  savePlayer: vi.fn(),
}));

const MockPageData: PageProps["data"] = {
  tournamentTypes: [],
  tournamentData: {
    tournament: MockTournament,
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
  player: MockPlayerAlice,
  registrationPlayer: MockPlayerBob,
  corpDeck: new Deck(),
  runnerDeck: new Deck()
};

const user = userEvent.setup();

describe("Registration", () => {
  function renderRegistration(
    corpDeck = new Deck(), runnerDeck = new Deck())
  {
    const props = {
      params: {
        tournamentId: MockTournament.id.toString(),
        playerId: MockPlayerBob.id.toString(),
      },
      data: MockPageData,
    };
    MockPageData.corpDeck = corpDeck;
    MockPageData.runnerDeck = runnerDeck;

    return render(Registration, { props: props });
  }

  beforeEach(() => {
    vi.restoreAllMocks();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("no existing decks", () => {
    it("displays new player information correctly", () => {
      renderRegistration();

      const registrationCard = screen.getByLabelText(
        "registration information",
      );
      expect(getByLabelText(registrationCard, "Name")).toHaveValue("Bob");
      expect(getByLabelText(registrationCard, "Pronouns")).toHaveValue(
        "he/him",
      );
      expect(
        getByLabelText(registrationCard, "Video coverage allowed"),
      ).not.toBeChecked();

      expect(screen.getByLabelText("corp deck")).toHaveTextContent(
        "No deck selected",
      );
      expect(screen.getByLabelText("runner deck")).toHaveTextContent(
        "No deck selected",
      );
    });

    it("allows standard player info to be edited", async () => {
      renderRegistration();

      const registrationCard = screen.getByLabelText(
        "registration information",
      );
      await user.clear(getByLabelText(registrationCard, "Name"));
      await user.type(getByLabelText(registrationCard, "Name"), "Bob Again");
      await user.clear(getByLabelText(registrationCard, "Pronouns"));
      await user.type(
        getByLabelText(registrationCard, "Pronouns"),
        "they/them",
      );
      await user.click(
        getByLabelText(registrationCard, "Video coverage allowed"),
      );

      await user.click(getByRole(registrationCard, "button", { name: "Save" }));

      const bobEdit = structuredClone(MockPlayerBob);
      bobEdit.name = "Bob Again";
      bobEdit.pronouns = "they/them";
      bobEdit.include_in_stream = true;
      bobEdit.corp_id = new Identity();
      bobEdit.runner_id = new Identity();

      expect(savePlayer).toHaveBeenCalledExactlyOnceWith(
        MockTournament.id,
        bobEdit,
        true,
      );
    });
  });

  describe("existing decks", () => {
    describe("editing decks", () => {
      beforeEach(() => {
        renderRegistration(MockPlayerBobDecks[0], MockPlayerBobDecks[1]);
      });

      it("add a card", async () => {
        await user.click(
          getByRole(
            screen.getByLabelText("registration information"),
            "button",
            { name: "Edit decks in place" },
          ),
        );

        vi.spyOn(window, "fetch").mockReturnValue(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [MockBetaBuildPrinting] }),
          } as Response)
        );

        const runnerDeckTable = screen.getByLabelText("runner deck list");

        // Add card
        const newCardRow = getByTestId(runnerDeckTable, "new_card_row");
        getByRole(newCardRow, "textbox").focus();
        await user.keyboard("beta");
        await waitFor(() => {
          expect(getByText(newCardRow, "Build")).toBeInTheDocument();
        });
        await user.keyboard("{Enter}");

        // Validate new card
        expect(
          getByText(runnerDeckTable, MockBetaBuildPrinting.attributes.title),
        ).toBeInTheDocument();
        expect((newCardRow as HTMLInputElement).value).toBeUndefined();

        // Validate diff
        expect(screen.getByLabelText("runner deck changes")).toHaveTextContent(
          `ChangesQty${MockBetaBuildPrinting.attributes.title}+1`,
        );
      });

      it("change a card", async () => {
        await user.click(
          getByRole(
            screen.getByLabelText("registration information"),
            "button",
            { name: "Edit decks in place" },
          ),
        );

        vi.spyOn(window, "fetch").mockReturnValue(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [MockBetaBuildPrinting] }),
          } as Response)
        );

        let cardRow = getByTestId(
          screen.getByLabelText("runner deck list"),
          `card_${MockSureGamblePrinting.attributes.card_id}_row`,
        );

        // Change card
        await user.click(getByRole(cardRow, "button", { name: "Edit" }));
        expect(
          getByRole(cardRow, "button", { name: "Cancel" }),
        ).toBeInTheDocument();
        getByRole(cardRow, "textbox").focus();
        await user.keyboard("beta");
        await waitFor(() => {
          expect(getByText(cardRow, "Build")).toBeInTheDocument();
        });
        await user.keyboard("{Enter}");
        cardRow = getByTestId(
          screen.getByLabelText("runner deck list"),
          `card_${MockBetaBuildPrinting.attributes.card_id}_row`,
        );
        await waitFor(() =>
          expect(
            getByRole(cardRow, "button", { name: "Edit" }),
          ).toBeInTheDocument(),
        );

        // Validate change
        expect(
          queryByText(cardRow, MockBetaBuildPrinting.attributes.title),
        ).toBeInTheDocument();
        expect(
          queryByText(cardRow, MockSureGamblePrinting.attributes.title),
        ).not.toBeInTheDocument();

        // Validate diff
        expect(screen.getByLabelText("runner deck changes")).toHaveTextContent(
          `ChangesQty${MockSureGamblePrinting.attributes.title}-3${MockBetaBuildPrinting.attributes.title}+3`,
        );
      });

      it("change a card's quantity", async () => {
        await user.click(
          getByRole(
            screen.getByLabelText("registration information"),
            "button",
            { name: "Edit decks in place" },
          ),
        );

        const runnerDeckTable = screen.getByLabelText("runner deck list");
        const cardRow = getByTestId(
          runnerDeckTable,
          `card_${MockSureGamblePrinting.attributes.card_id}_row`,
        );
        const runnerDiffsTable = screen.getByLabelText("runner deck changes");

        // -1 quantity
        await user.click(getByRole(cardRow, "button", { name: "Remove" }));
        expect(cardRow).toHaveTextContent("2");
        expect(runnerDiffsTable).toHaveTextContent(
          `ChangesQty${MockSureGamblePrinting.attributes.title}-1`,
        );

        // +1 quantity
        await user.click(getByRole(cardRow, "button", { name: "Add" }));
        expect(cardRow).toHaveTextContent("3");
        expect(runnerDiffsTable).toHaveTextContent("ChangesQtyNo changes");
      });

      it("remove a card", async () => {
        await user.click(
          getByRole(
            screen.getByLabelText("registration information"),
            "button",
            { name: "Edit decks in place" },
          ),
        );

        const runnerDeckTable = screen.getByLabelText("runner deck list");

        // Remove card
        const cardRow = getByTestId(
          runnerDeckTable,
          `card_${MockSureGamblePrinting.attributes.card_id}_row`,
        );
        const removeButton = getByRole(cardRow, "button", { name: "Remove" });
        await user.click(removeButton);
        await user.click(removeButton);
        await user.click(removeButton);

        // Validate removal
        expect(
          queryByDisplayValue(
            runnerDeckTable,
            MockSureGamblePrinting.attributes.title,
          ),
        ).not.toBeInTheDocument();

        // Validate diffs
        expect(screen.getByLabelText("runner deck changes")).toHaveTextContent(
          `ChangesQty${MockSureGamblePrinting.attributes.title}-3`,
        );
      });

      it("change an identity", async () => {
        await user.click(
          getByRole(
            screen.getByLabelText("registration information"),
            "button",
            { name: "Edit decks in place" },
          ),
        );

        vi.spyOn(window, "fetch").mockReturnValue(
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [MockZahyaPrinting] }),
          } as Response)
        );

        const cardRow = getByTestId(
          screen.getByLabelText("runner deck ID"),
          `identity_row`,
        );

        // Change identity
        await user.click(getByRole(cardRow, "button", { name: "Edit" }));
        expect(
          getByRole(cardRow, "button", { name: "Cancel" }),
        ).toBeInTheDocument();
        getByRole(cardRow, "textbox").focus();
        await user.keyboard("zahya");
        await waitFor(() => {
          expect(
            getByText(cardRow, "Sadeghi: Versatile Smuggler"),
          ).toBeInTheDocument();
        });
        await user.keyboard("{Enter}");
        await waitFor(() =>
          expect(
            getByRole(cardRow, "button", { name: "Edit" }),
          ).toBeInTheDocument(),
        );

        // Validate change
        expect(
          queryByText(cardRow, MockZahyaPrinting.attributes.title),
        ).toBeInTheDocument();
        expect(
          queryByText(cardRow, MockBazPrinting.attributes.title),
        ).not.toBeInTheDocument();

        // Validate diffs
        expect(screen.getByLabelText("runner deck changes")).toHaveTextContent(
          `ChangesQty${MockBazPrinting.attributes.title}-1${MockZahyaPrinting.attributes.title}+1`,
        );
      });
    });
  });
});
