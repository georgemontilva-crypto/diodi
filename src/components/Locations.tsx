import { site } from '../config';

export default function Locations() {
  return (
    <ul className="locations">
      {site.locations.map((l) => (
        <li key={l.city}>
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
