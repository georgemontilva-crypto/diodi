// Transiciones entre páginas: la foto que se toca viaja hasta su sitio en la página nueva.
//
// La página de destino marca el elemento que recibe la foto con data-vt="<nombre>";
// el enlace de origen marca la suya con data-vt-src (ver TLink).

let rendered: (() => void) | null = null;

/** La app avisa aquí cuando la ruta nueva ya está en pantalla. */
export function routeRendered() {
  rendered?.();
  rendered = null;
}

export function go(navigate: () => void, source: HTMLElement | null, name: string) {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return navigate();

  // Un nombre solo puede estar en un elemento a la vez: si la página actual ya lo usa
  // (de una ficha a otra ficha), se le quita mientras dura la foto de salida.
  const taken = [...document.querySelectorAll<HTMLElement>(`[data-vt="${name}"]`)];
  taken.forEach((e) => (e.style.viewTransitionName = 'none'));
  if (source) source.style.viewTransitionName = name;
  const restore = () => {
    taken.forEach((e) => (e.style.viewTransitionName = ''));
    if (source) source.style.viewTransitionName = '';
  };

  try {
    document.startViewTransition(
      () =>
        new Promise<void>((resolve) => {
          const done = () => {
            restore();
            resolve();
          };
          rendered = done;
          navigate();
          // Si la ruta no llega a cambiar, la transición no se queda esperando.
          window.setTimeout(done, 700);
        }),
    );
  } catch {
    restore();
    navigate();
  }
}
