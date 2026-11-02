---
id: accessible-names
title: Accessible names and keyboard use
kind: drill
track: Frontend
minutes: 8
---

## Question

You built a custom dropdown as a `div` with a click handler. Keyboard users cannot open it, and a screen reader announces it as a plain group. How do you fix the accessible name and the keyboard behavior?

## What interviewers check

- You reach for a native element before adding ARIA.
- You can say where an accessible name comes from.
- You include keyboard operation and focus, not only a label.

## Strong answer

Prefer a native `button` or `select` when it fits. Those elements are already in the tab order and already expose a role and a name. If the design truly needs a custom widget, give the trigger a role such as `button`, and give it an accessible name from its visible text, from `aria-label`, or from `aria-labelledby` pointing at the visible label. Placeholder text is not a name.

The control must be reachable with Tab. A button operates with Enter or Space. A listbox or menu also uses arrow keys. When the popup opens, move focus into it. When it closes, return focus to the trigger. A click-only `div` fails the name, the role, and the keyboard checks together.

## Rubric

- Prefers a native button or select before a custom div
- Gives the control an accessible name from visible text, aria-label, or aria-labelledby
- Puts the control in tab order and operates it with Enter, Space, or arrow keys
- Moves focus into the popup and back to the trigger on close
