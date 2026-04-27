import { useTheme } from '../store';
import logoFullCoral from '../assets/meeru-logo-full-coral.svg';
import logoFullWhite from '../assets/meeru-logo-full-white.svg';
import logoDarkPng from '../assets/meeru-logo-dark.png';
import iconCoral from '../assets/meeru-icon-coral.svg';
import iconWhite from '../assets/meeru-icon-white.svg';

/**
 * Brand logo — picks the right asset for the active theme + variant.
 *
 *   variant="full"      — full "MeeruAI" wordmark (flat SVG, aspect ~3:1)
 *   variant="icon"      — M-only square mark (sidebars, favicons, avatars)
 *   variant="composite" — M icon rendered big + "eeruAI" text next to it.
 *                         Use this where the M should read as a distinct
 *                         striped mark — the flat wordmark's M collapses
 *                         to a solid shape below ~48px tall because its
 *                         horizontal stripes become sub-pixel.
 *
 * Light → coral assets; dark → white.
 */
export function Logo({
  variant = 'composite',
  className,
  style,
  alt = 'MeeruAI',
}: {
  variant?: 'full' | 'icon' | 'composite';
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}) {
  const { theme } = useTheme();
  const iconSrc = theme === 'dark' ? iconWhite : iconCoral;
  const fullSrc = theme === 'dark' ? logoFullWhite : logoFullCoral;

  // Dark-theme composite uses a pre-baked PNG (coral striped M + white
  // "eeruAI" on a near-black plate) that stays crisp at any size. Light
  // theme still uses the split icon+text composite so ink can follow the
  // surface color.
  if (variant === 'composite') {
    if (theme === 'dark') {
      return (
        <img
          src={logoDarkPng}
          alt={alt}
          className={`select-none ${className ?? ''}`}
          style={style}
          draggable={false}
        />
      );
    }
    // Light theme: icon SVG + Inter-bold "eeruAI" next to it so the M's
    // striped design stays legible at header sizes.
    return (
      <span
        className={`inline-flex items-center gap-1.5 leading-none select-none ${className ?? ''}`}
        style={style}
        aria-label={alt}
      >
        <img
          src={iconSrc}
          alt=""
          className="h-full w-auto object-contain"
          draggable={false}
        />
        <span className="font-bold tracking-tight text-[0.72em] text-ink">eeruAI</span>
      </span>
    );
  }
  const src = variant === 'icon' ? iconSrc : fullSrc;
  return <img src={src} alt={alt} className={className} style={style} draggable={false} />;
}
