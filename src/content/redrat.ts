/**
 * "RedRat Edition": troca o laranja da própria Crunchyroll pelo vermelho da RedRat.
 *
 * O CSS do site tem o laranja escrito direto em dezenas de regras (botões, logo, barras de
 * progresso, abas, estrelas…). Em vez de depender dos nomes de classe do site, que mudam a
 * cada versão, a extensão lê as folhas de estilo, copia só as regras que têm laranja e
 * injeta cópias com a cor trocada. Segue o interruptor do tema (classe boa-theme-off).
 */

// Os valores finais vêm das variáveis de cor (src/shared/accent.ts); os números são o
// padrão caso a variável ainda não exista.
const ACC = 'var(--boa-acc, #f02043)';
const ACC_RGB = 'var(--boa-acc-rgb, 240, 32, 67)';
const LIGHT = 'var(--boa-acc-2, #ff5c78)';
const DARK = 'var(--boa-acc-dark, #8a1228)';

const HAS_ORANGE = /#ff640a|#f47521|rgba?\(\s*255,\s*100,\s*10|rgba?\(\s*244,\s*117,\s*33/i;

function recolor(css: string): string {
  return css
    // #ff640ab3 (com transparência) vira rgba da cor de destaque.
    .replace(/#ff640a([0-9a-f]{2})/gi, (_m, alpha: string) => `rgba(${ACC_RGB}, ${(parseInt(alpha, 16) / 255).toFixed(2)})`)
    .replace(/#ff640a|#f47521/gi, ACC)
    .replace(/rgba\(\s*(?:255,\s*100,\s*10|244,\s*117,\s*33)\s*,/gi, `rgba(${ACC_RGB},`)
    .replace(/rgb\(\s*(?:255,\s*100,\s*10|244,\s*117,\s*33)\s*\)/gi, `rgb(${ACC_RGB})`)
    // O degradê laranja→amarelo do hero e das promoções acompanha a cor de destaque.
    .replace(/#fab818|rgb\(\s*250,\s*184,\s*24\s*\)|rgb\(\s*255,\s*201,\s*77\s*\)/gi, LIGHT)
    .replace(/#c13937|rgb\(\s*167,\s*31,\s*6\s*\)/gi, DARK);
}

const done = new WeakSet<CSSStyleSheet>();
let style: HTMLStyleElement | undefined;
let enabled = true;

function ensureStyle(): HTMLStyleElement {
  if (!style) {
    style = document.createElement('style');
    style.id = 'boa-redrat';
    style.disabled = !enabled;
    document.documentElement.appendChild(style);
  }
  return style;
}

function convert(sheet: CSSStyleSheet): void {
  if (done.has(sheet) || sheet.ownerNode === style) return;
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return; // folha de outro domínio sem permissão de leitura
  }
  done.add(sheet);
  let out = '';
  for (const rule of Array.from(rules)) {
    const text = rule.cssText;
    if (HAS_ORANGE.test(text)) out += recolor(text) + '\n';
  }
  if (out) ensureStyle().appendChild(document.createTextNode(out));
}

function scan(): void {
  for (const sheet of Array.from(document.styleSheets)) convert(sheet);
}

function watchNode(node: Node): void {
  if (!(node instanceof HTMLLinkElement || node instanceof HTMLStyleElement)) return;
  if (node === style) return;
  if (node instanceof HTMLLinkElement && !/stylesheet/i.test(node.rel)) return;
  if (node.sheet) convert(node.sheet);
  else node.addEventListener('load', () => node.sheet && convert(node.sheet), { once: true });
}

let started = false;

/** Liga/desliga a troca de cor (acompanha o interruptor do tema). */
export function setRedRat(on: boolean): void {
  enabled = on;
  if (style) style.disabled = !on;
  if (!started) start();
}

function start(): void {
  started = true;
  scan();
  new MutationObserver(records => {
    for (const record of records) record.addedNodes.forEach(watchNode);
  }).observe(document, { childList: true, subtree: true });
  // Garantia: folhas que carregaram sem passar pelo observador.
  document.addEventListener('DOMContentLoaded', scan, { once: true });
  window.addEventListener('load', scan, { once: true });
}
