import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { contactHref, isExternal } from '../config';

/** Enlace de contacto: abre WhatsApp si hay número configurado; si no, va a /contacto. */
export default function ContactLink({
  message,
  className,
  children,
}: {
  message?: string;
  className?: string;
  children: ReactNode;
}) {
  const href = contactHref(message);
  if (isExternal(href)) {
    return (
      <a className={className} href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={href}>
      {children}
    </Link>
  );
}
