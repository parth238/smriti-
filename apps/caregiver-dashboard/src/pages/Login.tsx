import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";

import { caregiverLogin } from "../api/auth";
import { signInCaregiver } from "../auth/session";

export function Login() {
  const navigate = useNavigate();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [offline, setOffline] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = await caregiverLogin(identity, password);
    if (!result.ok) {
      setMessage("Let us try that phone or email and password again.");
      return;
    }
    signInCaregiver(result.accessToken);
    if (result.offline) {
      setOffline(true);
    }
    navigate("/", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-3xl font-semibold">Smriti</p>
      <div className="gamosa-line my-4" />
      <h1 className="text-xl font-semibold">Caregiver sign in</h1>
      <p className="mt-2 text-mist-blue">
        This desk is for family. The elderly companion stays on the phone app.
      </p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span>Phone or email</span>
          <input
            className="mt-1 w-full rounded-lg border border-mist-blue bg-white px-3 py-2"
            autoComplete="username"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
          />
        </label>
        <label className="block">
          <span>Password</span>
          <input
            className="mt-1 w-full rounded-lg border border-mist-blue bg-white px-3 py-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {message ? <p className="text-tea-garden">{message}</p> : null}
        {offline ? (
          <p className="text-mist-blue">
            API unreachable. Opening with clearly labeled demo data, not live truth.
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-gamosa-red px-4 py-3 font-semibold text-rice-white"
        >
          Open dashboard
        </button>
      </form>
    </main>
  );
}
