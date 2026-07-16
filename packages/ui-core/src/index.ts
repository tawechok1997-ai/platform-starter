export const uiClasses = {
  button: {
    base: 'ui-button',
    primary: 'ui-button ui-button--primary',
    secondary: 'ui-button ui-button--secondary',
    danger: 'ui-button ui-button--danger',
  },
  surface: {
    base: 'ui-surface',
    elevated: 'ui-surface ui-surface--elevated',
  },
  visuallyHidden: 'ui-visually-hidden',
} as const;

export type ButtonTone = keyof typeof uiClasses.button;
export type SurfaceTone = keyof typeof uiClasses.surface;
