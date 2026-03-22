# API: CommandService и команды

Цель: определить контракт для регистрации команд, горячих клавиш и навигации внутри TiniJS.

1. CommandService (пакет @tinijs/toolbox)
- Методы регистрации:
  - registerCommand(id: string, name: string, description?: string, icon?: string, action: (args?: any) => Promise<void> | void, keywords?: string[]): void
- Регистрация и удаление команд по id: unregisterCommand(id: string): void
- Группировка команд по категориям: { id, label, commands: string[] }
- Условия отображения команд: shouldShow(commandId, context): boolean
- Получение зарегистрированных команд: getRegisteredCommands(): CommandDefinition[]
- Регистрация и отмена регистрации контекст-зависимых команд (subscribeContext/context$)
- Архитектура: Commands хранится в store (state) и обновляется по регистрации/удалению

- Регистрация горячих клавиш (hotkeys):
  - registerShortcut(keys: string, commandId: string, preventDefault?: boolean): void
- Поддержка последовательностей клавиш и модификаторов: Ctrl, Alt, Shift, Meta, и т.д.
- Обработка конфликтов: если два хоткея clash, выбрать более приоритетную команду или вернуть конфликт-результат.
- Отображение назначения в палитре рядом с командой (компонент tini-shortcut)

- Интеграция с роутером:
  - Автоматическая регистрация навигационных команд для зарегистрированных роутов
  - Формат: "Перейти к [Название]"; путь к роуту через @tinijs/router

-Аргументы команд:
  - Поддержка передачи аргументов через action args
  - Поддержка автодополнения аргументов (строки, числовые значения)

2. Команды и типы
- CommandDefinition: { id: string; name: string; description?: string; icon?: string; action: (args?: any) => Promise<void> | void; keywords?: string[]; category?: string; }
- ShortcutDefinition: { keys: string; commandId: string; preventDefault?: boolean }

3. Взаимодействие с UI
- Pallete использует tini-command-palette и tini-command-item, tini-shortcut
- Команды отображаются с иконкой и описанием; ярлыки клавиатурных сокращений отображаются рядом
- Поиск поддерживает fuzzy-search; можно встроить transliterate как опцию

4. Тестирование
- unit-тесты для CommandService и алгоритмов поиска, обработки клавиатур
- интеграционные тесты для регистрации команд и навигации
- пример использования в apps/

5. Экспорт API
- Экспортировать публичные типы и сервисы через public-api.ts соответствующих пакетов

Примечание: детали реализации будут обсуждены на этапе прототипирования. Этот документ задаёт контракт и ожидаемую функциональность.
