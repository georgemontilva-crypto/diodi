import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Plan3D, { type Plan3DHandle } from '../components/Plan3D';
import SplitHandle from '../components/SplitHandle';
import Compare from '../components/Compare';
import { dismissLoader } from '../loader';
import LambaScroll from '../components/LambaScroll';
import ToneDemo from '../components/ToneDemo';
import Rail from '../components/Rail';
import Locations from '../components/Locations';
import ContactLink from '../components/ContactLink';
import { products } from '../data/catalog';
import { delay, useMedia, useTitle } from '../hooks';

/** Posición final del divisor tras la entrada: queda justo a la derecha del titular. */
const REST = { wide: 0.43, narrow: 0.3 };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Hero() {
  const stage = useRef<Plan3DHandle>(null);
  const narrow = useMedia('(max-width: 860px)');
  const [split, setSplit] = useState(1);
  const [fallback, setFallback] = useState(false);
  const tween = useRef(0);

  useEffect(() => {
    stage.current?.stage?.setSplit(split, true);
  }, [split]);

  // Entrada: todo empieza como plano y la luz avanza de derecha a izquierda.
  const enter = () => {
    const to = narrow ? REST.narrow : REST.wide;
    stage.current?.stage?.setPower(true);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSplit(to);
      return;
    }
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 2600);
      setSplit(1 + (to - 1) * ease(t));
      if (t < 1) tween.current = requestAnimationFrame(tick);
    };
    tween.current = requestAnimationFrame(tick);
  };
  const grab = () => cancelAnimationFrame(tween.current);

  useEffect(() => {
    // Si la escena tarda demasiado, no se retiene la página.
    const safety = window.setTimeout(() => dismissLoader(), 8000);
    return () => {
      window.clearTimeout(safety);
      cancelAnimationFrame(tween.current);
    };
  }, []);

  return (
    <section className="hero">
      {fallback ? (
        <Compare
          className="hero__compare"
          name="escena-interior"
          alt="Sala comedor iluminada con luminarias DIODI"
          initial={REST.wide}
          eager
        />
      ) : (
        <>
          <Plan3D
            ref={stage}
            className="hero__stage"
            label="Sala comedor en 3D: a la izquierda el plano de líneas, a la derecha el espacio iluminado con luminarias DIODI"
            options={{ scene: 'interior', split: 1, power: 0, parallax: true }}
            onReady={() => dismissLoader().then(enter)}
            onFail={() => {
              setFallback(true);
              dismissLoader();
            }}
          />
          <SplitHandle value={split} onChange={setSplit} onGrab={grab} />
        </>
      )}
      <div className="hero__overlay wrap">
        <div className="hero__copy">
          <h1>
            La luz también
            <br />
            se diseña.
          </h1>
          <p>Luminarias para interiores y exteriores, y asesoría para elegir cada una. Estamos en Valencia y Caracas.</p>
          <div className="hero__actions">
            <Link className="btn btn--sand" to="/catalogo">
              Ver catálogo
            </Link>
            <ContactLink className="btn btn--outline" message="Hola DIODI, quiero asesoría de iluminación.">
              Pedir asesoría
            </ContactLink>
          </div>
        </div>
        <p className="hero__hint">Arrastra la línea para pasar del plano a la luz</p>
      </div>
    </section>
  );
}

export default function Home() {
  useTitle('DIODI LED — Light of things');
  return (
    <>
      <Hero />

      <section className="manifesto">
        <div className="wrap">
          <p className="signature" data-reveal>
            Light of things
          </p>
          <h2 data-reveal style={delay(90)}>
            Estilo, diseño y asesoría en iluminación.
          </h2>
          <div className="manifesto__cols">
            <div data-reveal>
              <h3>Estilo</h3>
              <p>Piezas que se ven bien apagadas y mejor encendidas.</p>
            </div>
            <div data-reveal style={delay(120)}>
              <h3>Diseño</h3>
              <p>Cada luminaria se elige por el efecto que deja en el espacio, no solo por su forma.</p>
            </div>
            <div data-reveal style={delay(240)}>
              <h3>Asesoría</h3>
              <p>Te ayudamos a decidir qué luz va en cada ambiente, por dentro y por fuera.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="collection" aria-labelledby="coleccion-titulo">
        <div className="wrap collection__head" data-reveal>
          <h2 id="coleccion-titulo">Enciende cada pieza.</h2>
          <Link className="link" to="/catalogo">
            Ver todo el catálogo
          </Link>
        </div>
        <Rail items={products} label="Productos destacados" />
      </section>

      <LambaScroll />

      <ToneDemo />

      <section className="advisory" id="asesoria" aria-labelledby="asesoria-titulo">
        <div className="wrap advisory__grid">
          <div className="advisory__text" data-reveal>
            <h2 id="asesoria-titulo">Del plano a la luz encendida.</h2>
            <p>
              Cuéntanos cómo es el espacio. Te proponemos qué luminaria poner, dónde y con qué tono, para que la luz acompañe la
              arquitectura en vez de solo alumbrarla.
            </p>
            <ul className="advisory__list">
              <li>Interiores: salas, cocinas, comedores, locales.</li>
              <li>Exteriores: fachadas, terrazas, jardines.</li>
            </ul>
            <ContactLink className="btn btn--umber" message="Hola DIODI, quiero asesoría de iluminación para mi espacio.">
              Pedir asesoría
            </ContactLink>
          </div>
          <figure className="advisory__media" data-reveal style={delay(160)}>
            <Compare
              name="escena-fachada"
              alt="Fachada de una casa de noche iluminada con apliques, bañadores y tiras LED en los escalones"
              initial={0.42}
            />
            <figcaption>Arrastra la línea: la misma fachada, en plano y con la luz encendida.</figcaption>
          </figure>
        </div>
      </section>

      <section className="visit" aria-labelledby="visita-titulo">
        <div className="wrap">
          <h2 id="visita-titulo" data-reveal>
            La luz se entiende mejor en persona.
          </h2>
          <Locations />
        </div>
      </section>
    </>
  );
}
