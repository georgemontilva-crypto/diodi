import { Link, useNavigate, type LinkProps } from 'react-router-dom';
import { go } from '../transition';

/**
 * Enlace con transición: el elemento marcado con data-vt-src dentro del enlace
 * viaja hasta el que lleva data-vt="<vt>" en la página de destino.
 */
export default function TLink({ vt, to, onClick, children, ...rest }: LinkProps & { vt: string }) {
  const navigate = useNavigate();
  return (
    <Link
      to={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        // Clic con tecla o botón central: abre en otra pestaña, como cualquier enlace.
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(() => navigate(to), e.currentTarget.querySelector<HTMLElement>('[data-vt-src]'), vt);
      }}
    >
      {children}
    </Link>
  );
}
