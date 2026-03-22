import { describe, it, expect, beforeEach } from 'vitest'
import { CommandService } from '../command-service'
import { autoRegisterRoutesFromRouter } from '../router-loader'

describe('router-auto loader', () => {
  let service: CommandService
  beforeEach(() => {
    service = new CommandService()
  })

  it('loads routes from router.getRoutes()', () => {
    const fakeRouter = {
      getRoutes: () => [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' }
      ]
    }
    autoRegisterRoutesFromRouter(service, fakeRouter)
    const cmds = service.getRegisteredCommands()
    expect(cmds.find(c => c.id === 'nav:/')).toBeTruthy()
    expect(cmds.find(c => c.name === 'Перейти к Home')).toBeTruthy()
  })
})
