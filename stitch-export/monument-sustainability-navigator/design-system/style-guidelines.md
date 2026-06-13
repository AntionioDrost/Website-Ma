## Brand & Style
The design system is built upon the concept of "Timeless Stewardship." It bridges the gap between historical preservation and modern environmental responsibility. The aesthetic is **Sophisticated Editorial**, drawing inspiration from architectural monographs and museum signage. It avoids the fleeting trends of typical SaaS platforms in favor of a grounded, authoritative, and unburdening experience for monument owners and government officials.

The target audience consists of property owners, architects, and civic advisors who require clarity and expertise. The UI must feel as stable and intentional as the masonry it describes, using ample whitespace (breathing room) and a structural grid that mirrors architectural blueprints.

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

## Components
- **Buttons:** Primary buttons are solid Forest Green with White text. Secondary buttons use a Forest Green border with Stone background. High-action buttons (e.g., "Start Advies") can use the Bronze accent color.
- **Smart Checklist Cards:** Used for sustainability steps. Features a leading icon, a Bold Forest Green title, and a status chip. When "Complete," the card background shifts to a very light green tint.
- **Status Chips:** Small, rectangular labels with rounded corners (4px). Use high-contrast text on muted backgrounds (e.g., Dark Green text on light mint background).
- **Expandable Panels:** Used for technical details. Use a "plus/minus" toggle on the far right. The header remains Stone, and the expanded content reveals the Parchment background.
- **Input Fields:** Minimalist with a 1px Stone border. Focus state is a 2px Forest Green bottom-border to mimic a signature line or architectural annotation.
- **Split-Screen Utility:** A 50/50 or 40/60 vertical split. The left side is typically used for visual context (photos of the monument or maps), while the right side handles scrollable form data or checklists.
