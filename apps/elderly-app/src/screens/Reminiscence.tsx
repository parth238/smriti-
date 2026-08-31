import { Chrome } from "../components/Chrome";
import { MemoryCultural } from "./reminiscence/MemoryCultural";
import { MemoryPersonal } from "./reminiscence/MemoryPersonal";
import { ReminiscenceHub } from "./reminiscence/ReminiscenceHub";

/** Route barrel — screens live under `screens/reminiscence/`. */
export function Reminiscence() {
  return (
    <main>
      <Chrome backTo="/" />
      <ReminiscenceHub />
    </main>
  );
}

export { MemoryPersonal, MemoryCultural };
