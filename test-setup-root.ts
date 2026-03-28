import { vi } from 'vitest';

// Stub window global
vi.stubGlobal('window', {
  addEventListener: () => {},
  removeEventListener: () => {},
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
