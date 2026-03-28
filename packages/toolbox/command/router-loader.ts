import type {CommandService} from './command-service.js';
import {registerNavigationCommandsFromRoutes} from './router-integration.js';

type RouteLike = {
  name?: string;
  title?: string;
  path: string;
};

type RouterRouteLike = {
  name?: string;
  title?: string;
  path?: string;
  url?: string;
};

type RouterLike = {
  getRoutes?: () => RouteLike[];
  getActiveRoute?: () => {path?: string} | undefined;
  go?: (path: string) => void;
  routes?: RouterRouteLike[];
};

const ROUTE_CHANGE_EVENT = 'tini:route-change';
const trackerRegistry = new WeakMap<object, Set<CommandService>>();

function normalizeRoutePath(path: string): string {
  return new URL(path, 'https://tinijs.local').pathname;
}

function markVisitedRoute(
  service: CommandService,
  knownPaths: Set<string>,
  path?: string
): void {
  if (!path) return;
  const normalizedPath = normalizeRoutePath(path);
  if (!knownPaths.has(normalizedPath)) return;
  service.markCommandUsed(`nav:${normalizedPath}`);
}

function ensureRouteTracking(
  service: CommandService,
  router: RouterLike,
  routes: RouteLike[]
): void {
  if (!router || typeof window === 'undefined') return;

  const existingServices = trackerRegistry.get(router);
  if (existingServices?.has(service)) return;

  const routePaths = new Set(
    routes.map(route => normalizeRoutePath(route.path))
  );
  const markCurrentRoute = (path?: string) =>
    markVisitedRoute(service, routePaths, path ?? location.pathname);

  window.addEventListener(ROUTE_CHANGE_EVENT, event => {
    markCurrentRoute(
      (event as CustomEvent<{path?: string}>).detail?.path ?? location.pathname
    );
  });

  markCurrentRoute(
    typeof router.getActiveRoute === 'function'
      ? router.getActiveRoute()?.path
      : location.pathname
  );

  trackerRegistry.set(router, (existingServices ?? new Set()).add(service));
}

export function autoRegisterRoutesFromRouter(
  service: CommandService,
  router: RouterLike | null | undefined
): void {
  if (!router) return;
  let routes: RouteLike[] = [];
  if (typeof router.getRoutes === 'function') {
    try {
      routes = router.getRoutes() as RouteLike[];
    } catch {
      // ignore
    }
  }
  if (!routes.length && Array.isArray(router.routes)) {
    routes = router.routes.map(route => ({
      name: route.name ?? route.title ?? String(route.path ?? ''),
      title: route.title,
      path: route.path ?? route.url ?? '',
    }));
  }

  if (routes.length) {
    const navigateFn = (path: string) => {
      if (typeof router.go === 'function') {
        router.go(path);
      } else if (
        typeof history !== 'undefined' &&
        typeof history.pushState === 'function'
      ) {
        history.pushState({}, '', path);
      } else if (typeof window !== 'undefined') {
        window.location.assign(path);
      }
    };
    registerNavigationCommandsFromRoutes(service, routes, navigateFn);
    ensureRouteTracking(service, router, routes);
  }
}

export default autoRegisterRoutesFromRouter;
