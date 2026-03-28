import type {CommandService} from './command-service.js';
import type {CommandDefinition} from './definition.js';

type NavigateFn = (path: string) => void;

export function registerNavigationCommandsFromRoutes(
  service: CommandService,
  routes: Array<{name?: string; title?: string; path: string}>,
  navigateFn?: NavigateFn
): void {
  const nav =
    navigateFn ??
    ((path: string) => {
      if (typeof window !== 'undefined') {
        if (
          typeof history !== 'undefined' &&
          typeof history.pushState === 'function'
        ) {
          history.pushState({}, '', path);
        } else {
          window.location.assign(path);
        }
      }
    });
  for (const r of routes) {
    const routeName = r.name ?? r.title ?? r.path;
    const id = `nav:${r.path}`;
    const name = `Перейти к ${routeName}`;
    const exists = service
      .getRegisteredCommands()
      .some((c: CommandDefinition) => c.id === id);
    if (exists) continue;

    service.registerCommand(
      id,
      name,
      `Navigate to ${routeName} (${r.path})`,
      'router',
      () => nav(r.path),
      ['navigate', 'router', routeName, r.path],
      'Navigation'
    );
  }
}
