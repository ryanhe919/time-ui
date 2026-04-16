import type {} from '@emotion/react';
import type {
  Tokens,
  Palette,
  Typography,
  Spacing,
  Radius,
  ComponentRadius,
  Shadows,
  ZIndex,
  Breakpoints,
  Motion,
  Borders,
  Components,
} from '@timeui/tokens';

/** Light or dark color scheme. */
export type ThemeMode = 'light' | 'dark';

/** A state-triple used across interactive surfaces (buttons, links, …). */
export interface InteractiveColor {
  /** Default resting color. */
  default: string;
  /** Hover/focus-visible color. */
  hover: string;
  /** Active/pressed color. */
  active: string;
  /** Disabled color. */
  disabled: string;
}

/**
 * Semantic color tokens — the surface components consume.
 *
 * Each group maps primitives onto a *role*:
 * - `bg` — surface backgrounds
 * - `text` — type colors
 * - `border` — strokes / dividers
 * - `action` — interactive color families (primary, secondary, danger, …)
 * - `status` — feedback (success / warning / danger / info)
 */
/**
 * HeroUI-style semantic color scale.
 *
 * Each role (default / primary / …) exposes a small ramp so variants can
 * compose without runtime color mixing:
 *
 * - `DEFAULT` — solid fill (`solid` variant bg).
 * - `foreground` — text color on top of `DEFAULT`.
 * - `100` / `200` — tinted surface bgs (`faded`, `flat` at low alpha).
 * - `500` — mid stop (hover of `flat`).
 * - `600` — lighter/tinted fg used by `flat` variant text.
 *
 * Values resolve to plain color strings (hex/rgb/rgba) so Emotion can
 * serialize them without running user code.
 */
export interface ColorScale {
  DEFAULT: string;
  foreground: string;
  100: string;
  200: string;
  500: string;
  600: string;
}

export interface SemanticColors {
  /** HeroUI neutral scale — drives `color="default"`. */
  default: ColorScale;
  /** Brand primary. */
  primary: ColorScale;
  /** Brand secondary. */
  secondary: ColorScale;
  /** Success semantic. */
  success: ColorScale;
  /** Warning semantic. */
  warning: ColorScale;
  /** Danger / destructive. */
  danger: ColorScale;
  /** Focus ring color (resolves the HeroUI `--heroui-focus` variable). */
  focus: string;
  bg: {
    /** App background. */
    canvas: string;
    /** Default surface (cards, panels). */
    surface: string;
    /** Raised surface (popover, dropdown). */
    raised: string;
    /** Sunken surface (inputs). */
    sunken: string;
    /** Brand / primary emphasis bg. */
    primary: string;
    /** Muted utility background. */
    muted: string;
    /** Overlay / scrim. */
    overlay: string;
  };
  text: {
    /** Primary body text. */
    primary: string;
    /** Secondary / supporting text. */
    secondary: string;
    /** Low-emphasis / placeholder text. */
    muted: string;
    /** Inverse text (on dark backgrounds in light theme). */
    inverse: string;
    /** Brand/link text. */
    link: string;
    /** Disabled text. */
    disabled: string;
  };
  border: {
    /** Default border. */
    default: string;
    /** Subtle / divider. */
    subtle: string;
    /** Strong / emphasized border. */
    strong: string;
    /** Focused outline color. */
    focus: string;
  };
  action: {
    primary: InteractiveColor;
    secondary: InteractiveColor;
    danger: InteractiveColor;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    info: string;
    successBg: string;
    warningBg: string;
    dangerBg: string;
    infoBg: string;
  };
}

/**
 * The shape Emotion sees on `styled.div` / `css` prop.
 *
 * `tokens` holds primitives (raw palette etc.) and should only be reached for
 * in exceptional cases. Prefer semantic tokens (`colors.bg.surface`, …).
 */
export interface TimeUITheme {
  /** Which color scheme this theme represents. */
  mode: ThemeMode;
  /** Raw primitive tokens, for escape hatches. */
  tokens: Tokens;
  /** Semantic color tokens — the main API for components. */
  colors: SemanticColors;
  typography: Typography;
  spacing: Spacing;
  radius: Radius;
  componentRadius: ComponentRadius;
  shadows: Shadows;
  zIndex: ZIndex;
  breakpoints: Breakpoints;
  motion: Motion;
  borders: Borders;
  components: Components;
}

/** Partial override shape accepted by `createTheme`. */
export type ThemeOverrides = DeepPartial<TimeUITheme>;

/** Utility — recursive Partial. */
export type DeepPartial<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

// Re-export primitives for downstream consumers who want concrete palette types.
export type {
  Palette,
  Typography,
  Spacing,
  Radius,
  ComponentRadius,
  Shadows,
  ZIndex,
  Breakpoints,
  Motion,
  Borders,
  Components,
};

// Module augmentation — gives Emotion's Theme the full TimeUI shape, so that
// `styled.div` and the `css` prop get typed access to `theme.colors.bg.surface`
// etc. with full IntelliSense.
declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface Theme extends TimeUITheme {}
}
