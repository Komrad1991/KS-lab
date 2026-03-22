export function renderShortcut(keys: string): string {
  return keys
}

export class TiniShortcut {
  constructor(public keys: string) {}
  toString(): string { return renderShortcut(this.keys) }
}
