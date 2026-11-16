/**
 * Roda no MUNDO DA PÁGINA (world: MAIN), antes do código do site.
 *
 * Perfil real da home da Crunchyroll rolando 12 s: 4,5 s dos 8,4 s de JavaScript do site vinham de
 * um único handler de `scroll` do `window`, chamado a cada evento de rolagem (dezenas por segundo).
 * Aqui os handlers de rolagem do window/document registrados pelo SITE passam a rodar no máximo a
 * cada 100 ms, e a última chamada sempre acontece (o estado final fica correto). Handlers da
 * própria extensão e rolagem de elementos (carrosséis) não são tocados.
 *
 * Chave de diagnóstico: localStorage.boanimes_debug com `off` ou `noscroll` desliga isto.
 */
(() => {
  let debug: string[] = [];
  try {
    debug = (window.localStorage.getItem('boanimes_debug') || '').split(',').map(item => item.trim());
  } catch {
    // localStorage bloqueado: segue com os padrões.
  }
  if (debug.includes('off') || debug.includes('noscroll')) return;

  const INTERVAL_MS = 100;
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  // listener original -> versão limitada (por alvo e opção de captura, para o remove casar).
  const wrapped = new WeakMap<object, WeakMap<EventTarget, EventListener>>();
  const stats = { wrapped: 0, calls: 0, skipped: 0 };
  (window as unknown as { __boaScroll: typeof stats }).__boaScroll = stats;

  const isPageScroller = (target: EventTarget): boolean =>
    target === window || target === document || target === document.documentElement || target === document.body;

  function throttle(listener: EventListener): EventListener {
    let last = 0;
    let timer = 0;
    let pending: Event | null = null;
    let context: unknown = null;
    return function (this: unknown, event: Event) {
      const now = performance.now();
      if (now - last >= INTERVAL_MS) {
        last = now;
        stats.calls += 1;
        listener.call(this, event);
        return;
      }
      stats.skipped += 1;
      pending = event;
      context = this;
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        last = performance.now();
        if (pending) listener.call(context, pending);
        pending = null;
      }, INTERVAL_MS - (now - last));
    };
  }

  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void {
    if (type === 'scroll' && typeof listener === 'function' && isPageScroller(this)) {
      let perTarget = wrapped.get(listener);
      if (!perTarget) {
        perTarget = new WeakMap();
        wrapped.set(listener, perTarget);
      }
      let slow = perTarget.get(this);
      if (!slow) {
        slow = throttle(listener);
        perTarget.set(this, slow);
        stats.wrapped += 1;
      }
      return originalAdd.call(this, type, slow, options);
    }
    return originalAdd.call(this, type, listener, options);
  };

  EventTarget.prototype.removeEventListener = function (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void {
    if (type === 'scroll' && typeof listener === 'function') {
      const slow = wrapped.get(listener)?.get(this);
      if (slow) return originalRemove.call(this, type, slow, options);
    }
    return originalRemove.call(this, type, listener, options);
  };
})();
