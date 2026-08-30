import { useState } from "react";

import { Chrome } from "../components/Chrome";
import { LargeButton } from "../components/LargeButton";
import { Motif } from "../components/Motif";
import { useI18n } from "../context/LanguageContext";
import { loadReminders, markReminderDone, type ReminderItem } from "../store/demoStore";

function motifFor(id: string) {
  return id === "water" ? ("river" as const) : ("tea" as const);
}

export function Reminders() {
  const { tx } = useI18n();
  const [items, setItems] = useState<ReminderItem[]>(() => loadReminders());

  return (
    <main>
      <Chrome backTo="/" />
      <h1 className="font-display text-h1">{tx("reminders")}</h1>
      {items.length === 0 ? (
        <p className="mt-6 text-body-lg text-mist-blue">{tx("remindersEmpty")}</p>
      ) : (
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <article
            key={item.id}
            className={`px-5 py-5 ${
              item.done ? "table-tile" : "rounded-3xl border-l-8 border-marigold bg-white"
            }`}
          >
            <div className="flex items-start gap-4">
              <Motif id={motifFor(item.id)} className="h-16 w-16 shrink-0" />
              <div>
                <p className="text-button-label">{tx(item.titleKey)}</p>
                <p className="mt-1 text-body text-mist-blue">{tx(item.timeKey)}</p>
              </div>
            </div>
            {item.done ? (
              <p className="mt-4 text-body-lg text-tea-garden">{tx("markedDone")}</p>
            ) : (
              <div className="mt-4">
                <LargeButton
                  tone="secondary"
                  onClick={() => setItems(markReminderDone(item.id))}
                >
                  {tx("markDone")}
                </LargeButton>
              </div>
            )}
          </article>
        ))}
      </div>
      )}
    </main>
  );
}
