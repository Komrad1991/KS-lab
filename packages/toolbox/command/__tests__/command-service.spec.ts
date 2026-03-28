import {describe, it, expect, beforeEach} from 'vitest';
import {CommandService} from '../command-service.js';
import type {CommandArgs} from '../definition.js';

describe('CommandService - basic API', () => {
  let service: CommandService;

  beforeEach(() => {
    localStorage.clear();
    service = new CommandService();
  });

  it('registers and unregisters commands', () => {
    service.registerCommand(
      'hello',
      'Hello',
      'Say hello',
      undefined,
      () => {},
      ['greet']
    );
    const cmds = service.getRegisteredCommands();
    expect(cmds.find(c => c.id === 'hello')).toBeTruthy();
    service.unregisterCommand('hello');
    expect(service.getRegisteredCommands().some(c => c.id === 'hello')).toBe(
      false
    );
  });

  it('executes a command and stores it in history', async () => {
    service.registerCommand(
      'run',
      'Run',
      'Run something',
      undefined,
      async () => {
        return;
      }
    );
    await service.runCommand('run');
    const hist = service.getHistory();
    expect(hist[0]).toBe('run');
  });

  it('uses fuzzy search with history boost (basic)', async () => {
    // Register two commands that could match 'home'
    service.registerCommand('home', 'Home', 'Go home', undefined, () => {}, [
      'home',
    ]);
    service.registerCommand(
      'home2',
      'Homepage',
      'Main page',
      undefined,
      () => {},
      ['home']
    );
    // simulate history: run 'home'
    await service.runCommand('home');
    const results = service.searchCommands('home');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].id).toBe('home');
  });
});

describe('CommandService - extended', () => {
  let service: CommandService;

  beforeEach(() => {
    localStorage.clear();
    service = new CommandService();
  });

  describe('categories', () => {
    it('groups commands by category', () => {
      service.registerCommand(
        'a',
        'A',
        undefined,
        undefined,
        () => {},
        undefined,
        'Cat1'
      );
      service.registerCommand(
        'b',
        'B',
        undefined,
        undefined,
        () => {},
        undefined,
        'Cat2'
      );
      service.registerCommand(
        'c',
        'C',
        undefined,
        undefined,
        () => {},
        undefined,
        'Cat1'
      );
      const map = service.getCommandsByCategory();
      expect(map.get('Cat1')?.length).toBe(2);
      expect(map.get('Cat2')?.length).toBe(1);
    });
  });

  describe('context and shouldShow', () => {
    it('filters commands by shouldShow', () => {
      service.registerCommand(
        'cond',
        'Conditional',
        undefined,
        undefined,
        () => {},
        undefined,
        undefined,
        (ctx: unknown) => Boolean((ctx as {show?: boolean})?.show)
      );
      service.updateContext({show: true});
      let list = service.searchCommands('', service.getContext());
      expect(list.some(c => c.id === 'cond')).toBe(true);
      service.updateContext({show: false});
      list = service.searchCommands('', service.getContext());
      expect(list.some(c => c.id === 'cond')).toBe(false);
    });

    it('hides commands when shouldShow throws and keeps commands for non-boolean values', () => {
      service.registerCommand(
        'safe',
        'Safe',
        undefined,
        undefined,
        () => {},
        undefined,
        undefined,
        () => 'visible' as unknown as boolean
      );
      service.registerCommand(
        'broken',
        'Broken',
        undefined,
        undefined,
        () => {},
        undefined,
        undefined,
        () => {
          throw new Error('bad context');
        }
      );

      const list = service.searchCommands('');

      expect(list.some(c => c.id === 'safe')).toBe(true);
      expect(list.some(c => c.id === 'broken')).toBe(false);
    });
  });

  describe('shortcuts', () => {
    it('returns shortcut for command', () => {
      service.registerCommand('cmd', 'Cmd', undefined, undefined, () => {});
      service.registerShortcut('Ctrl+K', 'cmd');
      expect(service.getShortcut('cmd')).toBe('Ctrl+K');
    });

    it('last registered shortcut wins', () => {
      service.registerCommand('cmd', 'Cmd', undefined, undefined, () => {});
      service.registerShortcut('Ctrl+K', 'cmd');
      service.registerShortcut('Ctrl+J', 'cmd');
      expect(service.getShortcut('cmd')).toBe('Ctrl+J');
    });

    it('returns only the winning shortcut when keys conflict', () => {
      service.registerCommand(
        'primary',
        'Primary',
        undefined,
        undefined,
        () => {}
      );
      service.registerCommand(
        'secondary',
        'Secondary',
        undefined,
        undefined,
        () => {}
      );

      service.registerShortcut('Ctrl+K', 'secondary', false, 1);
      service.registerShortcut('Ctrl+K', 'primary', false, 10);

      expect(service.getShortcut('primary')).toBe('Ctrl+K');
      expect(service.getShortcut('secondary')).toBeUndefined();
    });

    it('restores a lower-priority shortcut after unregistering the winner', () => {
      service.registerCommand(
        'primary',
        'Primary',
        undefined,
        undefined,
        () => {}
      );
      service.registerCommand(
        'secondary',
        'Secondary',
        undefined,
        undefined,
        () => {}
      );

      service.registerShortcut('Ctrl+K', 'secondary', false, 1);
      service.registerShortcut('Ctrl+K', 'primary', false, 10);
      service.unregisterShortcut('Ctrl+K', 'primary');

      expect(service.getShortcut('secondary')).toBe('Ctrl+K');
    });

    it('removes all registrations for a shortcut when no commandId is provided', () => {
      service.registerCommand('first', 'First', undefined, undefined, () => {});
      service.registerCommand(
        'second',
        'Second',
        undefined,
        undefined,
        () => {}
      );
      service.registerShortcut('Ctrl+K', 'first', false, 1);
      service.registerShortcut('Ctrl+K', 'second', false, 10);

      service.unregisterShortcut('Ctrl+K');

      expect(service.getShortcut('first')).toBeUndefined();
      expect(service.getShortcut('second')).toBeUndefined();
    });
  });

  describe('runCommand with args', () => {
    it('passes args to action', async () => {
      let receivedArgs: CommandArgs | undefined = undefined;
      service.registerCommand(
        'argcmd',
        'ArgCmd',
        undefined,
        undefined,
        args => {
          receivedArgs = args;
        }
      );
      await service.runCommand('argcmd', {foo: 'bar'});
      expect(receivedArgs?.['foo']).toBe('bar');
    });

    it('stores command closeOnRun option', () => {
      service.registerCommand(
        'sticky',
        'Sticky',
        undefined,
        undefined,
        () => {},
        undefined,
        undefined,
        undefined,
        undefined,
        false
      );
      expect(
        service.getRegisteredCommands().find(c => c.id === 'sticky')
      ).toMatchObject({closeOnRun: false});
    });

    it('throws a helpful error when the command is missing', async () => {
      await expect(service.runCommand('missing')).rejects.toThrow(
        'Command not found: missing'
      );
    });
  });

  describe('abort support', () => {
    it('aborts long running command', async () => {
      let aborted = false;
      const controller = new AbortController();
      service.registerCommand(
        'long',
        'Long',
        undefined,
        undefined,
        async (_args, signal) => {
          signal?.addEventListener('abort', () => {
            aborted = true;
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      );
      const p = service.runCommand('long', undefined, controller.signal);
      controller.abort();
      await expect(p).rejects.toMatchObject({name: 'AbortError'});
      expect(aborted).toBe(true);
    });
  });

  describe('getRecentCommands', () => {
    it('returns recent commands from history', async () => {
      service.registerCommand('first', 'First', undefined, undefined, () => {});
      service.registerCommand(
        'second',
        'Second',
        undefined,
        undefined,
        () => {}
      );
      service.registerCommand('third', 'Third', undefined, undefined, () => {});
      await service.runCommand('first');
      await service.runCommand('second');
      await service.runCommand('third');
      const recent = service.getRecentCommands(2);
      expect(recent.map(c => c.id)).toEqual(['third', 'second']);
    });

    it('tracks command usage frequency separately from recency', async () => {
      service.registerCommand('alpha', 'Alpha', undefined, undefined, () => {});
      service.registerCommand(
        'alpine',
        'Alpine',
        undefined,
        undefined,
        () => {}
      );

      await service.runCommand('alpha');
      await service.runCommand('alpha');
      await service.runCommand('alpine');

      expect(service.getUsageCount('alpha')).toBe(2);
      expect(service.getUsageCount('alpine')).toBe(1);

      const results = service.searchCommands('alp');
      expect(results[0].id).toBe('alpha');
    });
  });
});
