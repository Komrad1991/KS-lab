# Instructions

Этот файл содержит быстрые команды для запуска проекта, отдельных приложений и тестов.

## Требования

- Node.js `>= 18.15.0`
- npm `>= 7`
- Windows PowerShell или любой совместимый shell

## Установка зависимостей

Из корня репозитория:

```powershell
npm install
```

Если нужны браузерные e2e-тесты Playwright, один раз установи браузер:

```powershell
npx playwright install chromium
```

## Основные команды из корня

Собрать все пакеты и приложения:

```powershell
npm run build
```

Запустить все unit-тесты через Lerna:

```powershell
npm run test
```

Запустить coverage для ключевых пакетов command palette:

```powershell
npm run test:coverage
```

Запустить browser e2e для демо command palette:

```powershell
npm run test:e2e
```

Запустить линтер для всех workspace:

```powershell
npm run lint
```

Автоисправление линтера:

```powershell
npm run fix
```

Форматирование всего репозитория:

```powershell
npm run format
```

## Запуск отдельных приложений

### `demo-command-palette`

Готовое демо для ручной проверки command palette:

Режим разработки:

```powershell
npm run dev -w demo-command-palette
```

Сборка:

```powershell
npm run build -w demo-command-palette
```

Локальный preview после сборки:

```powershell
npm run preview -w demo-command-palette
```

Browser e2e:

```powershell
npm run test:e2e -w demo-command-palette
```

Browser e2e в видимом браузере:

```powershell
npm run test:e2e:headed -w demo-command-palette
```

Рекомендуемый сценарий ручной проверки:

```text
1. Открыть палитру через Ctrl+K
2. Выполнить Say Hello
3. Запустить Search Commands и передать аргумент
4. Запустить Async Task и отменить через Esc
5. Проверить Fail Command
6. Проверить переход на About
```

### `tinijs.dev`

Режим разработки:

```powershell
npm run dev -w tinijs.dev
```

Сборка:

```powershell
npm run build -w tinijs.dev
```

Preview:

```powershell
npm run preview -w tinijs.dev
```

### `benchmark.tinijs.dev`

Режим разработки:

```powershell
npm run dev -w benchmark.tinijs.dev
```

Сборка:

```powershell
npm run build -w benchmark.tinijs.dev
```

Preview:

```powershell
npm run preview -w benchmark.tinijs.dev
```

## Запуск тестов по пакетам

Большинство пакетов в `packages/*` используют `vitest run`.

Примеры:

```powershell
npm run test -w @tinijs/toolbox
npm run test -w @tinijs/ui
npm run test -w @tinijs/router
```

Coverage по целевым пакетам:

```powershell
npm run test:coverage -w @tinijs/toolbox
npm run test:coverage -w @tinijs/ui
```

Точечная сборка пакета:

```powershell
npm run build -w @tinijs/toolbox
npm run build -w @tinijs/ui
```

Точечный линт:

```powershell
npm run lint -w @tinijs/toolbox
npm run lint -w @tinijs/ui
```

## Полезные варианты запуска

Если нужно только проверить command palette без полного прогона monorepo:

```powershell
npm run build -w demo-command-palette
npm run test:e2e -w demo-command-palette
```

Если нужно быстро проверить только один пакет:

```powershell
npm run test -w @tinijs/toolbox
```

Если нужно одновременно проверить качество кода перед сдачей:

```powershell
npm run lint
npm run test
npm run test:e2e
```

## Где что находится

- Приложения: `apps/*`
- Пакеты: `packages/*`
- Browser e2e command palette: `apps/demo-command-palette/e2e/*`
- Конфиг Playwright: `apps/demo-command-palette/playwright.config.ts`
