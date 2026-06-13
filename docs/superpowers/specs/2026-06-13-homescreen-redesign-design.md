# Homescreen Redesign Design

## Summary

We are redesigning the homescreen of `monument-app` so it speaks directly to Dutch monument homeowners instead of developers or internal stakeholders. The page should explain what the product does, reduce uncertainty, and guide users into a gated experience with `Inloggen` as the primary call to action.

The homescreen should feel like a reassuring personal guide, not like a municipal portal and not like a nostalgic heritage brochure. The visual direction is warm modern: calm, credible, contemporary, and human.

## Primary User

Primary users are Dutch monument homeowners who want to make their homes more sustainable and need help navigating permit-heavy, confusing decisions.

Secondary users are municipality workers or public-sector teams who may see the product as a model worth adopting, but the homescreen is not written for them.

## Primary User Action

The most important action is:

1. Understand within a few seconds what the site helps with.
2. Feel reassured that the service is meant for homeowners in a difficult process.
3. Choose to log in.

## Product Goal For This Surface

The homescreen should:

- explain the service in plain Dutch;
- make the value legible for first-time homeowners;
- avoid any developer-facing or demo-facing language;
- establish enough trust that logging in feels like the natural next step.

It should not try to explain every workflow, show internal product architecture, or function like a sales page for municipal buyers.

## Design Direction

### Core Direction

The page should move away from the current old-fashioned editorial feeling and toward a warmer modern product feel.

That means:

- sharper layout structure;
- cleaner typography;
- less heritage-romantic atmosphere;
- less decorative monument mood;
- more contemporary product confidence.

### Color Strategy

Use a restrained palette. Keep the existing warm parchment, deep forest, and muted bronze identity, but use it in a more contemporary way:

- parchment and warm off-white for page grounding;
- forest for emphasis, primary actions, and moments of confidence;
- bronze only as a subtle accent;
- avoid making the page feel sepia, antique, or ceremonial.

### Theme Scene Sentence

A homeowner opens the site in daylight at their kitchen table, trying to make sense of a confusing sustainability or permit situation, and needs calm modern clarity rather than institutional formality.

### Anchor References

- `Gleap`: product clarity, structured confidence, cleaner modern hierarchy
- `Micro`: calmer product atmosphere, more current typographic feel
- `Pirsch`: restrained modern layout and disciplined simplicity

These are directional references only. The product should not inherit generic SaaS tropes, startup gradients, or tech-company slickness.

## Scope

- Fidelity: mid-fi
- Breadth: one screen
- Interactivity: static direction-setting pass
- Time intent: validate direction before implementation

This spec is for shaping only. It does not include code changes.

## Content Strategy

The page must speak to homeowners from the first line. It should explain:

- what the site helps with;
- who it is for;
- why it is helpful if monument rules or permit steps feel difficult;
- what the next step is.

The current developer-facing language must be removed. That includes any copy that describes:

- demos;
- internal flows;
- implementation choices;
- design-system references;
- product-building context.

### Required Content Blocks

1. `Hero`
   A plain-language headline and subhead for monument homeowners, with `Inloggen` as the main call to action.

2. `How it works`
   A short explanation of how the service helps users move from uncertainty to a clearer next step.

3. `Trust and reassurance`
   A concise section explaining that the platform helps people make sense of monument rules, sustainability choices, and permit preparation.

4. `Login entry`
   Either integrated directly into the hero or presented as a tight adjacent login panel. It must feel primary, not secondary.

### Copy Tone

The tone should be:

- ontzorgend;
- behulpzaam;
- toegankelijk;
- warm;
- practical;
- non-bureaucratic.

The tone should not be:

- municipal;
- formal;
- stiff;
- process-heavy;
- purely technical;
- purely metrics-driven.

## Layout Strategy

The layout should be hero-first and disciplined.

### Recommended Structure

1. Minimal top bar
   Keep the header quiet. It can contain branding and perhaps a secondary route, but it should not compete with the hero CTA.

2. Strong hero with embedded login priority
   The hero should contain:
   - the main promise;
   - a short supporting explanation;
   - the primary `Inloggen` CTA;
   - optionally a compact adjacent login card or trust block.

3. Short explanatory strip
   Below the hero, add a compact section that quickly explains how the platform helps.

4. Reassurance section
   This section should reinforce that users do not need to already understand monument procedures or permit language.

### Hierarchy Rules

- The hero headline must be clear and homeowner-facing, not conceptual.
- The login CTA should be the strongest action on the page.
- Supporting sections should be shorter and tighter than the current homescreen.
- Avoid over-relying on same-sized cards.
- Prefer a cleaner page rhythm over heavily panelized layouts.

## Key States

### Default

The user lands on the page, understands the service, and sees login as the natural next step.

### First-Time And Uncertain

The copy should reassure users who may not know:

- what kind of permit may apply;
- what information they need;
- whether their monument situation is simple or complicated.

The page should communicate that the product helps them figure this out.

### Returning User

Returning users should be able to spot the login action immediately without scanning through explanatory sections.

### Mobile

On mobile, the main promise and login CTA must stay near the top of the page. Supporting sections can stack, but the page should not bury the action.

## Interaction Model

The flow is simple:

1. Land on the homescreen.
2. Read a clear promise and short explanation.
3. Choose to log in.

Secondary reading should support confidence, not distract from the main action.

The page should not behave like a brochure with many competing routes. It should feel like a clear entry point into a guided service.

## Visual Principles For This Surface

- Keep warmth, remove nostalgia.
- Use modern spacing and stronger rhythm.
- Use sharper typographic hierarchy and less ornamental atmosphere.
- Preserve trust through clarity, not through institutional styling.
- Make the surface feel like a current digital product for people, not a heritage campaign.

## Recommended Implementation References

- `layout.md`
  For hierarchy, rhythm, and replacing the current panel-heavy composition.

- `typeset.md`
  For sharpening typography and moving away from old-fashioned editorial cues.

- `clarify.md`
  For rewriting all homescreen copy toward homeowner-facing language.

- `quieter.md`
  For reducing heritage-styled excess while keeping warmth and trust.

## Recommended Approach

### Recommended: Warm Modern Guide

This is the preferred direction.

It keeps the product's warm identity, but updates the visual tone toward a cleaner, more current interface. It balances reassurance with clarity and is least likely to become either too old-fashioned or too generic.

### Alternative: Product-Led Concierge

This would make the page feel more strongly like an app entry point, with a heavier emphasis on product blocks and structured reassurance. It could work, but it risks becoming more SaaS-coded than desired.

### Alternative: Minimal Civic Clarity

This would be very restrained and clear, with a public-service style modernism. It could feel strong, but it risks becoming too cold or too close to municipal tone.

## Anti-Goals

This redesign should not:

- feel old-fashioned or antique;
- sound like it was written for developers;
- read like a demo page;
- feel municipal or bureaucratic;
- rely on heritage mood as the main source of trust;
- bury login behind too much explanation;
- imitate startup SaaS aesthetics.

## Success Criteria

The redesign is successful if a first-time homeowner can quickly understand:

- this site is for people like them;
- it helps with sustainable changes to monument homes;
- it helps make permit and monument complexity more manageable;
- the right next step is to log in.
