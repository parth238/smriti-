import { HookSection } from "../components/story/HookSection";
import { ProblemFlow } from "../components/story/ProblemFlow";
import { SolutionSection } from "../components/story/SolutionSection";
import { StoryCTA } from "../components/story/StoryCTA";
import { StoryHero } from "../components/story/StoryHero";
import { StoryNav } from "../components/story/StoryNav";
import { useActiveSection } from "../hooks/useActiveSection";

export function StoryMode() {
  const activeSection = useActiveSection();

  return (
    <div className="story-page bg-white text-neutral-900">
      <StoryNav activeSection={activeSection} />
      <main>
        <StoryHero />
        <HookSection />
        <ProblemFlow />
        <SolutionSection />
        <StoryCTA />
      </main>
    </div>
  );
}
