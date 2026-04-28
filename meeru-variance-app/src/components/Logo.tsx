import { useTheme } from '../store';
import logoFullCoral from '../assets/meeru-logo-full-coral.svg';
import logoFullWhite from '../assets/meeru-logo-full-white.svg';
import logoDark from '../assets/meeru-logo-dark.svg';
import iconCoral from '../assets/meeru-icon-coral.svg';
import iconWhite from '../assets/meeru-icon-white.svg';

/**
 * Brand logo — picks the right asset for the active theme + variant.
 *
 *   variant="full" / "composite" — full "MeeruAI" wordmark
 *   variant="icon"               — M-only square mark
 *
 * Light theme uses the new SVG wordmark (stripes baked into vector paths
 * so they stay legible at header sizes). Dark theme uses a pre-baked PNG.
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
  // Both light + dark wordmarks now share the same SVG dimensions (210×71),
  // so they render at the same className-defined height with no transform.
  const darkScale = {};

  if (variant === 'composite') {
    if (theme === 'dark') {
      return (
        <img
          src={logoDark}
          alt={alt}
          className={`select-none ${className ?? ''}`}
          style={{ ...darkScale, ...style }}
          draggable={false}
        />
      );
    }
    // Light theme: render the full wordmark SVG directly. The M's stripes
    // are baked into vector paths so they stay legible at header sizes
    // without needing the old icon+typeset composite.
    return (
      <img
        src={fullSrc}
        alt={alt}
        className={`select-none ${className ?? ''}`}
        style={style}
        draggable={false}
      />
    );
  }
  const src = variant === 'icon' ? iconSrc : fullSrc;
  return <img src={src} alt={alt} className={className} style={style} draggable={false} />;
}
