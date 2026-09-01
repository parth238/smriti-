import { useEffect, useState } from "react";

import type { NavSection } from "../components/story/storyData";

const SECTION_IDS: NavSection[] = ["hook", "problem", "solution"];

export function useActiveSection(): NavSection | null {
  const [active, setActive] = useState<NavSection | null>(null);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (elements.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id as NavSection | undefined;
        if (top) {
          setActive(top);
        }
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.2, 0.5] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return active;
}
