import { Image } from 'react-native';
import type { StyleProp, ImageStyle } from 'react-native';
import { useTheme } from '../theme';

const logoLight = require('../../assets/meeru-logo.png');
const logoDark = require('../../assets/meeru-logo-dark.png');

/**
 * Brand logo — swaps PNG by active theme.
 *   light → coral wordmark on white  (`meeru-logo.png`)
 *   dark  → coral-M + white "eeruAI" on near-black (`meeru-logo-dark.png`)
 * Caller passes `height`; width auto-derives to preserve the ~5.2:1 aspect.
 */
export function Logo({
  height = 24,
  style,
}: {
  height?: number;
  style?: StyleProp<ImageStyle>;
}) {
  const { theme } = useTheme();
  const source = theme === 'dark' ? logoDark : logoLight;
  return (
    <Image
      source={source}
      style={[{ width: height * 5.2, height, resizeMode: 'contain' }, style]}
    />
  );
}
