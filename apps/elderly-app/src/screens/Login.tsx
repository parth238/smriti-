import { CompanionSit } from "../components/companion/CompanionSit";
import { LargeButton } from "../components/LargeButton";
import { PinPad } from "../components/PinPad";
import { useI18n } from "../context/LanguageContext";
import { useElderlyLogin } from "../hooks/useElderlyLogin";
import { useCompanionVoice, useSpeakOnMount } from "../voice/CompanionVoice";

export function Login() {
  const { tx, language, setLanguage } = useI18n();
  const { phone, setPhone, pin, setPin, message, offline, busy, onSubmit } = useElderlyLogin();
  const { isSpeaking } = useCompanionVoice();
  useSpeakOnMount("loginCompanion", 700);

  return (
    <main className="page-enter">
      <div className="flex justify-center">
        <CompanionSit variant="grandfather" speaking={isSpeaking} />
      </div>
      <p className="mt-2 text-center text-body-lg text-mist-blue">{tx("loginCompanion")}</p>
      <p className="mt-6 font-display text-display">{tx("appName")}</p>
      <div className="gamosa-line gamosa-draw my-5" />
      <h1 className="font-display text-h1">{tx("loginTitle")}</h1>
      <p className="mt-3 text-body-lg">{tx("loginHelp")}</p>
      <div className="mt-6 grid grid-cols-2 gap-tap">
        <LargeButton type="button" tone={language === "en" ? "primary" : "quiet"} onClick={() => setLanguage("en")}>
          {tx("english")}
        </LargeButton>
        <LargeButton type="button" tone={language === "as" ? "primary" : "quiet"} onClick={() => setLanguage("as")}>
          {tx("assamese")}
        </LargeButton>
      </div>
      <form className="mt-8 space-y-6" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-body">{tx("phoneLabel")}</span>
          <input
            className="mt-2 min-h-tap w-full rounded-2xl border-[3px] border-mist-blue bg-white px-4"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </label>
        <PinPad
          value={pin}
          onChange={setPin}
          label={tx("pinLabel")}
          clearLabel={tx("pinClear")}
          backLabel={tx("pinErase")}
        />
        {message ? <p className="text-body-lg text-tea-garden">{message}</p> : null}
        {offline ? <p className="text-body text-mist-blue">{tx("offlineNote")}</p> : null}
        <LargeButton type="submit" disabled={busy}>
          {busy ? tx("gettingReady") : tx("signIn")}
        </LargeButton>
      </form>
    </main>
  );
}
