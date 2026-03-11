/**
 * Inara Color Palette v0.1
 * 
 * Format: [Lightness (0-1), Chroma (0-0.4), Hue (0-360)]
 * All colors are defined in OKLCH for maximum vibrancy.
 */

export const INARA_PALETTE = {
  // Brand Colors
  primary: {
    base: "0.75 0.18 155",    // Byte Green
    light: "0.85 0.10 155",
    dark: "0.40 0.15 155",
    glow: "0.75 0.18 155 / 0.3",
  },
  accent: {
    base: "0.70 0.25 330",    // Glitch Pink
    glow: "0.70 0.25 330 / 0.3",
  },
  logic: {
    base: "0.65 0.15 250",    // Logic Blue
    glow: "0.65 0.15 250 / 0.3",
  },

  // Interface Surfaces
  monolith: {
    bg: "0.12 0.02 160",      // Deepest Midnight
    card: "0.16 0.03 160",    // Elevated block
    muted: "0.22 0.02 160",   // Dithered areas
    border: "0.35 0.02 160",  // Sharp pixel lines
    shadow: "0.05 0.01 160",  // Solid shadow color
  },

  // Data States (Verdicts)
  status: {
    ac: "0.78 0.18 145",
    wa: "0.65 0.22 25",
    tle: "0.88 0.15 85",
    re: "0.62 0.20 300",
    ce: "0.55 0.05 0",
  }
}

/**
 * Returns a flattened object of CSS variables for injection into globals.css or root
 */
export function getInaraVariables() {
  return {
    "--inara-primary": INARA_PALETTE.primary.base,
    "--inara-primary-light": INARA_PALETTE.primary.light,
    "--inara-primary-dark": INARA_PALETTE.primary.dark,
    "--inara-primary-glow": INARA_PALETTE.primary.glow,
    
    "--inara-accent": INARA_PALETTE.accent.base,
    "--inara-accent-glow": INARA_PALETTE.accent.glow,
    
    "--inara-logic": INARA_PALETTE.logic.base,
    
    "--inara-bg": INARA_PALETTE.monolith.bg,
    "--inara-card": INARA_PALETTE.monolith.card,
    "--inara-muted": INARA_PALETTE.monolith.muted,
    "--inara-border": INARA_PALETTE.monolith.border,
    "--inara-shadow": INARA_PALETTE.monolith.shadow,
    
    "--inara-ac": INARA_PALETTE.status.ac,
    "--inara-wa": INARA_PALETTE.status.wa,
    "--inara-tle": INARA_PALETTE.status.tle,
    "--inara-re": INARA_PALETTE.status.re,
    "--inara-ce": INARA_PALETTE.status.ce,
  }
}
