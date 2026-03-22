# API: CommandService и команды

Цель: определить контракт регистрации команд, горячих клавиш и навигации внутри TiniJS.

1. Основные типы
- CommandDefinition: { id: string; name: string; description?: string; icon?: string; action: (args?: any) => Promise<void> | void; keywords?: string[]; category?: string; shouldShow?: (context: any) => boolean; }
- ShortcutDefinition: { keys: string; commandId: string; preventDefault?: boolean }

2. CommandService (пакет @tinijs/toolbox)
- registerCommand(id: string, name: string, description?: string, icon?: string, action: (args?: any) => Promise<void> | void, keywords?: string[]): void
- unregisterCommand(id: string): void
- getRegisteredCommands(): CommandDefinition[]
- unregister all by category or id (гибкая фильтрация)
- shouldShow: boolean | (commandId, context) => boolean
- subscribeContext(context$): void  // контекст страницы или приложения
- getContext(): any
- Dynamic registration/deregistration: support for add/remove at runtime

3. Горячие клавиши (hotkeys)
- registerShortcut(keys: string, commandId: string, preventDefault?: boolean): void
- unregisterShortcut(keys: string, commandId?: string): void
- Поддержка последовательностей клавиш и модификаторов: Ctrl, Alt, Shift, Meta
- Разрешение конфликтов: при конфликте — выбирать более приоритетную команду или возвращать конфликт-результат
- В палитре показывать назначенные сокращения рядом с командами (через tini-shortcut)

4. Интеграция с роутером
- Автоматическая регистрация навигационных команд для зарегистрированных роутов
- Формат команд навигации: "Перейти к [Название]"; маршруты получаются через @tinijs/router
- Поддержка быстрого доступа к недавно посещённым страницам

5. Аргументы команд
- Поддержка передачи аргументов через action(args)
- Поддержка автодополнения аргументов (строки, числа и т.д.)

6. Пресс-типки и API экспорт
- Экпортировать публичные типы и сервисы через public-api.ts соответствующих пакетов

7. Примеры и совместимость
- Совместимость с существующими UI компонентами @tinijs/ui (Input, Dialog, Spinner)
- Использование createStore из @tinijs/store для хранения истории команд

Примечание: детали реализации обсуждаются на этапе прототипирования; этот документ задаёт контракт и ожидаемую функциональность.
