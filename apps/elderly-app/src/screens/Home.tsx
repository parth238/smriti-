import { Link } from "react-router-dom";

import { AnalogClock } from "../components/AnalogClock";
import { CompanionSit } from "../components/companion/CompanionSit";
import { HillScene } from "../components/HillScene";
import { Motif } from "../components/Motif";
import { OfflineMark } from "../components/OfflineMark";
import { useI18n } from "../context/LanguageContext";
import { useHomeReminder } from "../hooks/useHomeReminder";
import { useNow } from "../hooks/useNow";
import { greetingKey } from "../store/sessionPrefs";
import { useCompanionVoice, useSpeakText } from "../voice/CompanionVoice";

export function Home() {
  const { tx, language } = useI18n();
  const clock = useNow(language);
  const reminder = useHomeReminder();
  const greet = greetingKey(clock.now.getHours());
  const { isSpeaking } = useCompanionVoice();
  useSpeakText(`${tx(greet)} ${tx("homeGreeting")}`, true, 800);

  return (
    <main>
      <div className="relative -mx-5 -mt-6 mb-5">
        <div className="hill-window">
          <HillScene />
        </div>
        <Link
          to="/settings"
          className="pressable absolute right-4 top-4 inline-flex min-h-tap min-w-[96px] items-center justify-center rounded-2xl bg-rice-white/90 px-3 text-body"
        >
          {tx("settings")}
        </Link>
      </div>

      <p className="font-display text-display">{tx(greet)}</p>
      <p className="mt-2 text-body-lg">{clock.day}</p>
      <p className="text-body">{clock.date}</p>
      <OfflineMark />

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <AnalogClock time={clock.now} />
          <p className="mt-2 text-center text-body">{clock.time}</p>
        </div>
        <CompanionSit speaking={isSpeaking} />
      </div>

      <p className="mt-4 text-body-lg">{tx("homeGreeting")}</p>
      <div className="gamosa-line my-5" />

      {reminder ? (
        <Link
          to="/reminders"
          className="mb-6 block rounded-3xl border-l-8 border-marigold bg-white px-5 py-4"
        >
          <p className="text-body text-mist-blue">{tx("nextReminder")}</p>
          <p className="mt-1 text-button-label">{reminder.title}</p>
          <p className="mt-1 text-body">{reminder.timeLabel}</p>
        </Link>
      ) : (
        <p className="mb-6 text-body-lg text-mist-blue">{tx("dayClear")}</p>
      )}

      <div className="space-y-3">
        <Link to="/games" className="pressable table-tile flex min-h-[96px] items-center gap-4 px-4">
          <Motif id="cloth" className="h-16 w-16 shrink-0" />
          <span className="text-button-label">{tx("playGame")}</span>
        </Link>
        <Link to="/memories" className="pressable table-tile flex min-h-[96px] items-center gap-4 px-4">
          <Motif id="lamp" className="h-16 w-16 shrink-0" />
          <span className="text-button-label">{tx("myMemories")}</span>
        </Link>
        <Link to="/reminders" className="pressable table-tile flex min-h-[96px] items-center gap-4 px-4">
          <Motif id="tea" className="h-16 w-16 shrink-0" />
          <span className="text-button-label">{tx("reminders")}</span>
        </Link>
      </div>
    </main>
  );
}
