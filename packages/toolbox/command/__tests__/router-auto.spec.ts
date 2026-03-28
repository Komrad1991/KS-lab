import {describe, it, expect, beforeEach, vi} from 'vitest';
import {CommandService} from '../command-service.js';
import {autoRegisterRoutesFromRouter} from '../router-loader.js';

describe('router-auto loader', () => {
  let service: CommandService;
  beforeEach(() => {
    localStorage.clear();
    history.replaceState({}, '', '/');
    service = new CommandService();
  });

  it('loads routes from router.getRoutes()', () => {
    const fakeRouter = {
      getRoutes: () => [
        {name: 'Home', path: '/'},
        {name: 'About', path: '/about'},
      ],
    };
    autoRegisterRoutesFromRouter(service, fakeRouter);
    const cmds = service.getRegisteredCommands();
    expect(cmds.find(c => c.id === 'nav:/')).toBeTruthy();
    expect(cmds.find(c => c.name === 'Перейти к Home')).toBeTruthy();
  });

  it('falls back to router.routes and uses title', () => {
    const fakeRouter = {
      routes: [{path: '/contact', title: 'Contact'}],
    };

    autoRegisterRoutesFromRouter(service, fakeRouter);

    const cmds = service.getRegisteredCommands();
    expect(cmds.find(c => c.id === 'nav:/contact')?.name).toBe(
      'Перейти к Contact'
    );
  });

  it('uses router.go when executing generated command', async () => {
    const go = vi.fn();
    const fakeRouter = {
      routes: [{path: '/about', title: 'About'}],
      go,
    };

    autoRegisterRoutesFromRouter(service, fakeRouter);
    await service.runCommand('nav:/about');

    expect(go).toHaveBeenCalledWith('/about');
  });

  it('tracks recently visited routes from router change events', () => {
    const fakeRouter = {
      routes: [
        {path: '/', title: 'Home'},
        {path: '/about', title: 'About'},
      ],
      getActiveRoute: () => ({path: '/'}),
    };

    autoRegisterRoutesFromRouter(service, fakeRouter);
    window.dispatchEvent(
      new CustomEvent('tini:route-change', {detail: {path: '/about'}})
    );

    expect(service.getRecentCommands(2).map(c => c.id)).toContain('nav:/about');
  });
});
