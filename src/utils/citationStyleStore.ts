// A simple global store for the active citation style so all components can react to changes.
// This avoids threading props through TipTap's extension system.

type Listener = (style: string) => void;

let currentStyle = 'apa';
const listeners = new Set<Listener>();

export function getCitationStyle(): string {
  return currentStyle;
}

export function setCitationStyle(style: string): void {
  currentStyle = style;
  listeners.forEach(fn => fn(style));
}

export function onCitationStyleChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
