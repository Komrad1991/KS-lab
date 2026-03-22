import type { CommandService } from './command-service'
import { registerNavigationCommandsFromRoutes } from './router-integration'

type RouteLike = { name: string; path: string }

export function autoRegisterRoutesFromRouter(
  service: CommandService,
  router: any
): void {
  if (!router) return
  let routes: RouteLike[] = []
  // Try common router APIs
  if (typeof router.getRoutes === 'function') {
    try {
      // @ts-ignore
      routes = router.getRoutes() as RouteLike[]
    } catch {
      // ignore
    }
  }
  if (!routes.length && Array.isArray(router.routes)) {
    routes = router.routes.map((r: any) => ({
      name: r.name ?? String(r.path ?? ''),
      path: r.path ?? r.url ?? ''
    }))
  }
  if (routes.length) {
    registerNavigationCommandsFromRoutes(service, routes)
  }
}

export default autoRegisterRoutesFromRouter
