---
id: accessible-interfaces
title: Accessible names, keyboard, and focus
kind: note
track: Frontend
---

Accessibility in an interview is usually a design question in disguise: can someone operate this control without a mouse, and can they tell what it is? Start from the platform, then add ARIA only where the platform does not already do the job.

## Native elements first

A native `button` is in the tab order, activates with Enter and Space, and exposes the button role. A native `select` already has a name, a popup, and keyboard behavior. A `div` with a click handler has none of that. The first answer is to use the native element when it matches the design. Rebuild a widget only when the native one cannot express the interaction. Custom widgets are where teams lose keyboard users.

Prefer a native button or select before a custom div. That sentence is the start of a good answer, not a slogan you skip past.

## Where the accessible name comes from

The accessible name is the string assistive technology announces for a control. The best source is the visible text on the control, because what people see and what they hear stay the same. If the control has no visible text, `aria-label` can provide the name. If a visible label lives in another element, `aria-labelledby` points at that element's id and uses its text.

Placeholder text is not a name. It disappears while typing, it often has poor contrast, and it is not a label. A title attribute is a poor name. An icon button with no text and no `aria-label` is announced as a button with an empty name, which is not operable in any useful sense.

Give the control an accessible name from visible text, `aria-label`, or `aria-labelledby`.

## Keyboard operation

Anything that acts like a control must be reachable with Tab, unless it is a composite widget where arrow keys move inside it. Do not use a click handler on a non-focusable element and call that done.

A button operates with Enter or Space. A link operates with Enter. A listbox, menu, or tab list uses arrow keys to move between options, and Escape usually closes it. Tab moves to the next control on the page. It should not be the way you move between items inside a menu.

Put the control in tab order and operate it with Enter, Space, or arrow keys, matching the role you chose.

## Focus in popups

Opening a dropdown, dialog, or menu must move focus somewhere intentional. For a dialog, focus goes to the dialog or to the first useful control inside it, and Tab stays inside until it closes. For a listbox or menu, focus goes to the selected option or the first option. When the popup closes, return focus to the trigger that opened it. If you drop focus back to the document, keyboard users lose their place.

Move focus into the popup and back to the trigger on close. A screen-reader user should not have to hunt for the control they just used.

## What a click-only div gets wrong

A click-only `div` fails three checks at once. It has no role, so it is announced as a group or as nothing useful. It has no accessible name unless you add one, and a name on a generic `div` does not make it a control. It is not in the tab order, so it has no keyboard operation. Adding `cursor: pointer` does not change any of that.

If you must build the widget, set the role, the name, the tab order, the keys, and the focus movement. Then test it with a keyboard only, without a mouse, before you talk about colors.
