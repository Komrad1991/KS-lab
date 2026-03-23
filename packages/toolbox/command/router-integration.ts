import type { CommandService } from './command-service'

type NavigateFn = (path: string) => void

export function registerNavigationCommandsFromRoutes(
  service: CommandService,
  routes: Array<{ name: string; path: string }>,
  navigateFn?: NavigateFn
): void {
  const nav = navigateFn ?? ((path: string) => {
    if (typeof window !== 'undefined') {
      if (typeof history !== 'undefined' && typeof history.pushState === 'function') {
        history.pushState({}, '', path)
      } else {
        window.location.assign(path)
      }
    }
  })
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
      () => nav(r.path),
      ['navigate', 'router']
    )
  }
}
