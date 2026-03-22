export interface CommandDefinition {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  action: (args?: any) => Promise<void> | void;
  keywords?: string[];
  category?: string;
  shouldShow?: (context: any) => boolean;
}

export interface ShortcutDefinition {
  keys: string;
  commandId: string;
  preventDefault?: boolean;
}
