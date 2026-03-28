export interface CommandArgument {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  description?: string;
}

export type CommandArgs = Record<string, unknown>;
export type CommandContext = unknown;
export type CommandAction = (
  args?: CommandArgs,
  abortSignal?: AbortSignal
) => Promise<void> | void;

export interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  action: CommandAction;
  keywords?: string[];
  category?: string;
  shouldShow?: (context: CommandContext) => boolean;
  args?: CommandArgument[];
  closeOnRun?: boolean;
}

export interface ShortcutDefinition {
  keys: string;
  commandId: string;
  preventDefault?: boolean;
  priority?: number;
}
