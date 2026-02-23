import type { ColorThemeId } from 'types/settings';

import config from 'configs/app';
import type { ColorMode } from 'toolkit/chakra/color-mode';

export interface ColorTheme {
  id: ColorThemeId;
  label: string;
  colorMode: ColorMode;
  hex: string;
  sampleBg: string;
}

const getNestedValue = (obj: Record<string, unknown>, property: string) => {
  const keys = property.split('.');
  let current = obj;
  for (const key of keys) {
    const value = current[key];
    if (value === undefined) {
      return undefined;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      current = value as Record<string, unknown>;
    } else {
      return value;
    }
  }
};

/** Theme ids supported by config overrides (bg.primary._light / _dark). */
type OverrideThemeId = 'dark' | 'light';

export function getThemeHexWithOverrides(colorThemeId: ColorThemeId) {
  const defaultHex = COLOR_THEMES.find(
    (theme) => theme.id === colorThemeId,
  )?.hex;

  if (!defaultHex) {
    return;
  }

  const overrides = config.UI.colorTheme.overrides;
  const id = colorThemeId as OverrideThemeId;

  if (id === 'light') {
    const value = getNestedValue(overrides, 'bg.primary._light.value');
    return typeof value === 'string' ? value : defaultHex;
  }

  if (id === 'dark') {
    const value = getNestedValue(overrides, 'bg.primary._dark.value');
    return typeof value === 'string' ? value : defaultHex;
  }

  return defaultHex;
}

export function getDefaultColorTheme(colorMode: ColorMode) {
  const colorTheme = COLOR_THEMES.filter(
    (theme) => theme.colorMode === colorMode,
  ).slice(-1)[0];

  return colorTheme.id;
}

export const COLOR_THEMES: Array<ColorTheme> = [
  {
    id: 'dark',
    label: 'AFGCoin',
    colorMode: 'dark',
    hex: '#050608',
    sampleBg:
      'linear-gradient(160deg, #050608 0%, #121826 80%, rgba(18,24,38,0) 120%)',
  },
];
