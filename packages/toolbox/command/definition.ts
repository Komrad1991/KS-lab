export interface CommandArgument {
  name: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  description?: string;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  action: (args?: Record<string, any>, abortSignal?: AbortSignal) => Promise<void> | void;
  keywords?: string[];
  category?: string;
  shouldShow?: (context: any) => boolean;
  args?: CommandArgument[];
}

export interface ShortcutDefinition {
  keys: string;
  commandId: string;
  preventDefault?: boolean;
}
