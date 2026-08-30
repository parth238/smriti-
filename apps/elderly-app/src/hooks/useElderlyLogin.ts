import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { elderlyLogin } from "../api/auth";
import { useI18n } from "../context/LanguageContext";
import { db } from "../db/dexie";

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
    setMessage("");
    const result = await elderlyLogin(phone, pin);
    setBusy(false);
    if (!result.ok) {
      setMessage(tx("pinRetry"));
      return;
    }
    window.sessionStorage.setItem("smriti.access", result.accessToken);
    window.localStorage.setItem("smriti.access", result.accessToken);
    window.localStorage.setItem("smriti.paired", "1");
    window.sessionStorage.setItem("smriti.paired", "1");
    if (result.userId) {
      window.sessionStorage.setItem("smriti.userId", result.userId);
      window.localStorage.setItem("smriti.userId", result.userId);
      await db.paired.put({
        id: result.userId,
        phone: phone.trim(),
        pairedAt: new Date().toISOString(),
      });
    }
    if (result.offline) {
      setOffline(true);
    }
    navigate("/", { replace: true });
  }

  return { phone, setPhone, pin, setPin, message, offline, busy, onSubmit };
}
