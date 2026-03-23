# UI Компоненты Command Palette

## 1. tini-command-palette

Основной модальный компонент палитры.

### Функциональность
- Открытие по Cmd/Ctrl+K; закрытие Esc и кликом вне окна.
- Поле поиска с fuzzy-search; навигация стрелками; Enter — выполнение.
- Отображение списка команд: иконка, название, описание, shortcut.
- Поддержка аргументов команд: если у команды есть `args`, отображается интерактивная форма (input/select) с кнопкой «Запустить» и «Отмена».
- Индикатор загрузки: спиннер рядом с командой во время выполнения.
- Отмена асинхронных команд: нажатие Esc отправляет AbortSignal в `action`.
- Визуальная подсветка текущего выбора; рядом отображаются клавиатурные сокращения.
- Поддержка светлой/темной темы; стилизация под 9 тем оформления.

### Свойства
- `commandService: CommandService` — сервис команд (обязательно)
- `theme: 'light' | 'dark'` — тема палитры (по умолчанию 'light')

### Стилизация
- CSS-переменные: `--cp-bg`, `--cp-fg`, `--cp-item-bg`, `--cp-item-hover`, `--cp-item-selected`, `--cp-shortcut-bg`, `--cp-shortcut-fg`, `--cp-border`, `--cp-shadow`
- Тема задается через свойство `theme` или атрибут `theme` на элементе.
- Легко расширяем для 9 тем: Bootstrap, Material, iOS, Fluent, Radix, Chakra, Daisy, Shadcn, Tini.

## 2. tini-command-item

Элемент списка команды.

### Отображаемые данные
- Иконка (если задана)
- Название команды
- Описание (если задано)
- Горячие клавиши (через `tini-shortcut`)
- Индикатор загрузки (spinner) для асинхронных команд
- Форма аргументов (если команда выбрана и имеет `args`)

### Состояния
- `selected` — текущий выбранный элемент
- `loading` — команда выполняется

## 3. tini-shortcut

Компонент отображения клавиатурного сокращения.

### Вход
- `keys: string` — строка сочетания, например "Ctrl+K", "Meta+Shift+P", "g h"

### Визуализация
- Упрощённое преобразование: `Ctrl`, `Meta` (⌘), `Alt`, `Shift`.
- Поддержка последовательностей: "g h" отображается как "g h".
- Адаптация к теме (цвет, фон, скругление).

## 4. Совместимость и интеграция

- Компоненты соответствуют базовым интерфейсам `@tinijs/ui` (расширяют `TiniComponent`).
- Используются существующие утилиты: `CommandService`, `fuzzyFilter`.
- `tini-command-palette` подписывается на `commandService.searchCommands` и обновляет список при изменении поискового запроса.
- Поддержка автодополнения аргументов: `type='select'` использует `options` для выпадающего списка.
- Интеграция с `@tinijs/router` через `autoRegisterRoutesFromRouter`.

## 5. Пример использования

```ts
import { CommandService } from '@tinijs/toolbox'
import { TiniCommandPalette } from '@tinijs/ui'

const service = new CommandService()
service.registerCommand('hello', 'Say Hello', 'Hello world', undefined, () => alert('Hi'))

const palette = new TiniCommandPalette()
palette.commandService = service
palette.theme = 'dark'
document.body.appendChild(palette)
```

## 6. Тестирование UI

- Unit-тесты на отрисовку элементов списка
- Тесты навигации стрелками и выбор Enter
- Тесты закрытия по Esc и клику вне окна
- Тесты отображения спиннера и форм аргументов
- Интеграционные тесты полного цикла (поиск → выбор → выполнение)

## 7. Примечания

- Стили по умолчанию минималистичны; при необходимости можно переопределить через CSS-переменные.
- Поддержка мобильных устройств: адаптивная ширина панели (92vw, max 720px).
- Доступность: `aria-selected`, `role="option"`, `aria-hidden` на overlay.
