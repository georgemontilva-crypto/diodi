import Locations from '../components/Locations';
import { delay, useTitle } from '../hooks';

/** Nuestras tiendas: dirección, horario, WhatsApp y mapa de cada una. */
export default function Contact() {
  useTitle('Nuestras tiendas — DIODI LED');
  return (
    <div className="contact">
      <div className="wrap">
        <h1 data-reveal>Nuestras tiendas.</h1>
        <p className="contact__lead" data-reveal style={delay(100)}>
          Ven a ver la luz en persona. Te asesoramos para elegir la iluminación de tu espacio o de tu proyecto: trae un plano,
          unas fotos o solo la idea.
        </p>
        <Locations />
      </div>
    </div>
  );
}
