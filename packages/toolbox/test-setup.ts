import {vi} from 'vitest';

const storage = new Map<string, string>();

if (typeof window === 'undefined') {
  vi.stubGlobal('window', {
    addEventListener: () => {},
    dispatchEvent: () => true,
    removeEventListener: () => {},
  });
}

vi.stubGlobal('localStorage', {
  clear: () => storage.clear(),
  getItem: (key: string) => storage.get(key) ?? null,
  key: (index: number) => Array.from(storage.keys())[index] ?? null,
  get length() {
    return storage.size;
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
});

// Stub KeyboardEvent global
class KeyboardEventMock {
  type: string;
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  preventDefault: () => void;
  constructor(type: string, eventInit?: any) {
    this.type = type;
    this.key = eventInit?.key || '';
    this.ctrlKey = eventInit?.ctrlKey || false;
    this.metaKey = eventInit?.metaKey || false;
    this.altKey = eventInit?.altKey || false;
    this.shiftKey = eventInit?.shiftKey || false;
    this.preventDefault = () => {};
  }
}
vi.stubGlobal('KeyboardEvent', KeyboardEventMock);
