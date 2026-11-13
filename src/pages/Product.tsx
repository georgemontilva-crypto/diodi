import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Stage3D, { type Stage3DHandle } from '../components/Stage3D';
import ContactLink from '../components/ContactLink';
import Rail from '../components/Rail';
import NotFound from './NotFound';
import { bySlug, categoryOf, products, type Product as ProductData } from '../data/catalog';
import { delay, useTitle } from '../hooks';

export default function Product() {
  const { slug = '' } = useParams();
  const product = bySlug(slug);
  if (!product) return <NotFound />;
  return <ProductView key={product.slug} product={product} />;
}

function ProductView({ product }: { product: ProductData }) {
  useTitle(`${product.name} — DIODI LED`);
  const category = categoryOf(product);
  const ref = useRef<Stage3DHandle>(null);
  const [on, setOn] = useState(false);
  const [finish, setFinish] = useState(product.finishes[0].id);
  const [tone, setTone] = useState(product.tones[0].id);
  const [tilt, setTilt] = useState(0);
  const [pan, setPan] = useState(0);
  const [explode, setExplode] = useState(0);
  const [variant, setVariant] = useState(product.variants?.initial ?? product.variants?.options[0].id);
  const tiltMax = product.tiltMax ?? 90;
  const toneColor = product.tones.find((t) => t.id === tone)?.color ?? product.tones[0].color;
  const stage = () => ref.current?.stage;

  // Entra apagada y se enciende sola.
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 500);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    stage()?.setPower(on);
  }, [on]);

  const hasTones = product.tones.length > 1;
  const hasFinishes = product.finishes.length > 1;
  const hasTilt = product.controls.includes('tilt');
  const hasPan = product.controls.includes('pan');
  const hasExplode = product.controls.includes('explode');
  const others = products.filter((p) => p.slug !== product.slug);

  return (
    <article className="product">
      <section className="viewer" aria-label={`${product.name} en 3D`}>
        <Stage3D
          // Cambiar de versión reconstruye el modelo.
          key={variant ?? 'base'}
          ref={ref}
          className="viewer__stage"
          label={`Modelo 3D de ${product.name}. Arrastra para girar; usa las flechas del teclado.`}
          options={{
            model: product.model,
            variant,
            ghost: product.ghost,
            finish,
            tone: toneColor,
            interactive: true,
            autoRotate: hasTilt || hasPan ? 0 : 0.14,
            shift: [0, -0.04],
          }}
          onReady={(s) => {
            s.setPower(on);
            s.setFinish(finish);
            s.setTone(toneColor);
            s.setTilt(tilt / tiltMax);
            s.setPan(pan / 360);
            s.setExplode(explode / 100);
          }}
          fallback={<img src={`/renders/${product.slug}-on.webp`} alt={`${product.name} encendida`} />}
        />

        <header className="viewer__head wrap">
          <nav aria-label="Ruta">
            <Link to="/catalogo">Catálogo</Link>
            <span aria-hidden="true">/</span>
            <Link to={`/catalogo?categoria=${category.id}`}>{category.label}</Link>
          </nav>
          <h1>{product.name}</h1>
          <p>{product.summary}</p>
        </header>

        <div className="viewer__zoom">
          <button type="button" onClick={() => stage()?.zoomBy(0.34)} aria-label="Acercar">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button type="button" onClick={() => stage()?.zoomBy(-0.34)} aria-label="Alejar">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M5 12h14" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>

        <div className="viewer__bottom">
          <p className="viewer__hint">{product.hint}</p>
          <div className="dock" role="group" aria-label="Controles de la luminaria">
            <div className="dock__item">
              <button className="switch" type="button" role="switch" aria-checked={on} onClick={() => setOn((v) => !v)}>
                <span className="switch__track">
                  <span className="switch__thumb" />
                </span>
                {on ? 'Encendida' : 'Apagada'}
              </button>
            </div>

            {product.variants && (
              <div className="dock__item">
                <span className="dock__label" id="lbl-version">
                  {product.variants.label}
                </span>
                <div className="segmented" role="radiogroup" aria-labelledby="lbl-version">
                  {product.variants.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={variant === o.id}
                      onClick={() => setVariant(o.id)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasTones && (
              <div className="dock__item">
                <span className="dock__label" id="lbl-tono">
                  Tono
                </span>
                <div className="segmented" role="radiogroup" aria-labelledby="lbl-tono">
                  {product.tones.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={tone === t.id}
                      onClick={() => {
                        setTone(t.id);
                        setOn(true);
                        stage()?.setTone(t.color);
                      }}
                    >
                      <i style={{ background: t.color }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasFinishes && (
              <div className="dock__item">
                <span className="dock__label" id="lbl-acabado">
                  {product.finishLabel ?? 'Acabado'}
                </span>
                <div className="swatches" role="radiogroup" aria-labelledby="lbl-acabado">
                  {product.finishes.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={finish === f.id}
                      aria-label={f.label}
                      title={f.label}
                      onClick={() => {
                        setFinish(f.id);
                        stage()?.setFinish(f.id);
                      }}
                    >
                      <i style={{ background: f.swatch }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasTilt && (
              <label className="dock__item dock__item--range">
                <span className="dock__label">Inclinación</span>
                <input
                  type="range"
                  min={0}
                  max={tiltMax}
                  step={1}
                  value={tilt}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTilt(v);
                    stage()?.setTilt(v / tiltMax);
                  }}
                />
                <output>{tilt}°</output>
              </label>
            )}

            {hasPan && (
              <label className="dock__item dock__item--range">
                <span className="dock__label">Giro</span>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={pan}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPan(v);
                    stage()?.setPan(v / 360);
                  }}
                />
                <output>{pan}°</output>
              </label>
            )}

            {hasExplode && (
              <label className="dock__item dock__item--range">
                <span className="dock__label">Despiece</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={explode}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setExplode(v);
                    stage()?.setExplode(v / 100);
                  }}
                />
                <output>{explode}%</output>
              </label>
            )}
          </div>
        </div>
      </section>

      <section className="detail">
        <div className="wrap detail__grid">
          <div className="detail__text" data-reveal>
            <h2>{product.summary}</h2>
            <p>{product.description}</p>
            <ContactLink className="btn btn--umber" message={`Hola DIODI, quiero información sobre ${product.name}.`}>
              Consultar por {product.name}
            </ContactLink>
          </div>
          <dl className="specs">
            {product.specs.map(([k, v], i) => (
              <div key={k} data-reveal style={delay(80 + i * 55)}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {product.photos.length > 0 && (
        <section className="gallery" aria-label={`Fotos de ${product.name}`}>
          <div className={`wrap gallery__grid gallery__grid--${Math.min(3, product.photos.length)}`}>
            {product.photos.map((ph, i) => (
              <img key={ph.src} src={ph.src} alt={ph.alt} loading="lazy" data-reveal style={delay(i * 130)} />
            ))}
          </div>
        </section>
      )}

      <section className="collection collection--more" aria-labelledby="mas-titulo">
        <div className="wrap collection__head" data-reveal>
          <h2 id="mas-titulo">Sigue encendiendo.</h2>
          <Link className="link" to="/catalogo">
            Ver todo el catálogo
          </Link>
        </div>
        <Rail items={others} label="Otros productos" />
      </section>
    </article>
  );
}
