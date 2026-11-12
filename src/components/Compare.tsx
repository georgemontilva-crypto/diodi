import { useState } from 'react';
import SplitHandle from './SplitHandle';

interface Props {
  /** Nombre base en /renders: `<name>-luz.webp` y `<name>-plano.webp`. */
  name: string;
  alt: string;
  className?: string;
  initial?: number;
  eager?: boolean;
}

/** Comparador de dos renders de la misma escena: plano de líneas a la izquierda, espacio iluminado a la derecha. */
export default function Compare({ name, alt, className, initial = 0.5, eager }: Props) {
  const [value, setValue] = useState(initial);
  return (
    <div className={`compare ${className ?? ''}`}>
      <img src={`/renders/${name}-luz.webp`} alt={alt} loading={eager ? 'eager' : 'lazy'} width={1600} height={1000} />
      <img
        src={`/renders/${name}-plano.webp`}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        width={1600}
        height={1000}
        style={{ clipPath: `inset(0 ${(1 - value) * 100}% 0 0)` }}
      />
      <SplitHandle value={value} onChange={setValue} />
    </div>
  );
}
