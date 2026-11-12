// Pantalla de carga: vive en index.html para verse antes de que cargue el JavaScript.
// Aquí solo se decide cuándo retirarla.

let leaving: Promise<void> | null = null;

/** Retira la pantalla de carga (respetando un tiempo mínimo en pantalla). Resuelve cuando empieza a irse. */
export function dismissLoader(): Promise<void> {
  if (leaving) return leaving;
  leaving = new Promise((resolve) => {
    const el = document.getElementById('loader');
    if (!el) return resolve();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let seen = false;
    try {
      seen = sessionStorage.getItem('diodi-visto') === '1';
      sessionStorage.setItem('diodi-visto', '1');
    } catch {
      /* almacenamiento no disponible: se trata como primera visita */
    }
    // La primera visita deja ver la animación completa; las siguientes, solo un instante.
    const min = reduced ? 250 : seen ? 900 : 2300;
    window.setTimeout(
      () => {
        el.classList.add('is-leaving');
        window.setTimeout(resolve, reduced ? 0 : 320);
        window.setTimeout(() => el.remove(), reduced ? 250 : 1000);
      },
      Math.max(0, min - performance.now()),
    );
  });
  return leaving;
}
