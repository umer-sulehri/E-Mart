import { describe, it, expect } from "vitest";
import { formatDuration } from "../format-duration";

describe("formatDuration", () => {
  it("reports 'now' for a duration that has already elapsed", () => {
    expect(formatDuration(0)).toBe("now");
    expect(formatDuration(-5000)).toBe("now");
  });

  it("reports 'now' for a non-finite duration", () => {
    expect(formatDuration(NaN)).toBe("now");
    expect(formatDuration(Infinity)).toBe("now");
  });

  it("formats sub-hour durations in minutes", () => {
    expect(formatDuration(5 * 60 * 1000)).toBe("5m");
    expect(formatDuration(59 * 60 * 1000)).toBe("59m");
  });

  it("formats hours and minutes for the common quota countdown", () => {
    expect(formatDuration(18 * 60 * 60 * 1000)).toBe("18h 0m");
    expect(formatDuration((18 * 60 + 5) * 60 * 1000)).toBe("18h 5m");
  });

  it("formats days and hours for long windows", () => {
    expect(formatDuration(24 * 60 * 60 * 1000)).toBe("1d 0h");
    expect(formatDuration((2 * 24 * 60 + 3 * 60) * 60 * 1000)).toBe("2d 3h");
  });

  it("truncates partial minutes rather than rounding up", () => {
    // 90s is 1m 30s; rounding up would claim "2m" and overstate the wait.
    expect(formatDuration(90 * 1000)).toBe("1m");
  });
});
