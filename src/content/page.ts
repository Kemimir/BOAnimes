/**
 * Roda no MUNDO DA PÁGINA (world: MAIN), antes do código do site.
 *
 * Perfil real da home: o site faz uma requisição XHR `discover/up_next/<série>` por card e cada
 * resposta dispara um handler que custa ~500 ms de JavaScript. Em rajadas elas se acumulam e
 * travam a rolagem. Aqui o handler de término dessas respostas (e só dessas) é executado uma de
 * cada vez, entre quadros, em vez de todos juntos. O dado não muda, só o momento em que o site
 * o processa (atraso de ~100 ms por resposta na fila).
 *
 * Chave de diagnóstico: localStorage.boanimes_debug com `off` ou `nodefer` desliga isto.
 */
(() => {
  let debug: string[] = [];
  try {
    debug = (window.localStorage.getItem('boanimes_debug') || '').split(',').map(item => item.trim());
  } catch {
    // localStorage bloqueado: segue com os padrões.
  }
  if (debug.includes('off') || debug.includes('nodefer')) return;

  const GAP_MS = 100;
  const TARGET = /\/discover\/up_next\//;
  const stats = { deferred: 0, maxQueue: 0 };
  (window as unknown as { __boaDefer: typeof stats }).__boaDefer = stats;

  const queue: Array<() => void> = [];
  let running = false;

  function pump(): void {
    const job = queue.shift();
    if (!job) {
      running = false;
      return;
    }
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        try {
          job();
        } finally {
          pump();
        }
      });
    }, GAP_MS);
  }

  function enqueue(job: () => void): void {
    if (document.documentElement.dataset.boaNoDefer === '1') {
      job();
      return;
    }
    stats.deferred += 1;
    queue.push(job);
    stats.maxQueue = Math.max(stats.maxQueue, queue.length);
    if (!running) {
      running = true;
      pump();
    }
  }

  const isTarget = new WeakSet<XMLHttpRequest>();
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]): void {
    if (TARGET.test(String(url))) isTarget.add(this);
    return (originalOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
  } as typeof XMLHttpRequest.prototype.open;

  /** Versão do handler que, para as requisições alvo, só roda na sua vez da fila. */
  function slow(xhr: XMLHttpRequest, type: string, handler: (this: XMLHttpRequest, event: Event) => unknown): (event: Event) => void {
    return function (this: XMLHttpRequest, event: Event) {
      const final = type === 'readystatechange' ? xhr.readyState === 4 : true;
      if (!final || !isTarget.has(xhr)) {
        handler.call(this, event);
        return;
      }
      enqueue(() => handler.call(this, event));
    };
  }

  const DEFERRED_TYPES = ['load', 'loadend', 'readystatechange'];
  const wrappedListeners = new WeakMap<object, WeakMap<XMLHttpRequest, EventListener>>();

  const originalAdd = XMLHttpRequest.prototype.addEventListener;
  XMLHttpRequest.prototype.addEventListener = function (this: XMLHttpRequest, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
    if (DEFERRED_TYPES.includes(type) && typeof listener === 'function') {
      const replacement = slow(this, type, listener) as EventListener;
      let perXhr = wrappedListeners.get(listener);
      if (!perXhr) {
        perXhr = new WeakMap();
        wrappedListeners.set(listener, perXhr);
      }
      perXhr.set(this, replacement);
      return originalAdd.call(this, type, replacement, options);
    }
    return originalAdd.call(this, type, listener, options);
  };

  const originalRemove = XMLHttpRequest.prototype.removeEventListener;
  XMLHttpRequest.prototype.removeEventListener = function (this: XMLHttpRequest, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void {
    const replacement = listener && typeof listener === 'function' ? wrappedListeners.get(listener)?.get(this) : undefined;
    return originalRemove.call(this, type, replacement || listener, options);
  };

  // Handlers atribuídos por propriedade (onload, onloadend, onreadystatechange).
  for (const type of DEFERRED_TYPES) {
    const name = `on${type}`;
    let owner: object | null = XMLHttpRequest.prototype;
    let descriptor: PropertyDescriptor | undefined;
    while (owner && !(descriptor = Object.getOwnPropertyDescriptor(owner, name))) owner = Object.getPrototypeOf(owner);
    if (!owner || !descriptor?.set || !descriptor.get) continue;
    const { get, set } = descriptor;
    Object.defineProperty(owner, name, {
      configurable: true,
      enumerable: descriptor.enumerable,
      get(this: XMLHttpRequest) {
        return get.call(this);
      },
      set(this: XMLHttpRequest, value: unknown) {
        set.call(this, typeof value === 'function' ? slow(this, type, value as (this: XMLHttpRequest, event: Event) => unknown) : value);
      }
    });
  }
})();
