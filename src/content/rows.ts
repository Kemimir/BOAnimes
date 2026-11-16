/**
 * Setas laterais das fileiras em grade. A rolagem vira nativa (sem as setas do
 * site, que dependiam de um deslocamento por JS) e as barras de rolagem somem:
 * estas setas rolam a fileira de página em página, como no original.
 */

const CHEVRON = 'M8.59 16.59 13.17 12 8.59 7.41 10 6l6 6-6 6z';

function makeArrow(direction: 'prev' | 'next'): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `boa-row-arrow boa-row-${direction}`;
  button.setAttribute('aria-label', direction === 'prev' ? 'Rolar para a esquerda' : 'Rolar para a direita');
  button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${CHEVRON}"/></svg>`;
  return button;
}

/** Cria as setas de uma fileira (uma vez) e as mantém em dia com a posição de rolagem. */
export function ensureRowArrows(frame: Element): void {
  const scroller = frame.querySelector<HTMLElement>('[class*="carousel-scroller__wrapper"]');
  if (!scroller) return;
  // A rolagem ocupa a largura inteira da tela, mas a faixa de conteúdo (`frame`) começa
  // mais para dentro: as setas ficam no contêiner da rolagem, para encostar nas bordas.
  const host = scroller.parentElement ?? frame;
  if (host.querySelector(':scope > .boa-row-arrow')) return;
  host.setAttribute('data-boa-arrows', '1');
  // Estado inicial presumido. Medir agora forçaria o layout de cada fileira recém-carregada;
  // a posição real é lida quando o mouse entra ou a fileira rola.
  host.setAttribute('data-boa-start', '1');
  host.setAttribute('data-boa-end', '0');

  const previous = makeArrow('prev');
  const next = makeArrow('next');
  host.append(previous, next);

  const update = () => {
    const atStart = scroller.scrollLeft <= 2;
    const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 2;
    host.setAttribute('data-boa-start', atStart ? '1' : '0');
    host.setAttribute('data-boa-end', atEnd ? '1' : '0');
  };
  let frameRequest = 0;
  scroller.addEventListener('scroll', () => {
    if (frameRequest) return;
    frameRequest = requestAnimationFrame(() => {
      frameRequest = 0;
      update();
    });
  }, { passive: true });
  // O estado também é conferido quando o mouse entra: cobre mudanças de largura e de conteúdo.
  host.addEventListener('pointerenter', update, { passive: true });

  // Rolagem animada própria (o "smooth" do navegador é seco e curto demais). A curva
  // acelera e freia suave, e qualquer gesto do usuário na fileira interrompe a animação.
  let animation = 0;
  const stop = () => {
    if (!animation) return;
    cancelAnimationFrame(animation);
    animation = 0;
    host.removeAttribute('data-boa-gliding');
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const go = (direction: number) => {
    stop();
    const from = scroller.scrollLeft;
    const max = scroller.scrollWidth - scroller.clientWidth;
    const to = Math.max(0, Math.min(max, from + direction * Math.max(240, scroller.clientWidth * 0.85)));
    if (Math.abs(to - from) < 1) return;
    const duration = Math.min(760, 420 + Math.abs(to - from) * 0.12);
    const started = performance.now();
    // Durante a animação os cards não reagem ao mouse: evita recalcular o hover a cada quadro.
    host.setAttribute('data-boa-gliding', '1');
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      scroller.scrollLeft = from + (to - from) * ease(progress);
      if (progress < 1) {
        animation = requestAnimationFrame(step);
      } else {
        animation = 0;
        host.removeAttribute('data-boa-gliding');
        update();
      }
    };
    animation = requestAnimationFrame(step);
  };
  for (const type of ['wheel', 'touchstart', 'pointerdown'] as const) {
    scroller.addEventListener(type, stop, { passive: true });
  }

  for (const [button, direction] of [[previous, -1], [next, 1]] as const) {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      go(direction);
    });
  }
}
