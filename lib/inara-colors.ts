/**
 * Inara Color Palette v0.2 - NATURE-TECH (Single Theme)
 * 
 * Based on user-provided hex: #EEFABD, #A0D585, #6984A9, #263B6A
 */

export const INARA_PALETTE = {
  primary: {
    base: "0.82 0.15 142",    // #A0D585 (Grounded Green)
    light: "0.96 0.12 108",   // #EEFABD (Lime Highlight)
    dark: "0.65 0.12 142",
    glow: "0.82 0.15 142 / 0.3",
  },
  accent: {
    base: "0.96 0.12 108",    // #EEFABD
    glow: "0.96 0.12 108 / 0.3",
  },
  secondary: {
    base: "0.58 0.08 252",    // #6984A9 (Muted Blue)
    glow: "0.58 0.08 252 / 0.3",
  },

  // Interface Surfaces
  monolith: {
    bg: "0.32 0.10 265",      // #263B6A (Deep Navy Base)
    card: "0.38 0.08 265",    // Elevated navy
    muted: "0.45 0.06 265",   // Intermediate
    border: "0.50 0.05 265",  // Visible grid lines
    shadow: "0.15 0.05 265",  // Deep solid shadow
  },

  // State colors that fit the organic palette
  status: {
    ac: "0.82 0.15 142",      // Same as primary green
    wa: "0.75 0.15 30",       // Muted Coral/Red
    tle: "0.90 0.15 80",      // Muted Yellow
    re: "0.65 0.15 320",      // Muted Purple
    ce: "0.60 0.05 265",      // Muted Gray-Blue
  }
}

export function getInaraVariables() {
  return {
    "--inara-primary": INARA_PALETTE.primary.base,
    "--inara-primary-light": INARA_PALETTE.primary.light,
    "--inara-primary-dark": INARA_PALETTE.primary.dark,
    "--inara-primary-glow": INARA_PALETTE.primary.glow,
    
    "--inara-accent": INARA_PALETTE.accent.base,
    "--inara-accent-glow": INARA_PALETTE.accent.glow,
    
    "--inara-logic": INARA_PALETTE.secondary.base,
    
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
