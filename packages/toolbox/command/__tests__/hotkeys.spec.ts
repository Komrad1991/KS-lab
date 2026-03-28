import {describe, it, expect, beforeEach, vi} from 'vitest';
import {CommandService} from '../command-service.js';
import {HotkeyManager} from '../hotkeys.js';

describe('HotkeyManager', () => {
  let service: CommandService;
  let hotkeys: HotkeyManager;

  beforeEach(() => {
    service = new CommandService();
    hotkeys = new HotkeyManager(service);
  });

  function simulateKey(
    keys: string,
    e: Partial<KeyboardEvent> = {}
  ): KeyboardEvent {
    const parts = keys.split('+');
    const isSingle = parts.length === 1;
    const key = isSingle
      ? parts[0].length === 1
        ? parts[0]
        : parts[0].toLowerCase()
      : parts[parts.length - 1];
    const eventInit: KeyboardEventInit = {
      key: key,
      ctrlKey: parts.includes('Ctrl'),
      metaKey: parts.includes('Meta'),
      altKey: parts.includes('Alt'),
      shiftKey: parts.includes('Shift'),
    };
    return Object.assign(new KeyboardEvent('keydown', eventInit), e);
  }

  it('registers and triggers single combo', () => {
    const fn = vi.fn();
    service.registerCommand('test', 'Test', undefined, undefined, fn);
    hotkeys.registerShortcut('Ctrl+T', 'test');
    hotkeys.processEvent(simulateKey('Ctrl+T'));
    expect(fn).toHaveBeenCalled();
  });

  it('prefers the shortcut with a higher priority on conflict', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    service.registerCommand('a', 'A', undefined, undefined, fn1);
    service.registerCommand('b', 'B', undefined, undefined, fn2);
    hotkeys.registerShortcut('Ctrl+X', 'a', false, 1);
    hotkeys.registerShortcut('Ctrl+X', 'b', false, 10);
    hotkeys.processEvent(simulateKey('Ctrl+X'));
    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalled();
  });

  it('falls back to the remaining shortcut after unregistering the higher priority one', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    service.registerCommand('a', 'A', undefined, undefined, fn1);
    service.registerCommand('b', 'B', undefined, undefined, fn2);
    hotkeys.registerShortcut('Ctrl+X', 'a', false, 1);
    hotkeys.registerShortcut('Ctrl+X', 'b', false, 10);

    hotkeys.unregisterShortcut('Ctrl+X', 'b');
    hotkeys.processEvent(simulateKey('Ctrl+X'));

    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();
  });

  it('handles sequences', () => {
    const fn = vi.fn();
    service.registerCommand('seq', 'Seq', undefined, undefined, fn);
    hotkeys.registerShortcut('g h', 'seq');
    hotkeys.processEvent(simulateKey('g'));
    hotkeys.processEvent(simulateKey('h'));
    expect(fn).toHaveBeenCalled();
  });

  it('resets sequence on timeout', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    service.registerCommand('seq', 'Seq', undefined, undefined, fn);
    hotkeys.registerShortcut('g h', 'seq');
    hotkeys.processEvent(simulateKey('g'));
    await vi.advanceTimersByTimeAsync(900);
    hotkeys.processEvent(simulateKey('h'));
    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('uses the last registered shortcut when priorities are equal', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    service.registerCommand('a', 'A', undefined, undefined, fn1);
    service.registerCommand('b', 'B', undefined, undefined, fn2);
    hotkeys.registerShortcut('Ctrl+Y', 'a');
    hotkeys.registerShortcut('Ctrl+Y', 'b');

    hotkeys.processEvent(simulateKey('Ctrl+Y'));

    expect(fn1).not.toHaveBeenCalled();
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('can clear all handlers for a shortcut and respects preventDefault', () => {
    const fn = vi.fn();
    const preventDefault = vi.fn();
    service.registerCommand('test', 'Test', undefined, undefined, fn);
    hotkeys.registerShortcut('Ctrl+P', 'test', true);

    hotkeys.processEvent(simulateKey('Ctrl+P', {preventDefault}));
    hotkeys.unregisterShortcut('Ctrl+P');
    hotkeys.processEvent(simulateKey('Ctrl+P', {preventDefault}));

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
