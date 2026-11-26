import { describe, it, expect } from "vitest";
import { formatDateHeader, formatMessageTime, getLocalDateKey } from "../lib/dateUtils";

describe("dateUtils (WhatsApp-style date & time)", () => {
  const referenceNow = new Date(2026, 10, 26, 12, 0, 0); // Nov 26, 2026 (Thursday)

  it("formats Today and Yesterday based on local calendar day", () => {
    const todayMorning = new Date(2026, 10, 26, 0, 5, 0);
    const yesterdayLate = new Date(2026, 10, 25, 23, 55, 0);

    expect(formatDateHeader(todayMorning, referenceNow)).toBe("Today");
    expect(formatDateHeader(yesterdayLate, referenceNow)).toBe("Yesterday");
  });

  it("formats dates within 2-6 days as weekday name without alphabetical string bug", () => {
    // Nov 21, 2026 is Saturday (5 days before Thursday Nov 26)
    const fiveDaysAgo = new Date(2026, 10, 21, 15, 30, 0);
    // Nov 20, 2026 is Friday (6 days before Thursday Nov 26)
    const sixDaysAgo = new Date(2026, 10, 20, 10, 0, 0);

    expect(formatDateHeader(fiveDaysAgo, referenceNow)).toBe("Saturday");
    expect(formatDateHeader(sixDaysAgo, referenceNow)).toBe("Friday");
  });

  it("formats dates 7+ days ago as DD/MM/YYYY", () => {
    const sevenDaysAgo = new Date(2026, 10, 19, 10, 0, 0);
    expect(formatDateHeader(sevenDaysAgo, referenceNow)).toBe("19/11/2026");
  });

  it("generates deterministic local date keys and non-empty message time", () => {
    const sample = new Date(2026, 10, 26, 9, 5, 0);
    expect(getLocalDateKey(sample)).toBe("2026-11-26");
    expect(formatMessageTime(sample)).toMatch(/\d{1,2}:\d{2}/);
  });
});
