import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../components/Chrome", () => ({ Chrome: () => null }));
vi.mock("../../context/LanguageContext", () => ({
  useI18n: () => ({ tx: (key: string) => key }),
}));
vi.mock("../../hooks/usePersonalMemories", () => ({
  usePersonalMemories: () => ({
    rows: [
      {
        id: "memory-1",
        user_id: "user-1",
        media_url: "/uploads/memories/user-1/demo-family.jpg",
        media_type: "image/jpeg",
        category: "family",
        title: { en: "Family at the tea garden" },
        description: "A quiet afternoon together.",
        people_tagged: ["family"],
        year: 1985,
        location: "Jorhat, Assam",
        prompt_text: { en: "Do you remember this day?" },
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    loading: false,
    offline: false,
    pickTitle: () => "Family at the tea garden",
    pickPrompt: () => "Do you remember this day?",
  }),
}));

import {
  applyMemoryImageFallback,
  MEMORY_IMAGE_FALLBACK_URL,
  MemoryPersonal,
} from "./MemoryPersonal";

describe("personal memory image fallback", () => {
  it("keeps a valid backend image and the memory title visible", () => {
    const html = renderToStaticMarkup(<MemoryPersonal />);

    expect(html).toContain(
      'src="http://localhost:8000/uploads/memories/user-1/demo-family.jpg"',
    );
    expect(html).not.toContain(`src="${MEMORY_IMAGE_FALLBACK_URL}"`);
    expect(html).toContain('alt="Family at the tea garden"');
    expect(html).toContain("Family at the tea garden");
  });

  it("switches once to the bundled fallback after an image error", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const image = {
      currentSrc: "http://localhost:8000/uploads/memories/user-1/demo-family.jpg",
      dataset: {},
      src: "http://localhost:8000/uploads/memories/user-1/demo-family.jpg",
    } as unknown as HTMLImageElement;

    applyMemoryImageFallback(image);
    expect(image.src).toBe(MEMORY_IMAGE_FALLBACK_URL);
    expect(image.dataset.memoryFallbackApplied).toBe("true");
    expect(consoleError).toHaveBeenCalledTimes(1);

    applyMemoryImageFallback(image);
    expect(image.src).toBe(MEMORY_IMAGE_FALLBACK_URL);
    expect(consoleError).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
