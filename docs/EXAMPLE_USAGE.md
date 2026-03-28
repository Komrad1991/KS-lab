# Example Usage: Command Palette

Ниже приведён минимальный пример использования `CommandService`,
`tini-command-palette` и router-интеграции в приложении TiniJS.

## 1. Регистрация сервиса команд

```ts
import {CommandService, autoRegisterRoutesFromRouter} from '@tinijs/toolbox';
import {Router} from '@tinijs/router';

const commandService = new CommandService();

commandService.registerCommand(
  'hello',
  'Say Hello',
  'Shows a hello message',
  undefined,
  () => {
    console.log('Hello from Command Palette');
  },
  ['greet'],
  'Demo'
);

commandService.registerCommand(
  'search',
  'Search Commands',
  'Run a command with arguments',
  undefined,
  args => {
    console.log('Query:', args?.query);
  },
  ['search'],
  'Demo',
  undefined,
  [{name: 'query', type: 'string', description: 'Search query'}],
  false
);
```

## 2. Интеграция с роутером

```ts
const router = new Router(
  [
    {path: '/', title: 'Home', component: 'demo-home-page'},
    {path: '/about', title: 'About', component: 'demo-about-page'},
  ],
  {}
);

router.init();
autoRegisterRoutesFromRouter(commandService, router);
```

После этого навигационные команды автоматически появятся в палитре в категории
`Navigation`.

## 3. Горячие клавиши

```ts
commandService.registerShortcut('Ctrl+Shift+H', 'hello');
commandService.registerShortcut('g h', 'hello');
commandService.registerShortcut('Ctrl+Shift+F', 'search');
```

## 4. Подключение UI-компонента

```ts
import '@tinijs/ui';

const palette = document.createElement('tini-command-palette');
palette.commandService = commandService;
palette.theme = 'light';
palette.family = 'tini';

document.body.appendChild(palette);
```

## 5. Ожидаемое поведение

- `Ctrl+K` открывает палитру.
- Стрелки вверх/вниз меняют выбранную команду.
- `Enter` выполняет команду.
- `Esc` закрывает палитру или отменяет асинхронную команду.
- Команды с `args` открывают форму параметров.
- История выполненных команд сохраняется в `localStorage` по ключу
  `tinijs.history.commands`.

## 6. Demo

Рабочий пример находится в
[apps/demo-command-palette/app/app.ts](/mnt/c/Users/likut/WebstormProjects/KS-lab-4/apps/demo-command-palette/app/app.ts).
