import type { CommandDefinition } from './definition'
import { CommandService } from './command-service'

export function registerNavigationCommandsFromRoutes(
  service: CommandService,
  routes: Array<{ name: string; path: string }>
): void {
  // Create a navigation group of commands for all routes
  for (const r of routes) {
    const id = `nav:${r.path}`
    const name = `Перейти к ${r.name}`
    // If already registered, skip to avoid duplicates
    const exists = service.getRegisteredCommands().some((c) => c.id === id)
    if (exists) continue

    service.registerCommand(
      id,
      name,
      `Navigate to ${r.name} (${r.path})`,
      'router',
      () => {
        if (typeof window !== 'undefined') {
          const url = r.path
          // Simple navigation: pushState if available, otherwise assign
          if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
            history.pushState({}, '', url)
          } else {
            window.location.assign(url)
          }
        }
      },
      ['navigate', 'router']
    )
  }
}
