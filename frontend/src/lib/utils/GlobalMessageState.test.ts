import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addError, globalMessages, setErrors, setWarnings } from "./GlobalMessageState.svelte";

describe("globalMessages helpers", () => {
  beforeEach(() => {
    globalMessages.errors = [];
    globalMessages.warnings = [];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records messages in the browser", () => {
    vi.stubGlobal("window", {});

    addError("first");
    addError("second");
    setWarnings(["careful"]);

    expect(globalMessages.errors).toEqual(["first", "second"]);
    expect(globalMessages.warnings).toEqual(["careful"]);

    setErrors(["replaced"]);
    expect(globalMessages.errors).toEqual(["replaced"]);
  });

  it("drops messages on the server, where the state is shared across requests", () => {
    vi.stubGlobal("window", undefined);

    addError("someone else's error");
    setErrors(["someone else's errors"]);
    setWarnings(["someone else's warning"]);

    expect(globalMessages.errors).toEqual([]);
    expect(globalMessages.warnings).toEqual([]);
  });
});
