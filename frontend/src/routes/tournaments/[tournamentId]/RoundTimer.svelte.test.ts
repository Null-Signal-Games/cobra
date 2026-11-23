import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import { makeRoundTimer } from "#lib/testing/fixtures.ts";
import RoundTimer from "./RoundTimer.svelte";

describe("RoundTimer", () => {
  afterEach(() => {
    cleanup();
  });

  // The modal repeats the label, so check the inline button.
  function timerButton() {
    return screen.getAllByRole("button")[0];
  }

  it("shows the remaining time and (paused) when paused", () => {
    render(RoundTimer, {
      props: {
        timer: makeRoundTimer({
          show: true,
          started: true,
          paused: true,
          state: { started: true, paused: true, remaining_seconds: 35 * 60 + 5 },
        }),
      },
    });

    expect(timerButton()).toHaveTextContent("Remaining in round (paused): 35:05");
  });

  it("shows the full round length before it starts", () => {
    render(RoundTimer, {
      props: {
        timer: makeRoundTimer({ state: { started: false, paused: false, length_minutes: 65 } }),
      },
    });

    expect(timerButton()).toHaveTextContent("Remaining in round: 65:00");
    expect(timerButton()).not.toHaveTextContent("(paused)");
  });

  it("counts down to the finish time while running", () => {
    const finishTime = new Date(Date.now() + 10 * 60 * 1000 + 500).toISOString();
    render(RoundTimer, {
      props: {
        timer: makeRoundTimer({
          show: true,
          started: true,
          running: true,
          state: { started: true, paused: false, finish_time: finishTime },
        }),
      },
    });

    expect(timerButton()).toHaveTextContent(/Remaining in round: 10:0[01]/);
  });
});
