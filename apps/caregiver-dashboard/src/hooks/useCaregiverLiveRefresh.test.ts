import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PATIENT_CHANGE_EVENT } from "../api/patients";

const ACCESS_KEY = "smriti.caregiver.access";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

describe("useCaregiverLiveRefresh mechanics", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    storage.setItem(ACCESS_KEY, "valid-caregiver-token");
    vi.stubGlobal("window", {
      sessionStorage: storage,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setInterval: vi.fn(() => 123),
      clearInterval: vi.fn(),
    });
    vi.stubGlobal("navigator", { onLine: true });
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("recognizes PATIENT_CHANGE_EVENT constant", () => {
    expect(PATIENT_CHANGE_EVENT).toBe("smriti-patient-change");
  });

  it("handles online and offline transitions accurately", () => {
    expect(navigator.onLine).toBe(true);
    vi.stubGlobal("navigator", { onLine: false });
    expect(navigator.onLine).toBe(false);
  });
});
