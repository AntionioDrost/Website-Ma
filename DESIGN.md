---
name: Monument Gids
description: Rustige, begrijpelijke digitale begeleiding voor monumentale woningeigenaren, met een open witte layout, zachte topgloed en duidelijke hulp bij regels en vergunningen.
colors:
  paper: "#ffffff"
  paper-warm: "#fcfaf7"
  card-cream: "#fefaef"
  line-soft: "#d8d0c4"
  line-muted: "#c9beae"
  forest: "#173828"
  forest-deep: "#0b1f15"
  forest-soft: "#4a6458"
  sage-wash: "#d7e4d5"
  sage-badge: "#4f6f58"
  ink: "#111111"
  ink-body: "#1f2421"
  text-muted: "#5f675f"
  bronze: "#a76735"
typography:
  display:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "clamp(2.8rem, 6vw, 4.2rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.06em"
  headline:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  xl: "16px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.forest}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "14px 22px"
  button-primary-hover:
    backgroundColor: "{colors.forest-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "14px 22px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  card-default:
    backgroundColor: "{colors.card-cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "22px"
---

# Design System: Monument Gids

## Overview

**Creative North Star: "The Calm Permit Guide"**

This system is built to lower stress before it asks anything from the user. The interface should feel like a capable person sitting beside a monument owner, quietly translating a complicated permit landscape into clear next steps. It is warm without becoming soft-focus, structured without becoming official, and confident without sounding municipal.

The homepage proves that balance through a restrained palette, large direct typography, generous white space, cream information cards, and a single human gesture in the hand-drawn underline beneath "Zonder stress." The hero is intentionally frameless. It sits openly on the canvas, with a warm top glow that starts at the very edge of the viewport so the page feels spacious and calm on laptop screens instead of boxed in. The public-facing surfaces should always feel understandable within seconds. The more task-oriented workspace can be denser, but it still inherits the same calm support, the same clear wording, and the same refusal to sound bureaucratic.

**Key Characteristics:**
- Large, plainspoken headlines that reduce stress instead of selling aspiration.
- An open, frameless hero that blends directly into the page instead of sitting inside a bordered shell.
- White canvas first, with warm cream cards used as supportive containers rather than decorative blocks.
- Dark green as the single action color, reserved for trust, progress, and decisive next steps.
- Human warmth through copy, spacing, a visible warm top glow, and one restrained signature flourish, never through municipal styling or compliance-heavy framing.
- Responsive behavior that simplifies the chrome on smaller screens by removing secondary elements before the message.

## Colors

The palette is bright, calm, and quietly warm. White carries the interface, cream carries explanation, and green carries trust and action.

### Primary
- **Steady Forest** (`#173828`): The primary action color. Use it for the main login CTA, confirmation states, and moments where the interface should feel trustworthy and grounded.
- **Deep Forest** (`#0b1f15`): The pressed and hover state for primary actions. This is the darker commitment of the same voice, not a second accent.
- **Soft Forest** (`#4a6458`): A supporting green used for subtle emphasis, low-contrast status surfaces, and inherited token continuity in the authenticated workspace.

### Secondary
- **Sage Wash** (`#d7e4d5`): The soft support color used in gentle state backgrounds and quiet supportive accents. It signals calm guidance, never urgency.
- **Sage Ink** (`#4f6f58`): The green text tone paired with subtle support surfaces. It should remain quiet, readable, and never slip into gray vagueness.

### Tertiary
- **Bronze Marker** (`#a76735`): A reserved heritage accent for minor emphasis in the broader product system. It should remain scarce on the public homepage.

### Neutral
- **Clear Paper** (`#ffffff`): The dominant page background. White keeps the product accessible, modern, and non-institutional.
- **Warm Paper** (`#fcfaf7`): A secondary neutral carried over into the application surfaces and gentle layered backgrounds.
- **Guidance Cream** (`#fefaef`): The card background. This is the Pirsch-inspired information surface that softens dense guidance without becoming beige slop.
- **Hero Glow** (`rgba(232, 225, 207, 0.72)`): The warm atmospheric top glow used behind the frameless hero to keep the page soft and visible on desktop screens.
- **Soft Line** (`#d8d0c4`): Light structural border color for broader product panels and inputs.
- **Quiet Line** (`#c9beae`): A slightly firmer divider used where hierarchy needs one extra step of definition.
- **Primary Ink** (`#111111`): The default heading and CTA text color. Strong, clear, and never gray.
- **Body Ink** (`#1f2421`): The main body text anchor in non-home surfaces.
- **Muted Guidance** (`#5f675f`): Supporting copy where full black would feel too heavy.

**The White-First Rule.** The page background stays white. Warmth lives in cards, glow layers, and supportive surfaces, not in a cream body wash.

## Typography

**Display Font:** DM Sans, sans-serif  
**Body Font:** DM Sans, sans-serif  
**Label/Mono Font:** DM Sans, sans-serif

**Character:** Typography does the emotional heavy lifting through scale and clarity, not through ornament. The voice is direct, modern, and reassuring, with large bold headlines that calm rather than hype.

### Hierarchy
- **Display** (700, `clamp(2.8rem, 6vw, 4.2rem)`, 1.02): Reserved for the hero statement and other high-stakes reassurance moments.
- **Headline** (700, `2rem`, 1.1): Used for section anchors like "Zo helpen we je verder" and wide-card headings.
- **Title** (700, `1.15rem` to `1.5rem`, 1.1): Used for card titles and secondary content groupings.
- **Body** (400, `1.02rem`, 1.65): Used for explanatory copy. Keep prose comfortably readable and avoid institutional density.
- **Label** (600, `0.85rem`, 1.2): Used for nav items, footer links, buttons, and compact UI labels.

**The Reassurance Scale Rule.** Headlines may be large, but the language must stay plain. If the typography is loud and the wording is also formal, the interface stops helping and starts lecturing.

## Elevation

This system is flat by default. The homepage relies on atmosphere, cream surfaces, and spacing for separation rather than obvious shadow stacks. The homepage hero should stay frameless, with depth coming from the top glow and open whitespace rather than from a bordered container. In the wider product workspace, soft shadows exist, but they are ambient support rather than decorative lift.

### Shadow Vocabulary
- **Ambient Support** (`0 14px 36px rgba(11, 31, 21, 0.08)`): Used on application panels and floating containers outside the homepage when a surface needs quiet depth.
- **Deep Support** (`0 28px 56px rgba(11, 31, 21, 0.12)`): Reserved for stronger emphasis states in the authenticated workspace, not for routine homepage cards.

**The Flat-At-Rest Rule.** Public guidance surfaces stay visually calm at rest. If a homepage card needs a shadow to feel important, the hierarchy is wrong.

## Components

### Buttons
- **Shape:** Softly rounded, not bubbly (`10px` for primary CTAs, `14px` for secondary buttons).
- **Primary:** Steady Forest background (`#173828`) with white text, medium horizontal padding (`14px 22px`), and a compact icon gap. The primary button is the commitment action and should remain singular in a given viewport.
- **Hover / Focus:** Hover darkens to Deep Forest (`#0b1f15`) with only a slight lift. Focus should be crisp and practical, never ornamental.
- **Secondary / Ghost:** White background with subtle border and dark text. Used for topbar login and lower-emphasis navigation actions.

### Cards / Containers
- **Corner Style:** Consistent soft rectangle (`14px`).
- **Background:** Guidance Cream (`#fefaef`) for homepage information cards, white for the page canvas and hero field.
- **Shadow Strategy:** No visible homepage shadow. Depth comes from the cream field, border, spacing, and the hero glow.
- **Border:** Hairline dark border at low opacity for homepage cards, softer neutral borders in the app workspace.
- **Internal Padding:** `18px` on compact cards, `22px` on full cards and wide guidance modules.

### Hero Surface
- **Structure:** Keep the hero open and frameless so the page starts with confidence instead of a boxed marketing container.
- **Atmosphere:** Use a warm radial glow from the top edge of the viewport to create softness without introducing visible borders.
- **Spacing:** Preserve generous vertical spacing around the headline, subcopy, and primary action so the hero still breathes on laptop screens.

### Inputs / Fields
- **Style:** In the broader product workspace, inputs are light surfaces with soft neutral borders, rounded corners, and clear spacing. They should feel stable and readable before they feel branded.
- **Focus:** Focus should strengthen the border or surface contrast. It should never rely on delicate low-contrast effects.
- **Error / Disabled:** Disabled states stay readable. Error states should feel corrective, not punitive.

### Navigation
- **Style:** Compact DM Sans labels with restrained weight, a centered link group, and extra breathing room above the header so the page opens calmly instead of pressed against the viewport edge.
- **States:** Default nav links are slightly softened. Hover sharpens to Primary Ink (`#111111`).
- **Responsive treatment:** The homepage topbar should compress in stages, not jump straight from desktop to a stacked mobile header. On mid-width screens the logo and login stay on the first row while the navigation drops to its own centered row. Only on narrower mobile widths does the login disappear to protect the message.

### Signature Component
- **Hero Reassurance Mark:** The animated underline beneath "Zonder stress." is the only intentionally human flourish on the homepage. It should use the chosen SVG stroke language, draw once from left to right on load, stay tucked beneath the headline, and never collide with the supporting copy beneath it.

## Do's and Don'ts

### Do:
- **Do** keep the body background white and let `#fefaef` carry the supportive card system.
- **Do** keep the hero frameless and let the top glow carry the atmosphere instead of reintroducing a boxed container.
- **Do** use dark green for decisive actions only. The primary CTA should feel singular, not repeated as decoration.
- **Do** write headings in plain Dutch that reduce stress before they explain complexity.
- **Do** remove secondary interface pieces on smaller screens before the hero message starts competing for space.
- **Do** keep borders light and shadows quiet so the product feels calm, not theatrical.

### Don't:
- **Don't** let the product feel gemeentelijk, formal, or dependent on institutional language for authority.
- **Don't** reduce the experience to numbers, compliance checklists, or cold procedural steps.
- **Don't** make users feel like they are being left alone in a swamp of regulations.
- **Don't** make the interface feel like a rigid system that assumes prior knowledge.
- **Don't** replace clarity with decorative SaaS landing-page behavior, generic AI-tool polish, or multiple competing accent colors.
- **Don't** put the homepage hero back inside a rounded bordered frame or let the top glow fade out before it reaches the page edge on desktop.
