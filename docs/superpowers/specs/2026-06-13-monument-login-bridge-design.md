# Monument Gids Login Bridge Design

## Goal

Add a front-end-only login bridge at `/login` so homepage users land on a calm, branded sign-in screen before continuing into `/intake`.

## Scope

- Add a new public login page based on the `login-04` composition from shadcn: form plus image/media panel.
- Keep the page within the existing Monument Gids design language rather than adopting shadcn defaults.
- Route the two homepage `Inloggen` actions to `/login`.
- Let the primary login action continue into `/intake`.

## Visual Direction

- Reuse the current Monument Gids palette: white base, cream card surfaces, forest green for primary actions, restrained bronze and sage accents.
- Reuse the current `DM Sans` typography.
- Keep the surface calm and practical, with a slightly more intimate tone than the homepage hero.
- Use a real local monument-related image in the media panel to preserve the `login-04` form-and-image structure.

## Page Structure

- Outer page shell with the Monument Gids logo and a back link to `/`.
- Main auth panel split into two areas on desktop:
  - left: form card with welcome copy, email field, password field, forgot-password link, submit button, support note
  - right: media panel with local image, short reassurance copy, and trust bullets
- Stack the layout on smaller screens with the form first and the media panel second.

## Interaction

- The form is front-end-only for now.
- On submit, prevent default and navigate to `/intake`.
- The forgot-password action is non-destructive and should only reveal a short helper message.

## Implementation Notes

- Create `public/login.html`.
- Create `public/login.js` for light client-side behavior.
- Extend `public/styles.css` with a dedicated login section using shared tokens and consistent focus states.
- Update `server.mjs` so `/login` resolves to `public/login.html`.
- Update only the homepage `Inloggen` links to point at `/login`.

## Verification

- Both homepage `Inloggen` links open `/login`.
- The login page submit action continues into `/intake`.
- The login page remains legible and composed on desktop and mobile.
- The login page looks native to Monument Gids and not like an unstyled imported template.
