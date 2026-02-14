/**
 * Extract current location from pathname
 * @param pathname - Current pathname
 * @returns Current location string
 */
export const extractCurrentLocation = (pathname: string): string => {
  // Remove leading slash and return the path
  return pathname.replace(/^\//, '');
};
