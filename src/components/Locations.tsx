import { site } from '../config';
import { delay } from '../hooks';

export default function Locations() {
  return (
    <ul className="locations">
      {site.locations.map((l, i) => (
        <li key={l.city} data-reveal style={delay(i * 130)}>
          <h3>{l.city}</h3>
          <p>{l.address}</p>
          <a className="link" href={l.mapUrl} target="_blank" rel="noopener noreferrer">
            Cómo llegar
          </a>
        </li>
      ))}
    </ul>
  );
}
