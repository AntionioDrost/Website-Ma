# Monument Gids Onboarding Account Flow Design

## Goal

Design a calm, account-first onboarding flow that helps new users create an account with as little friction as possible, then immediately receive a short orientation tour through the product.

The onboarding should feel ontzorgend, human, and light. It should reduce uncertainty before it asks for information.

## Aha Moment

The onboarding succeeds when a new user has:

- created an account
- validated that account by email code
- landed inside the product without feeling lost

The first value moment is not yet completing monument-specific work. The first value moment is: "I am in, I understand where to begin, and this tool will guide me."

## Scope

- Replace the lower homepage `Inloggen` CTA with a softer discovery-oriented label.
- Introduce a new-user entry flow that branches from the existing login surface.
- Keep the visual language aligned with the current `/login` page.
- Structure the onboarding like the glass wizard: one clear step at a time, visible progress, calm pacing.
- End the flow with a short in-product tour.

Out of scope for this phase:

- collecting monument dossier details during account creation
- teaching the entire product up front
- changing the existing returning-user login flow beyond the first branching choice

## Recommended Direction

Use a `concierge carousel` pattern:

- one question per screen
- one primary action per screen
- the same stable layout across all steps
- minimal cognitive load

This is preferred over a denser form because the product's users may already feel uncertain or overloaded before they begin. The onboarding should feel like a guide, not like administration.

## Entry Point

### Homepage CTA

Change the lower homepage CTA from `Inloggen` to `Ontdek nu`.

Reasoning:

- `Inloggen` assumes the user already has an account
- `Ontdek nu` feels more welcoming for first-time visitors
- it better matches the product promise of guided discovery rather than account management

The topbar login action can remain a conventional login affordance for returning users.

## Flow Overview

The new-user onboarding flow should contain six account steps followed by a three-step product tour.

### Step 1: Returning or new?

Headline:
`Fijn dat je er bent. Ben je hier al eerder geweest?`

Support copy:
`We helpen je in een paar korte stappen op weg. Heb je al een account, dan pak je je monumentdossier zo weer op.`

Choices:

- `Nee, ik heb nog geen account`
- `Ja, ik heb al een account`

Behavior:

- `Nee` continues into the onboarding flow
- `Ja` routes directly to the existing login page

### Step 2: Name

Headline:
`Prettig kennis te maken, wat is je naam?`

Support copy:
`Dan spreken we je meteen wat persoonlijker aan.`

Field:

- `Je naam`

### Step 3: Place of residence

Headline:
`Waar woon je?`

Support copy:
`Zo stemmen we onze begeleiding straks beter af op jouw situatie.`

Field:

- `Woonplaats`

This step should remain light and personal. It should not yet ask for a full project or monument address.

### Step 4: Email

Headline:
`Wat is je e-mailadres?`

Support copy:
`Hier sturen we je bevestiging en later je toegangscode naartoe.`

Field:

- `naam@voorbeeld.nl`

### Step 5: Password

Headline:
`Kies een wachtwoord`

Support copy:
`Dan staat je account veilig voor je klaar.`

Field:

- `Wachtwoord`

Helper text:

- `Minimaal 8 tekens`

This step gets its own screen so the flow keeps feeling conversational instead of collapsing into a registration form.

### Step 6: Email verification code

Headline:
`Vul de code uit je mail in`

Support copy:
`Bijna klaar. Daarmee bevestigen we dat dit jouw account is.`

Field:

- `6-cijferige code`

Primary action:

- `Account bevestigen`

Secondary action:

- `Code opnieuw sturen`

## Post-Verification Transition

After a successful verification, show a short success moment before moving into the tour.

Suggested copy:

`Je account staat klaar. We laten je even zien waar je alles vindt.`

This should feel like a handoff, not like a system confirmation.

## Product Tour

The tour should be short, practical, and reassuring. Its purpose is orientation, not training.

Three steps are sufficient.

### Tour Step 1: Home

Headline:
`Welkom in je startscherm`

Support copy:
`Hier begint je dossier. Vanaf hier zie je wat je al hebt gedaan en wat een goede volgende stap is.`

### Tour Step 2: Intake chat

Headline:
`Hier kun je gewoon beginnen`

Support copy:
`Twijfel je ergens over? In de intakechat kun je in je eigen woorden vertellen wat er speelt. Wij helpen je daarna verder.`

### Tour Step 3: Wizard guidance

Headline:
`Stap voor stap verder`

Support copy:
`Wil je iets rustig uitwerken, zoals glasisolatie? Dan helpt de wizard je door het proces heen.`

Closing action:

- `Ga naar mijn startscherm`

Optional secondary action:

- `Bekijk de rondleiding later opnieuw`

## Visual Direction

The onboarding should reuse the current login page language rather than introducing a new visual system.

### Reuse

- the current login page shell
- the split card composition
- the white and cream surface palette
- the forest green primary action styling
- the calm Monument Gids typography and spacing rhythm

### Add

- visible step progress
- one-question-per-screen pacing
- supportive microcopy that lowers stress
- a stable right-hand reassurance panel that previews the journey

### Avoid

- multi-field form blocks
- bureaucratic language
- compliance-heavy framing
- making the first-time user feel like they entered a standard sign-up funnel

## Interaction Rules

- Each step should have one primary action.
- The primary button label stays `Volgende` on steps 1-5.
- Step 6 changes the primary button to `Account bevestigen`.
- Secondary links should stay quiet and helpful.
- Validation copy should sound human and corrective, not technical.

Example error tone:

`Deze code lijkt niet te kloppen. Kijk nog even in je mail of vraag een nieuwe aan.`

## Content Principles

- Lower stress before asking for precision.
- Speak plainly and warmly.
- Ask only for what is needed to create the account.
- Keep the monument-specific work for after entry.
- Make returning users feel recognized without turning the whole flow into a login wall.

## Implementation Notes

- The flow can likely live as a multi-step variant of the existing `/login` experience rather than as a fully separate visual surface.
- The structure should mirror the wizard rhythm used elsewhere in the product.
- Progress indication should be visible and calm, not gamified.
- The final tour can be implemented as lightweight first-run screens or guided panels after successful account setup.

## Verification

The design is successful when:

- a first-time visitor understands where to start
- a returning user can still reach login immediately
- new users only need to answer one thing at a time
- account creation ends in clear orientation rather than a dead end
- the flow feels native to Monument Gids and not like generic SaaS onboarding
