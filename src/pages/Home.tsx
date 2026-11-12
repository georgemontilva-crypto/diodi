import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Stage3D, { type Stage3DHandle } from '../components/Stage3D';
import LambaScroll from '../components/LambaScroll';
import ToneDemo from '../components/ToneDemo';
import Rail from '../components/Rail';
import Locations from '../components/Locations';
import ContactLink from '../components/ContactLink';
import { products } from '../data/catalog';
import { useMedia, useTitle } from '../hooks';

const HERO_SHIFT = { wide: [0.18, -0.03] as [number, number], narrow: [0, -0.13] as [number, number] };

function Hero() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<Stage3DHandle>(null);
  const [on, setOn] = useState(false);
  const [noStage, setNoStage] = useState(false);
  const narrow = useMedia('(max-width: 860px)');

  // La página abre a oscuras y la lámpara se enciende sola.
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 700);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    stage.current?.stage?.setPower(on);
    // Sin 3D (imagen de respaldo) el texto no puede esperar a la lámpara.
    if (noStage) root.current?.style.setProperty('--lit', on ? '1' : '0.4');
  }, [on, noStage]);
  useEffect(() => {
    stage.current?.stage?.setShift(narrow ? HERO_SHIFT.narrow : HERO_SHIFT.wide);
  }, [narrow]);

  return (
    <section className="hero" ref={root}>
      <Stage3D
        ref={stage}
        className="hero__stage"
        label="Lámpara de mesa Earthtone en 3D. Arrastra para girarla."
        options={{
          model: 'earthtone',
          ghost: 'DIODI',
          ghostWidth: 5.6,
          ghostY: 1.6,
          interactive: true,
          autoRotate: 0.16,
          distance: 1.1,
          shift: narrow ? HERO_SHIFT.narrow : HERO_SHIFT.wide,
          onPower: (p) => root.current?.style.setProperty('--lit', p.toFixed(3)),
        }}
        onReady={(s) => s.setPower(on)}
        onFail={() => setNoStage(true)}
        fallback={<img src="/renders/earthtone-on.webp" alt="Lámpara de mesa Earthtone encendida" />}
      />
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
        <div className="hero__aside">
          <button className="switch" type="button" role="switch" aria-checked={on} onClick={() => setOn((v) => !v)}>
            <span className="switch__track">
              <span className="switch__thumb" />
            </span>
            {on ? 'Luz encendida' : 'Luz apagada'}
          </button>
          <p className="hero__hint">Arrastra la lámpara para girarla</p>
        </div>
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
          <p className="signature">Light of things</p>
          <h2>Estilo, diseño y asesoría en iluminación.</h2>
          <div className="manifesto__cols">
            <div>
              <h3>Estilo</h3>
              <p>Piezas que se ven bien apagadas y mejor encendidas.</p>
            </div>
            <div>
              <h3>Diseño</h3>
              <p>Cada luminaria se elige por el efecto que deja en el espacio, no solo por su forma.</p>
            </div>
            <div>
              <h3>Asesoría</h3>
              <p>Te ayudamos a decidir qué luz va en cada ambiente, por dentro y por fuera.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="collection" aria-labelledby="coleccion-titulo">
        <div className="wrap collection__head">
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
          <div className="advisory__text">
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
          <div className="advisory__media">
            <img
              src="/img/asesoria-interior.webp"
              alt="Comedor a medio dibujar: el plano de líneas se convierte en el espacio iluminado"
              loading="lazy"
              width={960}
              height={1383}
            />
            <img
              src="/img/asesoria-fachada.webp"
              alt="Fachada de una casa de noche, mitad en plano y mitad iluminada"
              loading="lazy"
              width={1125}
              height={1138}
            />
          </div>
        </div>
      </section>

      <section className="visit" aria-labelledby="visita-titulo">
        <div className="wrap">
          <h2 id="visita-titulo">La luz se entiende mejor en persona.</h2>
          <Locations />
        </div>
      </section>
    </>
  );
}
