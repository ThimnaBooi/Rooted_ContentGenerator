import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { box: 'h-7 w-7', text: 'text-lg' },
  md: { box: 'h-9 w-9', text: 'text-xl' },
  lg: { box: 'h-12 w-12', text: 'text-2xl' },
};

export function Logo({ className, showWordmark = true, size = 'md' }: LogoProps) {
  const s = sizeMap[size];
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative grid place-items-center rounded-xl bg-primary/10 text-primary',
          s.box
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[62%] w-[62%]"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* trunk */}
          <path d="M12 22V11" />
          {/* roots */}
          <path d="M12 22c-2 0-3.5-1-3.5-2.5" />
          <path d="M12 22c2 0 3.5-1 3.5-2.5" />
          {/* canopy */}
          <path d="M12 11c-3 0-5-2-5-4.5S9 2 12 2s5 2 5 4.5S15 11 12 11Z" />
          <path d="M12 11c0-2 1-3.5 2.5-4.5" />
          <path d="M12 11c0-2-1-3.5-2.5-4.5" />
        </svg>
      </span>
      {showWordmark && (
        <span className={cn('font-serif font-semibold tracking-tight', s.text)}>
          Rooted
        </span>
      )}
    </span>
  );
}
