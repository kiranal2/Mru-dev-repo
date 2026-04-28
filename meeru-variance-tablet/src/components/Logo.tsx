import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import LogoLightSvg from '../../assets/meeru-logo-full-coral.svg';
import LogoDarkSvg from '../../assets/meeru-logo-dark.svg';

/**
 * Brand logo.
 *   light → SVG wordmark (coral M + dark "eeruAI")
 *   dark  → SVG wordmark (coral M + white "eeruAI")
 * Caller passes `height`; width auto-derives to preserve aspect (~3:1).
 */
const RATIO = 210 / 71; // ~2.958

export function Logo({
  height = 24,
  style,
}: {
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  const h = height;
  const Svg = theme === 'dark' ? LogoDarkSvg : LogoLightSvg;
  return (
    <View style={style}>
      <Svg width={h * RATIO} height={h} />
    </View>
  );
}
