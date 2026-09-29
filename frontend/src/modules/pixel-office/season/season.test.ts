import { describe, expect, it } from "vitest";
import { officeCalendar } from "./season";

describe("Seoul seasonal calendar", () => {
  it.each([[1,"winter"],[2,"winter"],[3,"spring"],[5,"spring"],[6,"summer"],[8,"summer"],[9,"autumn"],[11,"autumn"],[12,"winter"]])("maps month %s to %s", (month, season) => {
    expect(officeCalendar(new Date(`2026-${String(month).padStart(2,"0")}-15T00:00:00Z`)).season).toBe(season);
  });
  it("changes season at Seoul midnight, including the year boundary", () => {
    expect(officeCalendar(new Date("2026-02-28T14:59:59Z")).season).toBe("winter");
    expect(officeCalendar(new Date("2026-02-28T15:00:00Z")).season).toBe("spring");
    expect(officeCalendar(new Date("2026-12-31T15:00:00Z")).date).toBe("2027-01-01");
  });
});

it("uses Seoul time for daylight independently of attendance", () => {
  expect(officeCalendar(new Date("2026-09-14T20:59:59Z")).night).toBe(true);
  expect(officeCalendar(new Date("2026-09-14T21:00:00Z")).night).toBe(false);
  expect(officeCalendar(new Date("2026-09-15T09:59:59Z")).night).toBe(false);
  expect(officeCalendar(new Date("2026-09-15T10:00:00Z")).night).toBe(true);
});
