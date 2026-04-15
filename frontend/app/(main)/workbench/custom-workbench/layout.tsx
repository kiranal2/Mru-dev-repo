"use client";

/**
 * Custom Workbench Layout — Decision Intelligence
 *
 * Theme is now controlled platform-wide via the light/dark toggle.
 * This layout passes children through without forcing a specific theme.
 */
export default function CustomWorkbenchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
