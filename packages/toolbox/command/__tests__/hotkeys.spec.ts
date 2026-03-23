import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandService } from '../command-service'
import { HotkeyManager } from '../hotkeys'

describe('HotkeyManager', () => {
  let service: CommandService
  let hotkeys: HotkeyManager

  beforeEach(() => {
    service = new CommandService()
    hotkeys = new HotkeyManager(service)
  })

  function simulateKey(keys: string, e: Partial<KeyboardEvent> = {}): KeyboardEvent {
    const parts = keys.split('+')
    const isSingle = parts.length === 1
    const key = isSingle ? (parts[0].length === 1 ? parts[0] : parts[0].toLowerCase()) : parts[parts.length - 1]
    const event = new KeyboardEvent('keydown', {
      key: key,
      ctrlKey: parts.includes('Ctrl'),
      metaKey: parts.includes('Meta'),
      altKey: parts.includes('Alt'),
      shiftKey: parts.includes('Shift'),
      preventDefault: () => {},
      ...e
    } as any)
    return event
  }

  it('registers and triggers single combo', () => {
    const fn = vi.fn()
    service.registerCommand('test', 'Test', undefined, undefined, fn)
    hotkeys.registerShortcut('Ctrl+T', 'test')
    hotkeys.processEvent(simulateKey('Ctrl+T'))
    expect(fn).toHaveBeenCalled()
  })

  it('last registered shortcut wins on conflict', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    service.registerCommand('a', 'A', undefined, undefined, fn1)
    service.registerCommand('b', 'B', undefined, undefined, fn2)
    hotkeys.registerShortcut('Ctrl+X', 'a')
    hotkeys.registerShortcut('Ctrl+X', 'b') // override
    hotkeys.processEvent(simulateKey('Ctrl+X'))
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalled()
  })

  it('handles sequences', () => {
    const fn = vi.fn()
    service.registerCommand('seq', 'Seq', undefined, undefined, fn)
    hotkeys.registerShortcut('g h', 'seq')
    hotkeys.processEvent(simulateKey('g'))
    hotkeys.processEvent(simulateKey('h'))
    expect(fn).toHaveBeenCalled()
  })

  it('resets sequence on timeout', async () => {
    const fn = vi.fn()
    service.registerCommand('seq', 'Seq', undefined, undefined, fn)
    hotkeys.registerShortcut('g h', 'seq')
    hotkeys.processEvent(simulateKey('g'))
    // wait for timeout (800ms)
    await new Promise(resolve => setTimeout(resolve, 900))
    hotkeys.processEvent(simulateKey('h'))
    expect(fn).not.toHaveBeenCalled()
  })
})
