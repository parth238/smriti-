import { CompanionSit } from "./CompanionSit";
import { useCompanionVoice } from "../../voice/CompanionVoice";

export function GameCompanion() {
  const { isSpeaking } = useCompanionVoice();

  return (
    <div className="game-companion" aria-hidden="true">
      <CompanionSit speaking={isSpeaking} />
    </div>
  );
}
