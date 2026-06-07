---
name: 'DevOpsPilot AI: The Invisible Architect'
colors:
  surface: '#faf8ff'
  surface-dim: '#d6d9ea'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedfe'
  surface-container-high: '#e5e7f9'
  surface-container-highest: '#dfe2f3'
  on-surface: '#171b27'
  on-surface-variant: '#3b4a40'
  inverse-surface: '#2c303d'
  inverse-on-surface: '#eef0ff'
  outline: '#6b7b70'
  outline-variant: '#bacbbe'
  surface-tint: '#006c46'
  primary: '#006c46'
  on-primary: '#ffffff'
  primary-container: '#00e296'
  on-primary-container: '#005f3c'
  inverse-primary: '#01e296'
  secondary: '#00696f'
  on-secondary: '#ffffff'
  secondary-container: '#43f2fe'
  on-secondary-container: '#006c72'
  tertiary: '#6d3ad7'
  on-tertiary: '#ffffff'
  tertiary-container: '#d0bcff'
  on-tertiary-container: '#612acb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#4effb1'
  primary-fixed-dim: '#01e296'
  on-primary-fixed: '#002112'
  on-primary-fixed-variant: '#005233'
  secondary-fixed: '#75f5ff'
  secondary-fixed-dim: '#05dbe7'
  on-secondary-fixed: '#002022'
  on-secondary-fixed-variant: '#004f54'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516bf'
  background: '#faf8ff'
  on-background: '#171b27'
  surface-variant: '#dfe2f3'
  background-slate: '#f8fafc'
  surface-white: '#ffffff'
  electric-amethyst: '#5516bf'
  hyper-cyan: '#00e296'
  terminal-bg: '#0f172a'
typography:
  display-hero:
    fontFamily: Geist
    fontSize: 72px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.05em
  display-hero-mobile:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '300'
    lineHeight: '1.1'
    letterSpacing: -0.05em
  headline-section:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '300'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '300'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.3em
  mono-code:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: '1.6'
spacing:
  base: 8px
  container-padding: 40px
  gutter: 24px
  section-gap: 96px
  cipher-padding: 32px
---

## Brand & Style
The brand personality is high-tech, precise, and authoritative, yet intentionally "invisible" and frictionless. It targets senior engineers and site reliability architects who value technical depth over marketing fluff.

The design style is **Hybrid Cyber-Minimalism**. It combines the clean, airy layouts of modern SaaS (Minimalism) with the technical aesthetic of terminal interfaces (Brutalism/Cyberpunk). Key features include high-density information cards ("Cipher Cards"), subtle technical background grids, and interactive 3D crystalline geometries that suggest complex neural orchestration made simple.

## Colors
The palette is built on a clean `Snow Peak` (#f8fafc) base to maintain a light, professional feel, while using high-energy neon accents to denote "active systems."

- **Primary (Hyper-Cyan):** Used for "System Online" indicators, primary action buttons, and critical data visualizations. It represents health and orchestration.
- **Secondary (Neon-Cyan):** Used for supporting visual elements and secondary data points.
- **Tertiary (Electric Amethyst):** Used to highlight the "AI Architect" components, providing a sophisticated contrast to the green/blue technical tones.
- **Neutral (Charcoal):** Used for typography and deep backgrounds to provide a grounding force against the neons.

## Typography
The typography system uses a tri-font strategy to communicate different levels of technicality:
- **Geist** handles the "Architectural" layer. It is used for large headlines with light weights (300) and tight tracking to evoke a high-end, engineered feel.
- **Inter** provides the "Human" layer. It is used for body copy and descriptions where legibility and neutrality are paramount.
- **JetBrains Mono** is the "Machine" layer. Used for all labels, navigation, tags, and code blocks. It is almost always uppercase with wide tracking (0.2em - 0.3em) to mimic terminal outputs and system readouts.

## Layout & Spacing
The system utilizes a **Fixed-Width Grid** for content (max-width 1280px) with fluid background elements that bleed to the edges. 

- **Outer Margins:** 40px standard for desktop, scaling down to 20px for mobile.
- **Rhythm:** A strict 8px baseline grid is used. Sections are separated by large gaps (96px) to allow the "invisible" architecture to breathe.
- **Grid Strategy:** Use a 12-column grid. "Cipher Cards" typically span 4, 8, or 12 columns. 
- **Internal Padding:** Cards use a generous 32px padding to maintain a premium, uncluttered look even when displaying dense technical data.

## Elevation & Depth
Depth is created through **Glassmorphism and Tonal Layering** rather than heavy shadows.

- **Surface Layering:** The base layer is `Snow Peak`. The secondary layer consists of `Surface White` cards with 90% opacity and 24px backdrop blurs.
- **Borders as Depth:** Instead of shadows, use 1px borders with low-opacity primary colors (`rgba(0, 226, 150, 0.1)`). This creates a "holographic" edge.
- **Interaction Depth:** On hover, cards use a `perspective(1000px)` transform to tilt slightly and gain a soft, tinted glow (`0_12px_30px_rgba(0,226,150,0.08)`) to indicate active focus.
- **System Indicators:** Use `animate-pulse` and `animate-ping` on small colored nodes to create a sense of "live" depth in the interface.

## Shapes
The shape language is **Strictly Geometric and Sharp**. Most UI elements (Buttons, Inputs, Cards) use 0px to 2px corner radii to maintain a technical, "blueprint" aesthetic. 

- **Primary Buttons:** 0px radius (perfectly sharp).
- **Cipher Cards:** 4px radius (Soft 1) for a hint of modernism.
- **System Nodes:** Always 100% circular to contrast with the rigid grid.
- **Terminal Blocks:** 12px radius to signify a separate "containerized" environment from the main UI.

## Components
- **Buttons:** 
  - *Primary:* Rectangular, sharp corners, high-contrast background (Hyper-Cyan or Amethyst), mono-type text with wide tracking, and a 20% opacity glow shadow.
  - *Ghost:* 1px border with mono-type, transition to light grey background on hover.
- **Cipher Cards:** White translucent background, 1px subtle primary border, internal mono-labels at the top left, and icons at the top right.
- **Inputs:** Terminal-style inputs. Background `slate-50`, sharp corners, 1px border that glows on focus. Placeholder text should be uppercase and mono-spaced.
- **System Tags:** Small rectangular badges with 1px primary borders, containing `[STATUS]` text in mono-type.
- **Terminal Blocks:** Deep navy/charcoal backgrounds with syntax-highlighted mono-type. Used for "explaining" the AI's logic to the user.