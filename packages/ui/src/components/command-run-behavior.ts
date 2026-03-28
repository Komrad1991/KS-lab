import type {CommandDefinition} from '../types/command-definition.js';

export function shouldClosePaletteAfterRun(
  command: Pick<CommandDefinition, 'closeOnRun'>
): boolean {
  return command.closeOnRun !== false;
}
