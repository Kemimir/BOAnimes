/**
 * Cor de destaque da extensão e da Crunchyroll. Tudo no CSS usa estas variáveis
 * (--boa-acc e companhia), então trocar a cor vale na hora, sem recarregar.
 */
export type AccentId = 'redrat' | 'orange' | 'pink' | 'purple' | 'blue' | 'cyan' | 'green' | 'yellow';

export interface Accent {
  label: string;
  /** Cor principal e o mesmo valor em R, G, B (para rgba). */
  acc: string;
  rgb: string;
  /** Tom claro (degradês, selos) e tom escuro (degradês). */
  light: string;
  dark: string;
  /** Cor do texto sobre a cor de destaque. */
  on: string;
}

export const ACCENTS: Record<AccentId, Accent> = {
  redrat: { label: 'Vermelho RedRat', acc: '#f02043', rgb: '240, 32, 67', light: '#ff5c78', dark: '#8a1228', on: '#ffffff' },
  orange: { label: 'Laranja original', acc: '#ff640a', rgb: '255, 100, 10', light: '#fab818', dark: '#c13937', on: '#1c0f04' },
  pink: { label: 'Rosa', acc: '#ff4fa3', rgb: '255, 79, 163', light: '#ff9ccb', dark: '#9c1f60', on: '#1c0412' },
  purple: { label: 'Roxo', acc: '#a56bff', rgb: '165, 107, 255', light: '#d0b0ff', dark: '#5a2fb0', on: '#12061f' },
  blue: { label: 'Azul', acc: '#3b9cff', rgb: '59, 156, 255', light: '#8fc8ff', dark: '#1a4f95', on: '#04101f' },
  cyan: { label: 'Ciano', acc: '#19c6d9', rgb: '25, 198, 217', light: '#7fe6f0', dark: '#0b6572', on: '#02161a' },
  green: { label: 'Verde', acc: '#2fd37b', rgb: '47, 211, 123', light: '#8bebb7', dark: '#157345', on: '#03160c' },
  yellow: { label: 'Amarelo', acc: '#f5c518', rgb: '245, 197, 24', light: '#ffe27a', dark: '#a37a05', on: '#1c1502' }
};

export const DEFAULT_ACCENT: AccentId = 'redrat';

export const isAccent = (value: unknown): value is AccentId => typeof value === 'string' && value in ACCENTS;

/** Põe as variáveis de cor no <html>; só escreve quando algo muda. */
export function applyAccent(id: unknown): void {
  const accent = ACCENTS[isAccent(id) ? id : DEFAULT_ACCENT];
  const style = document.documentElement.style;
  const values: Array<[string, string | null]> = [
    ['--boa-acc', accent.acc],
    ['--boa-acc-rgb', accent.rgb],
    ['--boa-acc-2', accent.light],
    ['--boa-acc-dark', accent.dark],
    ['--boa-on-acc', accent.on],
    // O selo "RedRat Edition" ao lado da logo só combina com as cores novas.
    ['--boa-edition', id === 'orange' ? '""' : null]
  ];
  for (const [name, value] of values) {
    if (value === null) {
      if (style.getPropertyValue(name)) style.removeProperty(name);
    } else if (style.getPropertyValue(name) !== value) {
      style.setProperty(name, value);
    }
  }
}
