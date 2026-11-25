import { Platform } from 'react-native';
import registry from '../../../source/design-tokens.json';

function color(name: keyof typeof registry): string {
  const token = registry[name] as { $value: { components: number[] } };
  return `#${token.$value.components.map(value => Math.round(value * 255).toString(16).padStart(2, '0')).join('')}`;
}

// The website's token registry remains the only palette source.
export const colors = {
  paper: color('paper'), surface: color('surface'), soft: color('surface-soft'),
  ink: color('ink'), muted: color('muted'), line: color('line'),
  border: color('control-border'), accent: color('accent'), accentSoft: color('accent-soft'),
  onAccent: color('on-accent'), warning: color('warning'), warningSoft: color('warning-soft'),
};

// Native chrome uses accessible platform fonts. The reused reader loads the site's
// exact self-hosted Noto Serif and Be Vietnam Pro, including Vietnamese/Pāli marks.
export const fonts = { serif: Platform.select({ ios: 'Georgia', default: 'serif' }) };
