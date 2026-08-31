import { API_BASE } from "../api/auth";

let bhashiniAvailable: boolean | null = null;

export async function checkBhashiniTts(): Promise<boolean> {
  if (bhashiniAvailable !== null) {
    return bhashiniAvailable;
  }
  if (!navigator.onLine) {
    bhashiniAvailable = false;
    return false;
  }
  try {
    const response = await fetch(`${API_BASE}/voice/status`);
    if (!response.ok) {
      bhashiniAvailable = false;
      return false;
    }
    const body = (await response.json()) as { bhashini_assamese_tts?: boolean };
    bhashiniAvailable = Boolean(body.bhashini_assamese_tts);
    return bhashiniAvailable;
  } catch {
    bhashiniAvailable = false;
    return false;
  }
}

export async function speakAssameseViaBhashini(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const response = await fetch(`${API_BASE}/voice/assamese-tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/wav" },
      body: JSON.stringify({ text: trimmed }),
    });
    if (!response.ok) {
      return false;
    }
    const blob = await response.blob();
    if (!blob.size) {
      return false;
    }
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("audio playback failed"));
      };
      void audio.play();
    });
    return true;
  } catch {
    return false;
  }
}
