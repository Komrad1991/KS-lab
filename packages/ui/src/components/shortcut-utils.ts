const KEY_LABELS: Record<string, string> = {
  alt: 'Alt',
  cmd: '⌘',
  command: '⌘',
  ctrl: 'Ctrl',
  enter: 'Enter',
  esc: 'Esc',
  meta: '⌘',
  shift: 'Shift',
};

export function normalizeShortcutKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return '';
  return (
    KEY_LABELS[normalized] ??
    (normalized.length === 1
      ? normalized.toUpperCase()
      : normalized[0].toUpperCase() + normalized.slice(1))
  );
}

export function renderShortcut(keys: string): string {
  return keys
    .split(/\s+/)
    .map(group =>
      group
        .split('+')
        .map(key => normalizeShortcutKey(key))
        .join('+')
    )
    .join(' then ');
}
