// Aparición suave al hacer scroll. Cualquier elemento con el atributo `data-reveal`
// empieza oculto y entra cuando llega a la pantalla; `--d` (ver `delay()` en hooks.ts) lo escalona.

export function initReveal() {
  if (!('IntersectionObserver' in window)) return;
  const root = document.documentElement;
  root.classList.add('has-reveal');

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        // Atributo propio (no clase): React no lo toca al volver a pintar.
        e.target.setAttribute('data-shown', '');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
  );

  const seen = new WeakSet<Element>();
  let queued = false;
  const scan = () => {
    queued = false;
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      io.observe(el);
    });
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  };
  queue();
  // Las páginas y los filtros añaden elementos después: se recogen al aparecer en el DOM.
  const app = document.getElementById('root');
  if (app) new MutationObserver(queue).observe(app, { childList: true, subtree: true });
}
