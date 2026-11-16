/**
 * Ajustes do player da página do episódio: nitidez, volume extra e modo noturno.
 * Tudo aplicado no próprio <video> (filtro CSS e Web Audio); nada sai do navegador.
 */
import { storage } from '../shared/storage';
import { Settings } from '../shared/types';
import { runAutoSkip } from './autoskip';
import { t } from '../shared/i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';
const FILTER_ID = 'boa-sharpen';
const NIGHT_FROM = 20;
const NIGHT_TO = 6;

interface AudioChain { context: AudioContext; gain: GainNode }
const chains = new WeakMap<HTMLVideoElement, AudioChain>();

const isNight = (): boolean => {
  const hour = new Date().getHours();
  return hour >= NIGHT_FROM || hour < NIGHT_TO;
};

function ensureSharpenFilter(): SVGFEConvolveMatrixElement {
  const existing = document.getElementById(FILTER_ID);
  const found = existing?.querySelector('feConvolveMatrix');
  if (found) return found as SVGFEConvolveMatrixElement;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.id = FILTER_ID;
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  const matrix = document.createElementNS(SVG_NS, 'feConvolveMatrix') as SVGFEConvolveMatrixElement;
  matrix.setAttribute('order', '3');
  matrix.setAttribute('preserveAlpha', 'true');
  filter.appendChild(matrix);
  svg.appendChild(filter);
  document.documentElement.appendChild(svg);
  return matrix;
}

/** Máscara de nitidez: centro 1+4k, vizinhos diretos -k (k = 0 não altera a imagem). */
function setSharpness(percent: number): boolean {
  if (percent <= 0) return false;
  const k = (percent / 100) * 0.6;
  ensureSharpenFilter().setAttribute('kernelMatrix', `0 ${-k} 0 ${-k} ${1 + 4 * k} ${-k} 0 ${-k} 0`);
  return true;
}

function buildFilter(settings: Settings): string {
  const parts: string[] = [];
  if (setSharpness(settings.playerSharp)) parts.push(`url(#${FILTER_ID})`);
  const night = settings.playerNight / 100;
  if (night > 0 && (!settings.playerNightAuto || isNight())) {
    // Menos azul (sépia + matiz levemente quente) e menos brilho, na intensidade escolhida.
    parts.push(`sepia(${(night * 0.55).toFixed(2)})`, `hue-rotate(${Math.round(-12 * night)}deg)`, `brightness(${(1 - night * 0.28).toFixed(2)})`);
  }
  return parts.join(' ');
}

function ensureChain(video: HTMLVideoElement): AudioChain | null {
  const known = chains.get(video);
  if (known) return known;
  try {
    const context = new AudioContext();
    const source = context.createMediaElementSource(video);
    const gain = context.createGain();
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    source.connect(gain);
    gain.connect(limiter);
    limiter.connect(context.destination);
    const chain = { context, gain };
    chains.set(video, chain);
    return chain;
  } catch {
    return null;
  }
}

function applyVolume(video: HTMLVideoElement, percent: number): void {
  // Só mexe no áudio quando há reforço; depois de criada, a cadeia fica e passa a 100%.
  if (percent <= 100 && !chains.has(video)) return;
  const chain = ensureChain(video);
  if (!chain) return;
  chain.gain.gain.value = percent / 100;
  if (chain.context.state === 'suspended') void chain.context.resume().catch(() => undefined);
}

/** Aplica os ajustes ao vídeo atual. Barato: chamado a cada ciclo da extensão na página do episódio. */
export function applyPlayer(): void {
  const video = document.querySelector<HTMLVideoElement>('video');
  if (!video) return;
  const settings = storage.peekSettings();
  const filter = buildFilter(settings);
  if (video.style.filter !== filter) video.style.filter = filter;
  applyVolume(video, settings.playerGain);
  runAutoSkip();
}

/* ---------- painel ---------- */

type Slider = { key: 'playerSharp' | 'playerGain' | 'playerNight'; label: string; min: number; max: number; step: number; unit: string };

const SLIDERS: Slider[] = [
  { key: 'playerSharp', label: 'Nitidez', min: 0, max: 100, step: 5, unit: '%' },
  { key: 'playerGain', label: 'Volume extra', min: 100, max: 300, step: 10, unit: '%' },
  { key: 'playerNight', label: 'Modo noturno', min: 0, max: 100, step: 5, unit: '%' }
];

export function buildPlayerButton(): HTMLElement {
  const wrap = document.createElement('span');
  wrap.className = 'boa-player-wrap';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'boa-player-btn';
  button.title = t('Ajustes do player (nitidez, volume, modo noturno)');
  button.setAttribute('aria-label', t('Ajustes do player'));
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg>';
  const panel = document.createElement('div');
  panel.className = 'boa-player-panel';
  panel.hidden = true;
  panel.addEventListener('click', event => event.stopPropagation());

  const settings = storage.peekSettings();
  for (const slider of SLIDERS) {
    const row = document.createElement('label');
    row.className = 'boa-player-row';
    const name = document.createElement('span');
    const value = document.createElement('output');
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(slider.min);
    input.max = String(slider.max);
    input.step = String(slider.step);
    input.value = String(settings[slider.key]);
    name.textContent = t(slider.label);
    value.textContent = `${input.value}${slider.unit}`;
    input.addEventListener('input', () => {
      value.textContent = `${input.value}${slider.unit}`;
      void storage.updateSettings({ [slider.key]: Number(input.value) } as Partial<Settings>).then(applyPlayer);
    });
    row.append(name, value, input);
    panel.appendChild(row);
  }
  const auto = document.createElement('label');
  auto.className = 'boa-player-auto';
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = settings.playerNightAuto;
  check.addEventListener('change', () => {
    void storage.updateSettings({ playerNightAuto: check.checked }).then(applyPlayer);
  });
  auto.append(check, document.createTextNode(t(' Noturno só das {from}h às {to}h', { from: NIGHT_FROM, to: NIGHT_TO })));
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'boa-player-reset';
  reset.textContent = t('Restaurar');
  reset.addEventListener('click', () => {
    void storage.updateSettings({ playerSharp: 0, playerGain: 100, playerNight: 0, playerNightAuto: false }).then(() => {
      applyPlayer();
      panel.querySelectorAll<HTMLInputElement>('input[type=range]').forEach((input, index) => {
        input.value = String(index === 1 ? 100 : 0);
        const out = input.parentElement?.querySelector('output');
        if (out) out.textContent = `${input.value}${SLIDERS[index].unit}`;
      });
      check.checked = false;
    });
  });
  const skip = document.createElement('label');
  skip.className = 'boa-player-auto';
  const skipCheck = document.createElement('input');
  skipCheck.type = 'checkbox';
  skipCheck.checked = settings.autoSkip;
  skipCheck.addEventListener('change', () => {
    void storage.updateSettings({ autoSkip: skipCheck.checked }).then(applyPlayer);
  });
  skip.append(skipCheck, document.createTextNode(' ' + t('Pular abertura e resumo (D cancela)')));
  panel.append(skip, auto, reset);

  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    panel.hidden = !panel.hidden;
  });
  document.addEventListener('click', event => {
    if (!panel.hidden && !event.composedPath().includes(wrap)) panel.hidden = true;
  });
  wrap.append(button, panel);
  return wrap;
}
