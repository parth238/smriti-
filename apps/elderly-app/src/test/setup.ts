import { beforeEach, vi } from "vitest";

const localStore = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return localStore.size;
  },
  clear() {
    localStore.clear();
  },
  getItem(key: string) {
    return localStore.get(key) ?? null;
  },
  key(index: number) {
    return Array.from(localStore.keys())[index] ?? null;
  },
  removeItem(key: string) {
    localStore.delete(key);
  },
  setItem(key: string, value: string) {
    localStore.set(key, value);
  },
};

vi.stubGlobal("localStorage", localStorageMock);

class MockCustomEvent<T> extends Event {
  detail: T;
  constructor(type: string, init?: CustomEventInit<T>) {
    super(type);
    this.detail = init?.detail as T;
  }
}

const eventTarget = new EventTarget();

const windowMock = {
  addEventListener: eventTarget.addEventListener.bind(eventTarget),
  removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
  dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
  sessionStorage: localStorageMock,
  localStorage: localStorageMock,
};

vi.stubGlobal("window", windowMock);
vi.stubGlobal("CustomEvent", MockCustomEvent);

beforeEach(() => {
  localStore.clear();
});
