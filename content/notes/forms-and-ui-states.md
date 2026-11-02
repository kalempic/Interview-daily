---
id: forms-and-ui-states
title: Forms, empty screens, and errors
kind: note
track: Frontend
---

Forms and list pages fail in interviews when the answer is only "show an error". The useful answer is when the message appears, what it says, how it is attached to the control, and what the user can do next.

## When to show a validation error

Wait until blur or submit before showing an error on an untouched field. An empty email field is not invalid at the moment the page loads. The user has not had a chance to fill it. Showing "Invalid" immediately trains people to ignore the form.

After the field has been edited, validate on blur so they get the message when they leave the field. Always validate again on submit, because they may never blur the last field. Once an error is visible, update it as they type and clear it when the value becomes valid. Do not make them submit again just to find out they fixed it.

## How to write the message

Write a message that explains how to fix the field. "Enter an email like name@example.com" tells them the shape you expect. "Invalid" does not. "Required" is acceptable for an empty field after submit, and a format hint is better once they have typed something that does not match.

Put the message next to the field, in text, not only as a red border. Color is not the message. A red border with no text fails anyone who cannot see the color, and it fails everyone who cannot guess the rule.

## Connecting the error to the input

Connect the error with `aria-describedby` and `aria-invalid`. Give the message element an id. Set `aria-describedby` on the input to that id while the message is showing. Set `aria-invalid="true"` on the input at the same time. Remove both when the value is valid again.

The visible label stays associated with `htmlFor` or by wrapping the input. `aria-describedby` adds the error; it does not replace the label. Placeholder text still does not count as a label.

## Submit, focus, and the disabled button

On submit, move focus to the first invalid field so the user lands on the problem instead of wondering which of eight fields failed. The error for that field should already be visible.

Do not disable submit only because fields are empty. A disabled button hides the errors: the user cannot press it, so they never see what is wrong, and a screen-reader user may not know why it is disabled. Let them submit, then show the errors. Disable the button only while a request is in flight, so they cannot fire the same request twice, and say that the request is in progress.

## Loading is not an empty list

Separate loading, empty, success, and error. They are different situations and they need different UI.

A loading state says the data is on the way and reserves space so the page does not jump. It must not look like an empty list. If you render the empty card while the request is still running, people think they have no data and may leave or create a duplicate. A quiet skeleton or a single "Loading your list" line is enough. Do not flash the empty message for a fast request either: if you already have data, keep showing it during a refresh.

## What an empty state should say

Give the empty state an explanation and a next action. "No drills yet" explains the situation. "Create your first drill" is the action. An empty illustration with no sentence forces people to guess whether the page is broken. Do not invent fake rows to make the screen look full. An honest empty state is part of the product.

If there is a filter that hides every row, say that the filter matched nothing and offer to clear it. That is a different empty state from a brand-new account.

## How an error state should read

Show a plain-language error with a retry, and do not show a stack trace. "We could not load your list" is something a person can act on. A `TypeError` message is a bug report aimed at the wrong audience. Offer a retry button that runs the request again. If only one panel failed, leave the rest of the page usable, including navigation.

Log the technical detail somewhere your team can see it. Keep it off the screen the user is looking at.
