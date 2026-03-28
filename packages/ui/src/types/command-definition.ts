export interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  action: (
    args?: Record<string, unknown>,
    abortSignal?: AbortSignal
  ) => Promise<void> | void;
  keywords?: string[];
  category?: string;
  shouldShow?: (context: unknown) => boolean;
  args?: CommandArgument[];
  closeOnRun?: boolean;
}

export interface CommandArgument {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  description?: string;
}

export interface ShortcutDefinition {
  keys: string;
  commandId: string;
  preventDefault?: boolean;
  priority?: number;
}
