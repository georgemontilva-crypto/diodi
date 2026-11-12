/** Isotipo de DIODI: triángulo con triángulos anidados. Hereda el color del texto. */
export default function Logo({ size = 28, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 100 90"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="miter"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M50 5 96 85H4Z" strokeWidth="5.5" />
      <path d="M50 27 79.5 77h-59Z" strokeWidth="2.6" />
      <path
        d="M20.5 77 50 39l29.5 38M20.5 77 50 50l29.5 27M20.5 77 50 59l29.5 18M20.5 77 50 66l29.5 11M20.5 77 50 71.5 79.5 77"
        strokeWidth="1.1"
      />
    </svg>
  );
}
