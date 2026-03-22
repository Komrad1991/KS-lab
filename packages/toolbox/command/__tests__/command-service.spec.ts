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

  it('uses fuzzy search with history boost (basic)', async () => {
    // Register two commands that could match 'home'
    service.registerCommand('home', 'Home', 'Go home', undefined, () => {}, ['home'])
    service.registerCommand('home2', 'Homepage', 'Main page', undefined, () => {}, ['home'])
    // simulate history: run 'home'
    await service.runCommand('home')
    const results = service.searchCommands('home')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results[0].id).toBe('home')
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
