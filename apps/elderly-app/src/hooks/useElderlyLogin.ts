import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { elderlyLogin } from "../api/auth";
import { useI18n } from "../context/LanguageContext";

export function useElderlyLogin() {
  const { tx } = useI18n();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [offline, setOffline] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await elderlyLogin(phone, pin);
    setBusy(false);
    if (!result.ok) {
      setMessage(tx("pinRetry"));
      return;
    }
    if (result.accessToken) {
      window.sessionStorage.setItem("smriti.access", result.accessToken);
    }
    window.sessionStorage.setItem("smriti.paired", "1");
    if (result.offline) {
      setOffline(true);
    }
    navigate("/", { replace: true });
  }

  return { phone, setPhone, pin, setPin, message, offline, busy, onSubmit };
}
