/**
 * Pular abertura/resumo/créditos: só aperta os botões "Pular…" que o próprio player já mostra.
 * Não procura cenas, não mexe no tempo do vídeo e não faz nenhuma requisição.
 */
import { storage } from '../shared/storage';
import { t } from '../shared/i18n';

type Kind = 'intro' | 'recap' | 'credits' | 'other';

const KIND_WORDS: Array<[Kind, RegExp]> = [
  ['credits', /cr[eé]dito|encerramento|ending|credits|outro/i],
  ['recap', /resumo|recap/i],
  ['intro', /introdu|abertura|intro|opening/i]
];
const SKIP_WORDS = /pular|skip|saltar|omitir|passer/i;

let pending: { button: HTMLElement; timer: number } | null = null;
let clicked: HTMLElement | null = null;
let notify: (text: string) => void = () => undefined;

export function onSkipped(callback: (text: string) => void): void {
  notify = callback;
}

function classify(label: string): Kind {
  for (const [kind, pattern] of KIND_WORDS) if (pattern.test(label)) return kind;
  return 'other';
}

/** O botão de pular aparece (opacidade 1) só enquanto o trecho está tocando. */
function visibleSkipButton(): { button: HTMLElement; label: string } | null {
  const root = document.querySelector('[data-testid="player-controls-root"]') ?? document;
  for (const button of root.querySelectorAll<HTMLElement>('button[aria-label]')) {
    const label = button.getAttribute('aria-label') || '';
    if (!SKIP_WORDS.test(label)) continue;
    if (parseFloat(getComputedStyle(button).opacity) < 0.5 || button.offsetWidth === 0) continue;
    return { button, label };
  }
  return null;
}

export function cancelSkip(): boolean {
  if (!pending) return false;
  window.clearTimeout(pending.timer);
  clicked = pending.button;
  pending = null;
  notify(t('Pulo automático cancelado'));
  return true;
}

/** Chamado a cada ciclo da extensão na página do episódio. */
export function runAutoSkip(): void {
  const settings = storage.peekSettings();
  const found = settings.autoSkip ? visibleSkipButton() : null;
  if (!found) {
    // Nada para pular (ou recurso desligado): limpa o estado para o próximo trecho.
    if (pending) {
      window.clearTimeout(pending.timer);
      pending = null;
    }
    clicked = null;
    return;
  }
  if (found.button === clicked || pending?.button === found.button) return;
  const kind = classify(found.label);
  if (kind === 'credits' && !settings.autoSkipCredits) return;
  const delay = Math.max(0, settings.autoSkipDelay) * 1000;
  const button = found.button;
  const timer = window.setTimeout(() => {
    pending = null;
    if (!storage.peekSettings().autoSkip || !button.isConnected) return;
    if (parseFloat(getComputedStyle(button).opacity) < 0.5) return;
    clicked = button;
    button.click();
    notify(found.label);
  }, delay);
  pending = { button, timer };
}
