import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import StageSettings from "./StageSettings.svelte";
import TableRangeEdit from "./TableRangeEdit.svelte";
import {
  StageData,
  ValidationError,
  loadStage,
  saveStage,
  type Stage,
} from "./StageSettings";

vi.mock("$app/env/public", () => ({
  COBRA_API_SERVER: "http://localhost:3000",
}));

function getFetchCall(mock: { mock: { calls: unknown[][] } }, callIndex = 0) {
  const [input, requestOptions] = mock.mock.calls[callIndex] as [RequestInfo | URL, RequestInit | undefined];
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const headers = (requestOptions?.headers ?? {}) as Record<string, string>;
  const body =
    typeof requestOptions?.body === "string"
      ? (JSON.parse(requestOptions.body) as Record<string, unknown>)
      : {};
  return { url, requestOptions, headers, body };
}

describe("StageSettings API helpers", () => {
  const mockFetch = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads stage settings successfully", async () => {
    const mockData = {
      stage: {
        id: 1,
        tournament_id: 10,
        number: 1,
        format: "Swiss",
        table_ranges: [
          { id: 5, stage_id: 1, first_table: 1, last_table: 10 },
        ],
      },
      warning: "Table count warning",
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    );

    const result = await loadStage(10, 1, mockFetch);
    expect(result.stage.format).toBe("Swiss");
    expect(result.stage.table_ranges).toHaveLength(1);
    expect(result.warning).toBe("Table count warning");

    const { url, requestOptions } = getFetchCall(mockFetch);
    expect(url).toContain("/tournaments/10/stages/1/settings");
    expect(requestOptions?.method).toBe("GET");
  });

  it("throws an error if loadStage fails", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    );

    await expect(loadStage(10, 1, mockFetch)).rejects.toThrow(
      "HTTP 500: Internal Server Error",
    );
  });

  it("saves stage successfully", async () => {
    const stage: Stage = {
      id: 1,
      tournament_id: 10,
      number: 1,
      format: "Swiss",
      table_ranges: [{ id: 5, stage_id: 1, first_table: 1, last_table: 10 }],
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ url: "/tournaments/10/stages/1" }), {
        status: 200,
      }),
    );

    const result = await saveStage(10, stage, mockFetch, "test-token");
    expect(result.url).toBe("/tournaments/10/stages/1");

    const { url, requestOptions, headers, body } = getFetchCall(mockFetch);
    expect(url).toContain("/tournaments/10/stages/1");
    expect(requestOptions?.method).toBe("PATCH");
    expect(headers["X-CSRF-Token"]).toBe("test-token");
    expect(body).toEqual({ stage });
  });

  it("throws ValidationError when saving stage with invalid ranges (422)", async () => {
    const stage: Stage = {
      id: 1,
      tournament_id: 10,
      number: 1,
      format: "Swiss",
      table_ranges: [{ stage_id: 1, first_table: 10, last_table: 5 }],
    };

    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: "The first table must be less than the last table.",
        }),
        { status: 422 },
      ),
    );

    await expect(
      saveStage(10, stage, mockFetch, "test-token"),
    ).rejects.toThrow(ValidationError);
  });
});

describe("TableRangeEdit component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders existing table range inputs and deletes on trash click", async () => {
    const user = userEvent.setup();
    const stage: Stage = {
      id: 1,
      tournament_id: 10,
      number: 1,
      format: "Swiss",
      table_ranges: [{ id: 5, stage_id: 1, first_table: 1, last_table: 10 }],
    };

    render(TableRangeEdit, {
      props: {
        stage,
        tableRange: stage.table_ranges[0],
      },
    });

    const firstInput = screen.getByLabelText<HTMLInputElement>("First Table");
    const lastInput = screen.getByLabelText<HTMLInputElement>("Last Table");
    expect(firstInput.value).toBe("1");
    expect(lastInput.value).toBe("10");

    const deleteBtn = screen.getByRole("button", { name: "Delete range" });
    await user.click(deleteBtn);
    expect(stage.table_ranges).toHaveLength(0);
  });

  it("validates and adds new table range on plus click", async () => {
    const user = userEvent.setup();
    const stage: Stage = {
      id: 1,
      tournament_id: 10,
      number: 1,
      format: "Swiss",
      table_ranges: [],
    };

    render(TableRangeEdit, {
      props: {
        stage,
      },
    });

    const firstInput = screen.getByLabelText("First Table");
    const lastInput = screen.getByLabelText("Last Table");
    const addBtn = screen.getByRole<HTMLButtonElement>("button", { name: "Add range" });

    // Initially disabled
    expect(addBtn.disabled).toBe(true);

    // Enter valid range
    await user.type(firstInput, "1");
    await user.type(lastInput, "8");
    expect(addBtn.disabled).toBe(false);

    await user.click(addBtn);
    expect(stage.table_ranges).toHaveLength(1);
    expect(stage.table_ranges[0]).toEqual({
      stage_id: 1,
      first_table: 1,
      last_table: 8,
    });
  });
});

describe("StageSettings Page Component", () => {
  const user = userEvent.setup();

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function createMockStageData(): StageData {
    const data = new StageData();
    data.stage = {
      id: 1,
      tournament_id: 10,
      number: 1,
      format: "Swiss",
      table_ranges: [
        { id: 1, stage_id: 1, first_table: 1, last_table: 5 },
      ],
    };
    data.warning = "Custom warning message";
    return data;
  }

  it("renders stage format, custom table ranges, warning, and back link", () => {
    const mockData = createMockStageData();

    render(StageSettings, {
      props: {
        tournamentId: 10,
        stageId: 1,
        initialData: mockData,
      },
    });

    expect(screen.getByRole("heading", { level: 2, name: "Swiss" })).toBeDefined();
    expect(screen.getByText("Custom warning message")).toBeDefined();

    const backLink = screen.getByRole("link", { name: /Back to Pairings/i });
    expect(backLink.getAttribute("href")).toBe("/tournaments/10/organizer/rounds");

    const inputs = screen.getAllByPlaceholderText<HTMLInputElement>("Enter table number");
    expect(inputs).toHaveLength(4); // 2 for existing range, 2 for new range
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("5");
  });

  it("automatically adds pending range and calls save on submit", async () => {
    const mockData = createMockStageData();
    const onSave = vi.fn();

    const fetchSpy = vi.spyOn(window, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ url: "/tournaments/10/stages/1" }), {
        status: 200,
      }),
    );

    render(StageSettings, {
      props: {
        tournamentId: 10,
        stageId: 1,
        initialData: mockData,
        onSaveCallback: onSave,
      },
    });

    const inputs = screen.getAllByPlaceholderText("Enter table number");
    // Enter into the empty range row (inputs 2 and 3)
    await user.type(inputs[2], "6");
    await user.type(inputs[3], "10");

    const saveBtn = screen.getByRole("button", { name: "Save stage" });
    await user.click(saveBtn);

    expect(onSave).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledOnce();
    const { body } = getFetchCall(fetchSpy);
    const stageBody = body.stage as Stage;
    expect(stageBody.table_ranges).toHaveLength(2);
    expect(stageBody.table_ranges[1]).toEqual({
      stage_id: 1,
      first_table: 6,
      last_table: 10,
    });
  });

  it("reverts changes when clicking Undo", async () => {
    const mockData = createMockStageData();

    render(StageSettings, {
      props: {
        tournamentId: 10,
        stageId: 1,
        initialData: mockData,
      },
    });

    const deleteBtn = screen.getByRole("button", { name: "Delete range" });
    await user.click(deleteBtn);
    expect(screen.getAllByPlaceholderText("Enter table number")).toHaveLength(2);

    const undoBtn = screen.getByRole("button", { name: /Undo/i });
    await user.click(undoBtn);

    // Reverted back to initial range
    const inputs = screen.getAllByPlaceholderText<HTMLInputElement>("Enter table number");
    expect(inputs).toHaveLength(4);
    expect(inputs[0].value).toBe("1");
    expect(inputs[1].value).toBe("5");
  });
});
