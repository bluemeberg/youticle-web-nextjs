export const BRAND = {
  primary: "#0066FF",
  primaryHover: "#005EEB",
  primaryTint: "#EAF2FE",
  gradient: "linear-gradient(135deg,#0066FF,#005EEB)",
  darkGradient: "linear-gradient(135deg,#171719 0%,#2E2F33 58%,#005EEB 100%)",
  darkSolid: "#171719",
} as const;

export const SIGNAL = {
  success: "#00BF40",
  successTint: "#F0FBF4",
  warning: "#FF5E00",
  warningTint: "#fffbeb",
  danger: "#FF4242",
  dangerTint: "#fef2f2",
  info: "#3385FF",
  infoTint: "#EAF2FE",
} as const;

export const TEXT = {
  heading: "#171719",
  sub: "rgba(46,47,51,0.88)",
  body: "rgba(55,56,60,0.88)",
  muted: "rgba(55,56,60,0.61)",
  placeholder: "rgba(55,56,60,0.28)",
  disabled: "rgba(112,115,124,0.22)",
} as const;

export const SURFACE = {
  card: "#ffffff",
  page: "#f7f7f8",
  subtle: "#f4f4f5",
  border: "rgba(112,115,124,0.22)",
} as const;

export const SHADOW = {
  card: "0 6px 12px 0 rgba(23,23,23,0.07), 0 2px 4px 0 rgba(23,23,23,0.06)",
  lift: "0 12px 24px 0 rgba(23,23,23,0.10), 0 4px 8px 0 rgba(23,23,23,0.07)",
  header: "0 1px 4px 0 rgba(0,0,0,0.08)",
  nav: "0 -2px 20px 0 rgba(23,23,23,0.05)",
  button: "0 6px 12px 0 rgba(23,23,23,0.07), 0 2px 4px 0 rgba(23,23,23,0.06)",
} as const;

export const RADIUS = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "20": 20,
  "2xl": 24,
  "3xl": 32,
  pill: 9999,
} as const;

export const SPACING = {
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s20: 20,
  s24: 24,
  s32: 32,
  s40: 40,
  s48: 48,
  s56: 56,
  s64: 64,
  s80: 80,
  s96: 96,
  s128: 128,
} as const;

export const TYPOGRAPHY = {
  display: { size: 26, weight: 900, lineHeight: 1.25, letterSpacing: "-0.04em" },
  h2: { size: 22, weight: 800, lineHeight: 1.25, letterSpacing: "-0.04em" },
  h3: { size: 18, weight: 800, lineHeight: 1.4, letterSpacing: "-0.04em" },
  body: { size: 14, weight: 400, lineHeight: 1.55, letterSpacing: "-0.01em" },
  small: { size: 13, weight: 500, lineHeight: 1.5, letterSpacing: "-0.01em" },
} as const;

export const APP_WIDTH = 430;
export const FONT_STACK =
  "'PretendardVariable', 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";
