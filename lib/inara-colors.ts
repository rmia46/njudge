/**
 * Inara Color Palette v0.3 - LIGHT NATURE-TECH (Single Theme)
 * 
 * Base Palette: #EEFABD, #A0D585, #6984A9, #263B6A
 */

export const INARA_PALETTE = {
  primary: {
    base: "0.82 0.15 142",    // #A0D585 (Grounded Green)
    light: "0.96 0.12 108",   // #EEFABD (Lime Highlight)
    dark: "0.45 0.10 142",
    glow: "0.82 0.15 142 / 0.2",
  },
  accent: {
    base: "0.58 0.08 252",    // #6984A9 (Muted Blue)
    glow: "0.58 0.08 252 / 0.2",
  },
  secondary: {
    base: "0.32 0.10 265",    // #263B6A (Deep Navy)
    glow: "0.32 0.10 265 / 0.2",
  },

  // Interface Surfaces (Softened Light Aesthetic)
  monolith: {
    bg: "0.98 0.01 108",      // #F8FAF0 (Very Light Sage/Cream)
    card: "1 0 0",            // Pure White
    muted: "0.97 0.01 108",   // Softened Grey (Very subtle)
    border: "0.88 0.02 265",  // Lightened Grey-Navy Border
    shadow: "0.32 0.10 265 / 0.08", // Very Soft Shadow
  },

  // State colors
  status: {
    ac: "0.75 0.15 142",      
    wa: "0.65 0.18 25",       
    tle: "0.85 0.15 85",      
    re: "0.60 0.18 300",      
    ce: "0.50 0.05 265",      
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
