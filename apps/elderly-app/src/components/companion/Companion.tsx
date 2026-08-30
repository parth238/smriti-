import { CompanionSit } from "./CompanionSit";
import { CompanionWalk } from "./CompanionWalk";

type CompanionProps = {
  pose?: "walk" | "sit";
  moving?: boolean;
};

export function Companion({ pose = "walk", moving = true }: CompanionProps) {
  if (pose === "sit") {
    return <CompanionSit />;
  }
  return <CompanionWalk moving={moving} />;
}

export { CompanionSit, CompanionWalk };
