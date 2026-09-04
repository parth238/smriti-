import { describe, expect, it } from "vitest";

import { NAV } from "./layout/nav";

describe("Caregiver Dashboard Routes & Navigation", () => {
  it("keeps only canonical navigation items without separate Analytics/Sessions", () => {
    const navDestinations = NAV.map((item) => item.to);
    expect(navDestinations).toContain("/dashboard");
    expect(navDestinations).toContain("/progress");
    expect(navDestinations).toContain("/reminders");
    expect(navDestinations).toContain("/memories");
    expect(navDestinations).toContain("/alerts");

    expect(navDestinations).not.toContain("/analytics");
    expect(navDestinations).not.toContain("/sessions");
  });
});
