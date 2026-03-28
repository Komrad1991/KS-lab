# API: CommandService и команды

Цель: определить контракт регистрации команд, горячих клавиш и навигации внутри TiniJS.

## 1. Основные типы

**CommandArgument**:

```ts
interface CommandArgument {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[]; // для type='select'
  description?: string;
}
```

**CommandDefinition**:

```ts
interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  action: (
    args?: Record<string, any>,
    abortSignal?: AbortSignal
  ) => Promise<void> | void;
  keywords?: string[];
  category?: string;
  shouldShow?: (context: any) => boolean;
  args?: CommandArgument[];
}
```

**ShortcutDefinition**:

```ts
interface ShortcutDefinition {
  keys: string;
  commandId: string;
  preventDefault?: boolean;
}
```

## 2. CommandService (пакет @tinijs/toolbox)

### Основные методы

- `registerCommand(id: string, name: string, description?: string, icon?: string, action?: (args?: Record<string, any>, abortSignal?: AbortSignal) => Promise<void> | void, keywords?: string[], category?: string, shouldShow?: (ctx:any)=>boolean, args?: CommandArgument[]): void`
- `unregisterCommand(id: string): void`
- `getRegisteredCommands(): CommandDefinition[]`
- `getCommandsByCategory(): Map<string, CommandDefinition[]>`
- `searchCommands(query: string, context?: any): CommandDefinition[]` — возвращает отсортированный по релевантности (fuzzy + history boost) список
- `runCommand(id: string, args?: Record<string, any>, abortSignal?: AbortSignal): Promise<void>` — исполняет команду с поддержкой отмены
- `markCommandUsed(id: string): void` — вручную помечает команду как использованную; полезно для интеграций вроде роутера
- `getShortcut(commandId: string): string | undefined` — возвращает строку хоткея для команды (последний зарегистрированный)
- `getHistory(): string[]` — история выполненных команд (IDs)
- `getUsageCount(commandId: string): number` — количество использований команды
- `getRecentCommands(limit?: number): CommandDefinition[]` — последние N команд из истории

### Контекст

- `subscribeContext(cb: (ctx:any)=>void): void`
- `getContext(): any`
- `updateContext(ctx: any): void`

### Горячие клавиши

- `registerShortcut(keys: string, commandId: string, preventDefault = false): void`
- `unregisterShortcut(keys: string, commandId?: string): void`
  - Поддерживаются одиночные комбинации (Ctrl+K) и последовательности ("g h")
  - Приоритет: последний зарегистрированный хоткей перезаписывает предыдущие (last-write-wins)
  - Конфликты разрешаются в пользу последней регистрации
  - Последовательности сбрасываются по таймауту (800 мс)

### Интеграция с роутером

- `autoRegisterRoutesFromRouter(service: CommandService, router: any): void` — автоматически регистрирует навигационные команды на основе `router.routes` или `router.getRoutes()`
  - Также отслеживает события роутера и помечает посещённые страницы как recent-навигационные команды
- `registerNavigationCommandsFromRoutes(service: CommandService, routes: Array<{name:string, path:string}>, navigateFn?: (path:string)=>void): void`
  - Формат команды: `"Перейти к ${route.name}"`
  - По умолчанию навигация через `history.pushState` или `window.location.assign`

## 3. UI-компоненты (пакет @tinijs/ui)

**tini-command-palette**:

- Свойства:
  - `commandService: CommandService` — сервис команд
  - `theme: 'light' | 'dark'` — тема палитры (по умолчанию 'light')
- Открытие: глобальное сочетание `Cmd/Ctrl+K` (перехват в компоненте)
- Поиск: нечеткий поиск (fuzzy) по имени, описанию, keywords
- Навигация: `ArrowUp/Down`, `Enter` — выполнение, `Esc` — закрытие или отмена текущей команды
- Клик вне окна закрывает палитру
- Поддержка аргументов: если команда имеет `args`, после выбора отображается форма ввода/селекта; кнопка «Запустить» выполняет команду с аргументами
- Индикация загрузки: спиннер рядом с командой во время выполнения
- Отмена: нажатие `Esc` во время выполнения асинхронной команды отправляет `AbortSignal` в `action`
- Отображение хоткеев: справа от команды показывается визуализация сочетания (через `tini-shortcut`)
- Темы: CSS-переменные, поддерживает светлую/темную тему; можно расширить для 9 тем (Bootstrap, Material, iOS, Fluent, Radix, Chakra, Daisy, Shadcn)

**tini-command-item**:

- Элемент списка: имя, описание, иконка (если задана), shortcut, спиннер загрузки
- Состояния: selected, loading

**tini-shortcut**:

- Визуализация горячих клавиш: преобразует строку `"Ctrl+K"` в пользовательское отображение (например, `"Ctrl+K"` или `"⌘K"` на Mac)

## 4. История и ранжирование

- История хранится в `localStorage` под ключом `tinijs.history.commands`
- Частота использования хранится отдельно и учитывается при ранжировании результатов поиска
- Поддержка «недавних страниц» через `getRecentCommands()` и автоматическое отслеживание роут-событий для навигационных команд

## 5. Асинхронность и отмена

- `action` может возвращать `Promise` и принимать `abortSignal: AbortSignal`
- При нажатии `Esc` во время выполнения текущей команды — все запущенные команды получают abort
- UI показывает спиннер и кнопку отмены (или просто Esc)

## 6. Пример использования

```ts
import {CommandService} from '@tinijs/toolbox';
import {TiniCommandPalette} from '@tinijs/ui';
import {Router} from '@tinijs/router';
import {autoRegisterRoutesFromRouter} from '@tinijs/toolbox';

const service = new CommandService();

// Простая команда
service.registerCommand('hello', 'Say Hello', 'Shows hello', undefined, () =>
  alert('Hi')
);

// Команда с аргументами
service.registerCommand(
  'search',
  'Search',
  'Search the web',
  undefined,
  args => {
    console.log('Query:', args.query);
  },
  ['find'],
  'Demo',
  undefined,
  [{name: 'query', type: 'string', description: 'Search query'}]
);

// Асинхронная команда с abort
service.registerCommand(
  'longtask',
  'Long task',
  'Runs long task',
  undefined,
  async signal => {
    for (let i = 0; i < 10; i++) {
      if (signal.aborted) throw new Error('Cancelled');
      await new Promise(r => setTimeout(r, 500));
    }
    alert('Done');
  },
  [],
  'Demo'
);

// Роутер и навигационные команды
const router = new Router([{path: '/', title: 'Home'}], {});
router.init();
autoRegisterRoutesFromRouter(service, router);

// UI палитра
const palette = new TiniCommandPalette();
palette.commandService = service;
palette.theme = 'light'; // или 'dark'
document.body.appendChild(palette);
```

## 7. Экспорт

В `public-api.ts` пакетов экспортируются:

- `@tinijs/toolbox`: `CommandService`, `CommandDefinition`, `CommandArgument`, `autoRegisterRoutesFromRouter`, `registerNavigationCommandsFromRoutes`
- `@tinijs/ui`: `TiniCommandPalette`, `TiniCommandItem`, `TiniShortcut`

## 8. Тестирование

- Unit-тесты для `CommandService` (регистрация, поиск, контекст, hotkeys)
- Тесты fuzzy-поиска
- Тесты клавиатурных событий и последовательностей
- Интеграционные тесты навигации и аргументов

## 9. Ожидаемое поведение

- Палитра открывается `Cmd/Ctrl+K`
- Поиск работает мгновенно, результаты ранжируются
- стрелки навигации, Enter — выполнение
- Esc — закрытие или отмена
- Hotkeys работают глобально; при конфликте последний перезаписывает
- Навигационные команды автоматически появляются
- История используется для ранжирования
- Аргументы команд запрашиваются интерактивно
- Асинхронные команды показывают индикатор загрузки; Esc отменяет

Примечание: этот документ отражает текущий контракт после реализации.
