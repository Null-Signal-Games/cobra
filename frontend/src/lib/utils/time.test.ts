import { describe, it, expect } from "vitest";
import { formatWallClockTime } from "./time";

describe("formatWallClockTime", () => {
  it("formats an HH:MM time in the given locale", () => {
    expect(formatWallClockTime("11:26", "en-US")).toBe("11:26 AM");
    expect(formatWallClockTime("18:05", "en-US")).toBe("06:05 PM");
    expect(formatWallClockTime("18:05", "en-GB")).toBe("18:05");
  });

  it("returns unrecognized values unchanged", () => {
    expect(formatWallClockTime("soon", "en-US")).toBe("soon");
  });
});
