import Locations from '../components/Locations';
import { site } from '../config';
import { useTitle } from '../hooks';

export default function Contact() {
  useTitle('Ubicaciones y contacto — DIODI LED');
  return (
    <div className="contact">
      <div className="wrap">
        <h1>Hablemos de tu espacio.</h1>
        <p className="contact__lead">
          Ven con un plano, unas fotos o solo la idea. Te ayudamos a elegir la luz para cada ambiente, por dentro y por fuera.
        </p>
        {(site.whatsapp || site.instagram) && (
          <div className="contact__actions">
            {site.whatsapp && (
              <a
                className="btn btn--umber"
                href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent('Hola DIODI, quiero asesoría de iluminación.')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Escribir por WhatsApp
              </a>
            )}
            {site.instagram && (
              <a
                className="btn btn--outline-umber"
                href={`https://instagram.com/${site.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Ver Instagram
              </a>
            )}
          </div>
        )}
        <h2>Dónde estamos</h2>
        <Locations />
      </div>
    </div>
  );
}
