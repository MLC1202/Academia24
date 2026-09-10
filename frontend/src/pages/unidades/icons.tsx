type IconProps = { className?: string };

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
};

export function ArrowRight({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export function ArrowLeft({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5M11 19l-7-7 7-7" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg {...base} strokeWidth={3} className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function Plus({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MapPin({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function Clock({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function Star({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2Z" />
    </svg>
  );
}

export function ShoppingBag({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 2 4 6v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6l-2-4H6Z" />
      <path d="M4 6h16M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function HandHeart({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11 14h2a2 2 0 0 0 0-4h-3l-3 3H4v6h6l3-2h3a2 2 0 0 0 0-4" />
      <path d="M16.5 3a2.5 2.5 0 0 0-2 1 2.5 2.5 0 0 0-4.5 1.5c0 2 2.5 3.5 4.5 5 2-1.5 4.5-3 4.5-5A2.5 2.5 0 0 0 16.5 3Z" />
    </svg>
  );
}

export function Car({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 17h14M6 17V9l2-4h8l2 4v8" />
      <path d="M4 9h16" />
      <circle cx="8" cy="17" r="2" />
      <circle cx="16" cy="17" r="2" />
    </svg>
  );
}
