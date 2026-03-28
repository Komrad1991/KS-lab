import type {
  CommandArgument,
  CommandDefinition,
} from '../types/command-definition.js';

export function moveSelectionIndex(
  currentIndex: number,
  itemCount: number,
  delta: number
): number {
  if (!itemCount) return 0;
  const nextIndex = currentIndex + delta;
  if (nextIndex < 0) return itemCount - 1;
  if (nextIndex >= itemCount) return 0;
  return nextIndex;
}

export function createInitialArgumentValues(
  args: CommandArgument[]
): Record<string, unknown> {
  return args.reduce<Record<string, unknown>>((result, argument) => {
    result[argument.name] =
      argument.type === 'select' ? argument.options?.[0] ?? '' : '';
    return result;
  }, {});
}

export function coerceArgumentValue(
  argument: CommandArgument,
  rawValue: string
): unknown {
  if (argument.type !== 'number') return rawValue;
  return rawValue === '' ? '' : Number(rawValue);
}

export function getArgumentCommand(
  items: CommandDefinition[],
  argsCommandId: string
): CommandDefinition | undefined {
  return items.find(item => item.id === argsCommandId);
}
