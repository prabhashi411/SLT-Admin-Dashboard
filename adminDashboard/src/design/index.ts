export * from './colors';
export * from './spacing';
export * from './typography';
export * from './borders';
export * from './shadows';
export * from './transitions';

import { colors, darkColors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { borderRadius } from './borders';
import { shadows } from './shadows';
import { transitions, breakpoints, zIndex } from './transitions';

export function generateCssVariables(theme: 'light' | 'dark' = 'light') {
  const c = theme === 'dark' ? darkColors : colors;
  const vars: Record<string, string> = {};

  Object.entries(c.brand).forEach(([key, value]) => {
    vars[`--color-brand-${key}`] = value;
  });
  Object.entries(c.semantic).forEach(([key, value]) => {
    vars[`--color-semantic-${key}`] = value;
  });
  Object.entries(c.neutral).forEach(([key, value]) => {
    vars[`--color-neutral-${key}`] = value;
  });
  Object.entries(c.status).forEach(([key, value]) => {
    vars[`--color-status-${key}`] = value;
  });
  Object.entries(c.bg).forEach(([key, value]) => {
    vars[`--color-bg-${key}`] = value;
  });
  Object.entries(c.border).forEach(([key, value]) => {
    vars[`--color-border-${key}`] = value;
  });
  Object.entries(c.text).forEach(([key, value]) => {
    vars[`--color-text-${key}`] = value;
  });

  Object.entries(spacing).forEach(([key, value]) => {
    vars[`--spacing-${key}`] = value;
  });

  vars['--font-family-sans'] = typography.fontFamily.sans;
  vars['--font-family-mono'] = typography.fontFamily.mono;
  Object.entries(typography.fontSize).forEach(([key, value]) => {
    vars[`--font-size-${key}`] = value;
  });

  Object.entries(borderRadius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value;
  });

  Object.entries(shadows).forEach(([key, value]) => {
    vars[`--shadow-${key}`] = value;
  });

  Object.entries(transitions).forEach(([key, value]) => {
    vars[`--transition-${key}`] = value;
  });

  Object.entries(zIndex).forEach(([key, value]) => {
    vars[`--z-${key}`] = String(value);
  });

  return vars;
}

export const tokens = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  generateCssVariables,
};

export default tokens;