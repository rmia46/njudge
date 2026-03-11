# Inara Theme Framework v0.1: Bit-Art Digitalism
*Modular. Pixelated. Precision-Engineered Joy.*

Inara is a specialized design system for nJudge. It is built on the philosophy that software for programmers should feel like a high-end tool but look like a vibrant adventure. It uses "Pixel Art" as a metaphor for the "Byte" — the fundamental unit of our craft.

## 1. Core Visual Pillars

### 1.1 The "Bit-Art" Aesthetic
- **Sharpness over Softness:** Avoid Gaussian blurs and soft shadows. Use solid color offsets to create depth.
- **Pixel Borders:** Main containers use a `3px` or `4px` solid border to mimic the stroke of retro sprite art.
- **Dithering & Grids:** Use CSS-generated dot patterns and 45-degree stripes for background textures instead of flat gradients.

### 1.2 "Nerdy & Joyful" Balance
- **The Nerdy:** Data density is high. Ranks, handles, and timestamps use Monospace fonts. Containers feature "bracket accents" `[` `]`.
- **The Joyful:** Colors are high-chroma (neon-adjacent). Interactions are "bouncy" (spring physics). Outer corners use large radii (`1.5rem`) while internal elements remain sharp and "blocky".

## 2. Modular Architecture (Critical for AI Agents)

### 2.1 Color Sovereignty
- **NO HARDCODED COLORS:** All colors must be derived from `lib/inara-colors.ts`.
- **Variable Mapping:** The TS config maps to CSS variables (e.g., `--inara-primary`). Components must only ever reference the variable.
- **Color Space:** Use **OKLCH**. It allows for "Experimental Tuning" where we can change the Hue while keeping the Lightness and Chroma constant, ensuring the theme doesn't "break" when we swap colors.

### 2.2 The "Byte" Spacing System
All padding and margins must be multiples of **8** (1 byte = 8 bits).
- `inara-p-xs`: 4px (nibble)
- `inara-p-sm`: 8px (1 byte)
- `inara-p-md`: 16px (2 bytes)
- `inara-p-lg`: 32px (4 bytes)

## 3. Component Specifications

### 3.1 The "Inara Block" (Cards)
- **Border:** `3px` solid `--inara-border`.
- **Shadow:** `4px 4px 0px 0px var(--inara-shadow)`. (Zero blur).
- **Corner Logic:** `border-radius: 1rem` for the outer card, but the header inside has `0px` radius to maintain the "Blocky" feel.

### 3.2 The "Tactile Button"
- **State - Idle:** Solid border + solid shadow offset.
- **State - Hover:** Scale `1.02` with a spring bounce.
- **State - Active:** Shadow offset moves to `0px 0px`, and the button "sinks" into the page (tactile click).

### 3.3 Tables (The Leaderboard)
- **Row Hover:** Instead of a simple color change, a `2px` vertical bar of `--inara-primary` appears at the start of the row.
- **Typography:** Table headers are uppercase bold sans-serif; cell data is always Monospace.

## 4. Animation Guidelines
- **Frame-Rate:** Use "stepped" timing functions for loaders (e.g., `steps(4)`) to mimic retro animations.
- **Springs:** For movement, use: `stiffness: 400, damping: 15`.

## 5. Naming Convention
Every custom class or variable must be prefixed with `inara-`.
*Example: `.inara-verdict-ac`, `--inara-primary-glow`.*

---
*Future Agent Note: When implementing new pages, always wrap the main content in an `.inara-grid-bg` and ensure all status badges use the `.inara-pixel-badge` style.*
