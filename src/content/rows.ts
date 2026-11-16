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

  const go = (direction: number) => scroller.scrollBy({
    left: direction * Math.max(240, scroller.clientWidth * 0.85),
    behavior: 'smooth'
  });
  for (const [button, direction] of [[previous, -1], [next, 1]] as const) {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      go(direction);
    });
  }
  requestAnimationFrame(update);
}
