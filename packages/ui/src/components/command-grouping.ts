import type {CommandDefinition} from '../types/command-definition.js';

export interface GroupedCommandSection {
  category: string;
  entries: Array<{
    command: CommandDefinition;
    index: number;
  }>;
}

export function groupCommandsByCategory(
  commands: CommandDefinition[],
  fallbackCategory = 'Commands'
): GroupedCommandSection[] {
  const sections = new Map<string, GroupedCommandSection>();

  commands.forEach((command, index) => {
    const category = command.category?.trim() || fallbackCategory;
    const section = sections.get(category) || {
      category,
      entries: [],
    };
    section.entries.push({command, index});
    sections.set(category, section);
  });

  return Array.from(sections.values());
}
