---
name: Heritage Preservation System
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#434843'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#737973'
  outline-variant: '#c3c8c1'
  surface-tint: '#4d6453'
  primary: '#061b0e'
  on-primary: '#ffffff'
  primary-container: '#1b3022'
  on-primary-container: '#819986'
  inverse-primary: '#b4cdb8'
  secondary: '#8e4e1e'
  on-secondary: '#ffffff'
  secondary-container: '#ffab73'
  on-secondary-container: '#793d0d'
  tertiary: '#171815'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c2c29'
  on-tertiary-container: '#95938f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d0e9d4'
  primary-fixed-dim: '#b4cdb8'
  on-primary-fixed: '#0b2013'
  on-primary-fixed-variant: '#364c3c'
  secondary-fixed: '#ffdbc7'
  secondary-fixed-dim: '#ffb688'
  on-secondary-fixed: '#311300'
  on-secondary-fixed-variant: '#713707'
  tertiary-fixed: '#e5e2dd'
  tertiary-fixed-dim: '#c9c6c2'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#474743'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
The design system is built upon the concept of "Timeless Stewardship." It bridges the gap between historical preservation and modern environmental responsibility. The aesthetic is **Sophisticated Editorial**, drawing inspiration from architectural monographs and museum signage. It avoids the fleeting trends of typical SaaS platforms in favor of a grounded, authoritative, and unburdening experience for monument owners and government officials.

The target audience consists of property owners, architects, and civic advisors who require clarity and expertise. The UI must feel as stable and intentional as the masonry it describes, using ample whitespace (breathing room) and a structural grid that mirrors architectural blueprints.

## Colors
The palette is rooted in natural, architectural materials.
- **Primary (Forest Green):** Represents sustainability and growth. Used for key actions and deep headers.
- **Secondary (Muted Bronze):** Used sparingly for accents, highlights, and specialized calls-to-action to evoke quality and craftsmanship.
- **Surface (Stone & Parchment):** The foundation of the UI. `Stone` is used for containers and sidebars, while `Parchment` serves as the primary page background to reduce eye strain and provide a premium feel.
- **Text (Charcoal):** High-contrast but softer than pure black to maintain an editorial warmth.
- **Status Colors:** Muted versions of green, orange, and red, ensuring they sit harmoniously within the heritage palette without appearing jarring.

## Typography
The typographic scale emphasizes hierarchy and readability. 
- **Headings:** `Playfair Display` provides an authoritative, historical character. Use for page titles, section headers, and featured quotes.
- **UI & Body:** `Public Sans` is chosen for its institutional clarity and excellent legibility in data-heavy contexts. It remains neutral to let the serif headings shine.
- **Dutch Language Note:** Ensure all copy uses B1-level Dutch (clear, everyday language). For example, use "Verduurzaming" instead of overly technical jargon where possible. 
- **Labels:** Small labels and status indicators use increased letter spacing and uppercase weight to differentiate from body text.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for content-heavy pages to maintain an editorial feel, while utilizing a **Split-Screen Utility** for interactive tools (e.g., a map on the left, data on the right).

- **Desktop:** 12-column grid with a 1200px max-width container. 64px outer margins provide a "gallery" feel.
- **Mobile:** 4-column grid with 16px margins. 
- **Vertical Rhythm:** Use the `lg` (48px) spacing unit to separate major sections and `md` (24px) for internal component spacing.
- **Architectural Accents:** Apply a subtle 24px grid pattern (0.05 opacity Forest Green) to the background of header sections or empty states to mimic blueprint paper.

## Elevation & Depth
This design system avoids heavy drop shadows, opting instead for **Tonal Layers** and **Low-Contrast Outlines**.
- **Base Layer:** Parchment (#FCFAFA).
- **Secondary Layer:** Stone (#F5F2ED) used for cards and navigation sidebars.
- **Borders:** 1px solid borders in a slightly darker stone tint (#E5E0D8) define boundaries without adding visual weight.
- **Depth:** When elevation is required (e.g., a modal or an active card), use a single, extremely diffused ambient shadow: `0px 4px 20px rgba(27, 48, 34, 0.08)`. This shadow is tinted with the primary Forest Green to keep the palette cohesive.

## Shapes
Shapes are **Soft** but disciplined. 
- **Standard Radius:** 4px (0.25rem) for buttons, inputs, and small chips. This keeps the look professional and architectural rather than "bubbly."
- **Large Radius:** 8px (0.5rem) for main content cards and expandable panels. 
- **Interactive Elements:** Buttons should never be fully rounded (pill-shaped) to maintain the serious, civic-tech aesthetic.

## Components
- **Buttons:** Primary buttons are solid Forest Green with White text. Secondary buttons use a Forest Green border with Stone background. High-action buttons (e.g., "Start Advies") can use the Bronze accent color.
- **Smart Checklist Cards:** Used for sustainability steps. Features a leading icon, a Bold Forest Green title, and a status chip. When "Complete," the card background shifts to a very light green tint.
- **Status Chips:** Small, rectangular labels with rounded corners (4px). Use high-contrast text on muted backgrounds (e.g., Dark Green text on light mint background).
- **Expandable Panels:** Used for technical details. Use a "plus/minus" toggle on the far right. The header remains Stone, and the expanded content reveals the Parchment background.
- **Input Fields:** Minimalist with a 1px Stone border. Focus state is a 2px Forest Green bottom-border to mimic a signature line or architectural annotation.
- **Split-Screen Utility:** A 50/50 or 40/60 vertical split. The left side is typically used for visual context (photos of the monument or maps), while the right side handles scrollable form data or checklists.
