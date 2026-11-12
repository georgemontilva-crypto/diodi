import { useEffect, useState, type RefObject } from 'react';

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/**
 * La primera vez que el contenedor entra en pantalla, enciende sus tarjetas una tras otra
 * y las vuelve a apagar: enseña que cada pieza responde al cursor.
 */
export function useLightWave(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(hover: none)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        el.querySelectorAll('.card').forEach((card, i) => {
          timers.push(window.setTimeout(() => card.classList.add('is-lit'), 250 + i * 170));
          timers.push(window.setTimeout(() => card.classList.remove('is-lit'), 1900 + i * 170));
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [ref]);
}
