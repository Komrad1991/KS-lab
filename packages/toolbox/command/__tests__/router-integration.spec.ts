import { describe, it, expect, beforeEach } from 'vitest'
import { CommandService } from '../command-service'
import { registerNavigationCommandsFromRoutes } from '../router-integration'

describe('router integration - navigation commands', () => {
  let service: CommandService
  beforeEach(() => {
    service = new CommandService()
  })

  it('registers navigation commands for given routes', () => {
    const routes = [
      { name: 'Home', path: '/' },
      { name: 'Profile', path: '/profile' }
    ]
    registerNavigationCommandsFromRoutes(service, routes)
    const cmds = service.getRegisteredCommands()
    const homeCmd = cmds.find(c => c.id === 'nav:/')
    const profCmd = cmds.find(c => c.id === 'nav:/profile')
    expect(homeCmd).toBeTruthy()
    expect(profCmd).toBeTruthy()
    expect(homeCmd?.name).toBe('Перейти к Home')
    expect(profCmd?.name).toBe('Перейти к Profile')
  })
})
