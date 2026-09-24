import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import {
  cleanup,
  getByLabelText,
  getByRole,
  render,
  screen,
} from "@testing-library/svelte";
import Registration from "./+page.svelte";
import { Deck, type NrdbDeck } from "$lib/model/Deck";
import { savePlayer } from "../../api_helper";
import { convertNrdbDeck } from "$lib/utils/decks.svelte";
import type { PageProps } from "./$types";
import {
  MockPlayerBob,
  MockPlayerBobNrdbDecks,
  MockPrintings,
  MockTournament,
} from "./RegistrationTestData";
import { Identity } from "$lib/model/Identity";

vi.mock('$app/env/public', () => {
  return {
    COBRA_API_SERVER: "http://localhost:3000"
  };
});

vi.mock("../../api_helper", () => ({
  loadDecks: vi.fn(() => true),
  loadTournament: vi.fn(() => true),
  savePlayer: vi.fn(() => true),
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
  player: MockPlayerBob,
  nrdbDecks: Promise.resolve([]),
  originalCorpDeck: new Deck(),
  originalRunnerDeck: new Deck()
};

const user = userEvent.setup();

describe("Registration", () => {
  async function renderRegistration(
    decks: NrdbDeck[],
    selectedCorpDeckIndex?: number,
    selectedRunnerDeckIndex?: number
  ) {
    const props = {
      params: {
        tournamentId: MockTournament.id.toString()
      },
      data: MockPageData,
    };
    const convertedDecks = decks.map((d) => convertNrdbDeck(d, MockPrintings));
    MockPageData.nrdbDecks = Promise.resolve(convertedDecks);
    if (selectedCorpDeckIndex !== undefined) {
      MockPageData.originalCorpDeck = convertedDecks[0];
    }
    if (selectedRunnerDeckIndex !== undefined) {
      MockPageData.originalRunnerDeck = convertedDecks[1];
    }

    await MockPageData.nrdbDecks;

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
    it("displays new player information correctly", async () => {
      await renderRegistration([]);

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

      expect(
        screen.queryByText("You have no decks saved in NRDB.", {
          exact: false,
        }),
      ).not.toBeNull();
      expect(screen.getByLabelText("corp deck")).toHaveTextContent(
        "No deck selected",
      );
      expect(screen.getByLabelText("runner deck")).toHaveTextContent(
        "No deck selected",
      );
    });

    it("allows standard player info to be edited", async () => {
      await renderRegistration([]);

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

    it("allows deck selection", async () => {
      await renderRegistration(MockPlayerBobNrdbDecks);

      const corpDeckHeaderTable = screen.getByLabelText("corp deck");
      const runnerDeckHeaderTable = screen.getByLabelText("runner deck");

      expect(corpDeckHeaderTable).toHaveTextContent("No deck selected");
      expect(runnerDeckHeaderTable).toHaveTextContent("No deck selected");

      const corpDeckButton = getByRole(
        screen.getByLabelText("NRDB corp decks"),
        "button",
        { name: /bob's bangun.*/i },
      );
      expect(corpDeckButton).not.toHaveClass("active");
      await user.click(corpDeckButton);
      expect(corpDeckButton).toHaveClass("active");
      expect(screen.getByLabelText("corp deck")).toHaveTextContent(
        "Bob's BANGUN",
      );
      expect(screen.getByLabelText("corp deck ID")).toHaveTextContent(
        "BANGUN: When Disaster Strikes",
      );
      expect(screen.getByLabelText("corp deck list")).toHaveTextContent(
        "3 Hedge Fund",
      );

      const runnerDeckButton = getByRole(
        screen.getByLabelText("NRDB runner decks"),
        "button",
        { name: /bob's baz.*/i },
      );
      expect(runnerDeckButton).not.toHaveClass("active");
      await user.click(runnerDeckButton);
      expect(runnerDeckButton).toHaveClass("active");
      expect(runnerDeckHeaderTable).toHaveTextContent("Bob's Baz");
      expect(screen.getByLabelText("runner deck ID")).toHaveTextContent(
        "Barry “Baz” Wong: Tri-Maf Veteran",
      );
      expect(screen.getByLabelText("runner deck list")).toHaveTextContent(
        "3 Sure Gamble",
      );
    });
  });

  describe("existing decks", () => {
    it("displays existing decks correctly", async () => {
      await renderRegistration(MockPlayerBobNrdbDecks, 0, 1);

      expect(
        getByRole(screen.getByLabelText("NRDB corp decks"), "button", {
          name: /bob's bangun.*/i,
        }),
      ).toHaveClass("active");
      expect(screen.getByLabelText("corp deck")).toHaveTextContent(
        "Bob's BANGUN",
      );
      expect(screen.getByLabelText("corp deck ID")).toHaveTextContent(
        "BANGUN: When Disaster Strikes",
      );
      expect(screen.getByLabelText("corp deck list")).toHaveTextContent(
        "3 Hedge Fund",
      );

      expect(
        getByRole(screen.getByLabelText("NRDB runner decks"), "button", {
          name: /bob's baz.*/i,
        }),
      ).toHaveClass("active");
      expect(screen.getByLabelText("runner deck")).toHaveTextContent(
        "Bob's Baz",
      );
      expect(screen.getByLabelText("runner deck ID")).toHaveTextContent(
        "Barry “Baz” Wong: Tri-Maf Veteran",
      );
      expect(screen.getByLabelText("runner deck list")).toHaveTextContent(
        "3 Sure Gamble",
      );
    });
  });
});
