import { describe, it, expect, beforeEach } from 'vitest'
import { CommandService } from '../command-service'

describe('CommandService - basic API', () => {
  let service: CommandService

  beforeEach(() => {
    service = new CommandService()
  })

  it('registers and unregisters commands', () => {
    service.registerCommand('hello', 'Hello', 'Say hello', undefined, () => {}, ['greet'])
    const cmds = service.getRegisteredCommands()
    expect(cmds.find((c) => c.id === 'hello')).toBeTruthy()
    service.unregisterCommand('hello')
    expect(service.getRegisteredCommands().some((c) => c.id === 'hello')).toBe(false)
  })

  it('executes a command and stores it in history', async () => {
    service.registerCommand('run', 'Run', 'Run something', undefined, async () => {
      return
    })
    await service.runCommand('run')
    const hist = service.getHistory()
    expect(hist[0]).toBe('run')
  })
})
